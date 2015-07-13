'use strict';

var util = require('util');
var dgram = require('dgram');
var EventEmitter = require('eventemitter3');
var _ = require('lodash');
var Packet = require('../lifx').packet;
var constants = require('../lifx').constants;
var utils = require('../lifx').utils;

/**
 * Creates a lifx client
 * @extends EventEmitter
 */
function Client() {
  EventEmitter.call(this);

  this.debug = false;
  this.socket = dgram.createSocket('udp4');
  this.gateways = {};
  this.bulbs = {};
  this.port = null;
  this.messagesQueue = [];
  this.sendTimer = null;
  this.discoveryTimer = null;
  this.discoveryPacketSequence = 0;
  this.sequenceNumber = 0;
  this.lightOfflineTolerance = 3;
  this.source = utils.getRandomHexString(8);
}
util.inherits(Client, EventEmitter);

/**
 * Creates a new socket and starts discovery
 * @example
 * init({debug: true}, function() {
 *   console.log('Client started');
 * })
 * @param {Object} [options] Configuration to use
 * @param {String} [options.address] The IPv4 address to bind to
 * @param {Number} [options.port] The port to bind to
 * @param {Number} [options.debug] Show debug output
 * @param {Number} [options.lightOfflineTolerance] If bulb hasn't answered for amount of discoveries it is set offline
 * @param {String} [options.source] The source to send to bulb, must be 8 chars lowercase or digit
 * @param {Function} [callback] Called after initialation
 */
Client.prototype.init = function(options, callback) {
  var defaults = {
    address: '0.0.0.0',
    port: constants.LIFX_DEFAULT_PORT,
    debug: false,
    lightOfflineTolerance: 3,
    source: '',
    startDiscovery: true
  };

  options = options || {};
  var opts = _.defaults(options, defaults);

  this.debug = opts.debug;
  this.lightOfflineTolerance = opts.lightOfflineTolerance;

  if (opts.source !== '') {
    if (typeof opts.source === 'string' && /^[0-9A-F]{8}$/.test(opts.source)) {
      this.source = opts.source;
    } else {
      throw new RangeError('LIFX source must be 8 hex chars');
    }
  }

  this.socket.on('error', function(err) {
    console.error('LIFX UDP packet error');
    console.trace(err);
    this.emit('error', err);
  }.bind(this));

  this.socket.on('message', function(msg, rinfo) {
    // Ignore own messages and false formats
    if (utils.getHostIPs().indexOf(rinfo.address) >= 0 || !Buffer.isBuffer(msg)) {
      return;
    }

    if (this.debug) {
      console.log('D - ' + msg.toString('hex') + ' < ' + rinfo.address);
    }
    // Parse packet to object
    msg = Packet.toObject(msg);

    // Convert type before emitting
    var messageTypeName = _.result(_.find(Packet.typeList, {id: msg.type}), 'name');
    if (messageTypeName !== undefined) {
      msg.type = messageTypeName;
    }

    // Process gateways if provided
    if (msg.type === 'stateService') {
      this.processDiscoveryPacket(msg, rinfo);
    }

    this.emit('message', msg, rinfo);
  }.bind(this));

  this.socket.bind(opts, function() {
    this.socket.setBroadcast(true);
    this.emit('listening');
    this.port = opts.port;
    this.sendTimer = setInterval(function() {
      if (this.messagesQueue.length > 0) {
        var msg = this.messagesQueue.pop();
        if (msg.address === undefined) {
          msg.address = '255.255.255.255';
        }
        this.socket.send(msg.data, 0, msg.data.length, this.port, msg.address);

        if (this.debug) {
          console.log('D - ' + msg.data.toString('hex') + ' > ' + msg.address);
        }
      }
    }.bind(this), constants.MESSAGE_RATE_LIMIT);
    if (typeof callback === 'function') {
      callback();
    }
  }.bind(this));

  // Start scanning
  if (opts.startDiscovery) {
    this.startDiscovery();
  }
};

/**
 * Destroy an instance
 */
Client.prototype.destroy = function() {
  this.socket.close();
};

/**
 * Start discovery of bulbs
 * This will keep the list of bulbs updated, finds new bulbs and sets bulbs
 * offline if no longer found
 */
Client.prototype.startDiscovery = function() {
  var sendDiscoveryPacket = function() {
    // Sign flag on inactive bulbs
    _.forEach(this.gateways, function(info, address) {
      if (this.gateways[address].status !== 'off') {
        var diff = this.discoveryPacketSequence - info.seenOnDiscovery;
        if (diff >= this.lightOfflineTolerance) {
          this.gateways[address].status = 'off';
          this.emit('bulb-offline', info);
        }
      }
    }, this);

    // Send the discovery packet broadcast
    this.send(Packet.create('getService', {}, this.source));

    // Keep track of a sequent number to find not answering bulbs
    if (this.discoveryPacketSequence >= Number.MAX_VALUE) {
      this.discoveryPacketSequence = 0;
    } else {
      this.discoveryPacketSequence += 1;
    }
  }.bind(this);

  this.discoveryTimer = setInterval(
    sendDiscoveryPacket,
    constants.DISCOVERY_INTERVAL
  );

  sendDiscoveryPacket();
};

/**
 * Processes a discovery report packet to update internals
 * @param  {Object} msg The discovery report package
 * @param  {Object} rinfo Remote host details
 */
Client.prototype.processDiscoveryPacket = function(msg, rinfo) {
  if (msg.service === 'udp' && msg.port === constants.LIFX_DEFAULT_PORT) {
    // Add / update the found gateway
    if (!this.gateways[rinfo.address]) {
      var gateway = {
        site: msg.site,
        id: msg.target,
        address: rinfo.address,
        port: msg.port,
        status: 'on',

        // Internals
        seenOnDiscovery: this.discoveryPacketSequence
      };
      this.gateways[rinfo.address] = gateway;
      this.emit('bulb-new', gateway);
    } else {
      if (this.gateways[rinfo.address].status === 'off') {
        this.gateways[rinfo.address].status = 'on';
        this.emit('bulb-online', this.gateways[rinfo.address]);
      }
      this.gateways[rinfo.address].seenOnDiscovery = this.discoveryPacketSequence;
    }
  }
};

/**
 * This stops the discovery process
 * It will be no longer update the state of bulbs or find new bulbs
 */
Client.prototype.stopDiscovery = function() {
  clearInterval(this.discoveryTimer);
  this.discoveryTimer = null;
};

/**
 * Send one or more LIFX message objects over the network
 * @param  {Object|Array} msg A message object or multiple with data to send
 * @return {Boolean} Success
 */
Client.prototype.send = function(msg) {
  if (typeof msg === 'object') {
    msg = [msg];
  }

  _.forEach(msg, function(messageObject) {
    var packet = {};
    // Add the target ip address if target given
    if (messageObject.target !== undefined) {
      var targetBulb = this.findLight(messageObject.target);
      if (targetBulb) {
        packet.address = targetBulb.address;
      }
    }

    packet.data = Packet.toBuffer(messageObject);
    this.messagesQueue.unshift(packet);
  }, this);

  return true;
};

/**
 * Get network address data from connection
 * @return {Object} Network address data
 */
Client.prototype.address = function() {
  try {
    var address = this.socket.address();
  } catch(e) {
    return null;
  }
  return address;
};

/**
 * Returns the list of known bulbs
 * @return {Object} List of bulbs
 */
Client.prototype.listLights = function() {
  return _.reduce(this.gateways, function(result, data) {
    result.push(
      _.omit(data, [
        // Omit internal helpers
        'seenOnDiscovery'
      ])
    );
    return result;
  }, []);
};

/**
 * Find a bulb by id or ip
 * @param {String} identifier id or ip to search for
 * @return {Object|Boolean} the bulb object or false
 */
Client.prototype.findLight = function(identifier) {
  if (typeof identifier !== 'string') {
    throw new TypeError('findBulbs expects identifier for LIFX bulb to be a string');
  }
  // There is no ip or id longer than that
  if (identifier.length > 45) {
    return false;
  }
  // Id does not contain dots or colons but ip
  if (identifier.indexOf('.') >= 0 || identifier.indexOf(':') >= 0) {
    return _.find(this.gateways, {address: identifier}) || false;
  } else {
    return _.find(this.gateways, {id: identifier}) || false;
  }
};

/**
 * Turns the given lights on
 * @param {String|Array} bulbs One or multiple bulbs to turn on
 */
Client.prototype.lightsOn = function(bulbs) {
  var packetBaseData = Packet.create('setPower', {level: 65535}, this.source);
  if (typeof bulbs === 'string') {
    bulbs = [bulbs];
  }

  _.forEach(bulbs, function(bulb) {
    var targetBulb = this.findLight(bulb);
    if (targetBulb) {
      var packetData = packetBaseData;
      packetData.target = targetBulb.id;
      this.send(packetData);
    }
  }, this);
};

/**
 * Turns the given lights off
 * @param {String|Array} bulbs One or multiple bulbs to turn off
 */
Client.prototype.lightsOff = function(bulbs) {
  var packetBaseData = Packet.create('setPower', {level: 0}, this.source);
  if (typeof bulbs === 'string') {
    bulbs = [bulbs];
  }

  _.forEach(bulbs, function(bulb) {
    var targetBulb = this.findLight(bulb);
    if (targetBulb) {
      var packetData = packetBaseData;
      packetData.target = targetBulb.id;
      this.send(packetData);
    }
  }, this);
};

exports.Client = Client;
