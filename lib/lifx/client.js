'use strict';

var util = require('util');
var dgram = require('dgram');
var EventEmitter = require('eventemitter3');
var _ = require('lodash');
var Packet = require('../lifx').packet;
var Light = require('../lifx').Light;
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
  this.devices = {};
  this.bulbs = {};
  this.port = null;
  this.messagesQueue = [];
  this.sendTimer = null;
  this.discoveryTimer = null;
  this.discoveryPacketSequence = 0;
  this.messageHandlers = [{
    type: 'stateService',
    callback: this.processDiscoveryPacket.bind(this)
  }];
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

    // Check for handlers of given message and rinfo
    this.processMessageHandlers(msg, rinfo);

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
    _.forEach(this.devices, function(info, address) {
      if (this.devices[address].status !== 'off') {
        var diff = this.discoveryPacketSequence - info.seenOnDiscovery;
        if (diff >= this.lightOfflineTolerance) {
          this.devices[address].status = 'off';
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
 * Checks all registered message handlers if they request the given message
 * @param  {Object} msg message to check handler for
 * @param  {Object} rinfo rinfo address info to check handler for
 */
Client.prototype.processMessageHandlers = function(msg, rinfo) {
  // We check our message handler if the answer received is requested
  this.messageHandlers.forEach(function(handler, index) {
    if (msg.type === handler.type) {
      // Remove if specific packet was request, since it should only be called once
      if (handler.sequenceNumber !== undefined) {
        this.messageHandlers.splice(index, 1);
      }

      // Call the function requesting the packet
      handler.callback(msg, rinfo);
    }
  }, this);
};

/**
 * Processes a discovery report packet to update internals
 * @param  {Object} msg The discovery report package
 * @param  {Object} rinfo Remote host details
 */
Client.prototype.processDiscoveryPacket = function(msg, rinfo) {
  if (msg.service === 'udp' && msg.port === constants.LIFX_DEFAULT_PORT) {
    // Add / update the found gateway
    if (!this.devices[rinfo.address]) {
      var lightDevice = new Light({
        client: this,
        id: msg.target,
        address: rinfo.address,
        port: msg.port,
        seenOnDiscovery: this.discoveryPacketSequence
      });
      this.devices[rinfo.address] = lightDevice;
      this.emit('bulb-new', lightDevice);
    } else {
      if (this.devices[rinfo.address].status === 'off') {
        this.devices[rinfo.address].status = 'on';
        this.emit('bulb-online', this.devices[rinfo.address]);
      }
      this.devices[rinfo.address].seenOnDiscovery = this.discoveryPacketSequence;
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
 * Send a LIFX message objects over the network
 * @param  {Object} msg A message object or multiple with data to send
 * @return {Number} The sequence number of the request
 */
Client.prototype.send = function(msg) {
  var packet = {};

  // Add the target ip address if target given
  if (msg.target !== undefined) {
    var targetBulb = this.light(msg.target);
    if (targetBulb) {
      packet.address = targetBulb.address;
      if (this.sequenceNumber > 254) {
        this.sequenceNumber = 1;
      } else {
        this.sequenceNumber += 1;
      }
    }
  }

  msg.sequence = this.sequenceNumber;
  packet.data = Packet.toBuffer(msg);
  this.messagesQueue.unshift(packet);

  return this.sequenceNumber;
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
 * Adds a message handler that calls a function when the requested
 * info was received
 * @param {String} type A type of packet to listen for, like stateLight
 * @param {Function} callback the function to call if the packet was received,
 *                   this will be called with parameters msg and rinfo
 * @param {Number} [sequenceNumber] Expects a specific sequenceNumber on which will
 *                                  be called, this will call it only once. If not
 *                                  given the callback handler is permanent
 */
Client.prototype.addMessageHandler = function(type, callback, sequenceNumber) {
  var handler = {
    type: type,
    callback: callback.bind(this)
  };

  if (sequenceNumber !== undefined) {
    if (typeof sequenceNumber !== 'number') {
      throw new TypeError('Lifx Client.addMessageHandler expects sequenceNumber to be a integer');
    } else {
      handler.sequenceNumber = sequenceNumber;
    }
  }

  this.messageHandlers.push(handler);
};

/**
 * Returns the list of known bulbs
 * @return {Object} List of bulbs
 */
Client.prototype.lights = function() {
  var result = [];
  _.forEach(this.devices, function(light) {
    result.push({
      id: light.id,
      address: light.address,
      port: light.port,
      status: light.status
    });
  });
  return result;
};

/**
 * Find a bulb by id or ip
 * @param {String} identifier id or ip to search for
 * @return {Object|Boolean} the bulb object or false
 */
Client.prototype.light = function(identifier) {
  if (typeof identifier !== 'string') {
    throw new TypeError('light expects identifier for LIFX bulb to be a string');
  }
  // There is no ip or id longer than that
  if (identifier.length > 45) {
    return false;
  }
  // Id does not contain dots or colons but ip
  if (identifier.indexOf('.') >= 0 || identifier.indexOf(':') >= 0) {
    return _.find(this.devices, {address: identifier}) || false;
  } else {
    return _.find(this.devices, {id: identifier}) || false;
  }
};

exports.Client = Client;
