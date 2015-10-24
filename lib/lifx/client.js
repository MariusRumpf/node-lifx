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
  this.port = null;
  this.messagesQueue = [];
  this.sendTimer = null;
  this.discoveryTimer = null;
  this.discoveryPacketSequence = 0;
  this.messageHandlers = [{
    type: 'stateService',
    callback: this.processDiscoveryPacket.bind(this)
  }, {
    type: 'stateLabel',
    callback: this.processLabelPacket.bind(this)
  }, {
    type: 'stateLight',
    callback: this.processLabelPacket.bind(this)
  }];
  this.sequenceNumber = 0;
  this.lightOfflineTolerance = 3;
  this.messageHandlerTimeout = 45000; // 45 sec
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
 * @param {Boolean} [options.debug] Show debug output
 * @param {Number} [options.lightOfflineTolerance] If light hasn't answered for amount of discoveries it is set offline
 * @param {Number} [options.messageHandlerTimeout] Message handlers not called will be removed after this delay in ms
 * @param {String} [options.source] The source to send to light, must be 8 chars lowercase or digit
 * @param {Boolean} [options.startDiscovery] Weather to start discovery after initialization or not
 * @param {Function} [callback] Called after initialation
 */
Client.prototype.init = function(options, callback) {
  var defaults = {
    address: '0.0.0.0',
    port: constants.LIFX_DEFAULT_PORT,
    debug: false,
    lightOfflineTolerance: 3,
    messageHandlerTimeout: 45000,
    source: '',
    startDiscovery: true
  };

  options = options || {};
  var opts = _.defaults(options, defaults);

  if (typeof opts.port !== 'number') {
    throw new TypeError('LIFX Client port option must be a number');
  }

  if (typeof opts.debug !== 'boolean') {
    throw new TypeError('LIFX Client debug option must be a boolean');
  }
  this.debug = opts.debug;

  if (typeof opts.lightOfflineTolerance !== 'number') {
    throw new TypeError('LIFX Client lightOfflineTolerance option must be a number');
  }
  this.lightOfflineTolerance = opts.lightOfflineTolerance;

  if (typeof opts.messageHandlerTimeout !== 'number') {
    throw new TypeError('LIFX Client messageHandlerTimeout option must be a number');
  }
  this.messageHandlerTimeout = opts.messageHandlerTimeout;

  if (opts.source !== '') {
    if (typeof opts.source === 'string') {
      if (/^[0-9A-F]{8}$/.test(opts.source)) {
        this.source = opts.source;
      } else {
        throw new RangeError('LIFX Client source option must be 8 hex chars');
      }
    } else {
      throw new TypeError('LIFX Client source option must be given as string');
    }
  }

  this.socket.on('error', function(err) {
    console.error('LIFX Client UDP packet error');
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

  this.socket.bind(opts.port, opts.address, function() {
    this.socket.setBroadcast(true);
    this.emit('listening');
    this.port = opts.port;
    if (typeof callback === 'function') {
      return callback();
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
 * Starts the sending of all packages in the queue until empty
 */
Client.prototype.startSendingProcess = function() {
  if (this.sendTimer === null) { // Already running?
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
      } else if (this.sendTimer !== null) {
        clearInterval(this.sendTimer);
        this.sendTimer = null;
      }
    }.bind(this), constants.MESSAGE_RATE_LIMIT);
  }
};

/**
 * Start discovery of lights
 * This will keep the list of lights updated, finds new lights and sets lights
 * offline if no longer found
 */
Client.prototype.startDiscovery = function() {
  var sendDiscoveryPacket = function() {
    // Sign flag on inactive lights
    _.forEach(this.devices, function(info, address) {
      if (this.devices[address].status !== 'off') {
        var diff = this.discoveryPacketSequence - info.seenOnDiscovery;
        if (diff >= this.lightOfflineTolerance) {
          this.devices[address].status = 'off';
          this.emit('bulb-offline', info); // deprecated
          this.emit('light-offline', info);
        }
      }
    }, this);

    // Send the discovery packet broadcast
    this.send(Packet.create('getService', {}, this.source));

    // Keep track of a sequent number to find not answering lights
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
      if (handler.sequenceNumber !== undefined) {
        if (handler.sequenceNumber === msg.sequence) {
          // Remove if specific packet was request, since it should only be called once
          this.messageHandlers.splice(index, 1);

          // Call the function requesting the packet
          handler.callback(null, msg, rinfo);
        }
      } else {
        // Call the function requesting the packet
        handler.callback(null, msg, rinfo);
      }
    }

    // We want to call expired request handlers for specific packages after the
    // messageHandlerTimeout set in options, to specify an error
    if (handler.sequenceNumber !== undefined) {
      if (Date.now() > (handler.timestamp + this.messageHandlerTimeout)) {
        this.messageHandlers.splice(index, 1);

        var err = new Error('No LIFX response in time');
        handler.callback(err, null, null);
      }
    }
  }, this);
};

/**
 * Processes a discovery report packet to update internals
 * @param  {Object} err Error if existant
 * @param  {Object} msg The discovery report package
 * @param  {Object} rinfo Remote host details
 */
Client.prototype.processDiscoveryPacket = function(err, msg, rinfo) {
  if (err) {
    return;
  }
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

      // Request label
      var labelRequest = Packet.create('getLabel', {}, this.source);
      labelRequest.target = msg.target;
      this.send(labelRequest);

      this.emit('bulb-new', lightDevice); // deprecated
      this.emit('light-new', lightDevice);
    } else {
      if (this.devices[rinfo.address].status === 'off') {
        this.devices[rinfo.address].status = 'on';
        this.emit('bulb-online', this.devices[rinfo.address]); // deprecated
        this.emit('light-online', this.devices[rinfo.address]);
      }
      this.devices[rinfo.address].seenOnDiscovery = this.discoveryPacketSequence;
    }
  }
};

/**
 * Processes a state label packet to update internals
 * @param {Object} err Error if existant
 * @param {Object} msg The state label package
 * @param {Object} rinfo Remote host details
 */
Client.prototype.processLabelPacket = function(err, msg, rinfo) {
  if (err) {
    return;
  }
  if (this.devices[rinfo.address] !== undefined) {
    this.devices[rinfo.address].label = msg.label;
  }
};

/**
 * This stops the discovery process
 * The client will be no longer updating the state of lights or find lights
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
      // If we would exceed the max value for the int8 field start over again
      if (this.sequenceNumber >= constants.PACKET_HEADER_SEQUENCE_MAX) {
        this.sequenceNumber = 0;
      } else {
        this.sequenceNumber += 1;
      }
    }
  }

  msg.sequence = this.sequenceNumber;
  packet.data = Packet.toBuffer(msg);
  this.messagesQueue.unshift(packet);
  this.startSendingProcess();

  return this.sequenceNumber;
};

/**
 * Get network address data from connection
 * @return {Object} Network address data
 */
Client.prototype.address = function() {
  var address = null;
  try {
    address = this.socket.address();
  } catch (e) {}
  return address;
};

/**
 * Sets debug on or off at runtime
 * @param  {boolean} debug debug messages on
 */
Client.prototype.setDebug = function(debug) {
  if (typeof debug !== 'boolean') {
    throw new TypeError('LIFX Client setDebug expects boolean as parameter');
  }
  this.debug = debug;
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
    callback: callback.bind(this),
    timestamp: Date.now()
  };

  if (sequenceNumber !== undefined) {
    if (typeof sequenceNumber !== 'number') {
      throw new TypeError('LIFX Client addMessageHandler expects sequenceNumber to be a integer');
    } else {
      handler.sequenceNumber = sequenceNumber;
    }
  }

  this.messageHandlers.push(handler);
};

/**
 * Returns the list of all known lights
 * @param {String} [status='on'] Status to filter for, empty string for all
 * @return {Array} Lights
 */
Client.prototype.lights = function(status) {
  if (status === undefined) {
    status = 'on';
  } else if (typeof status !== 'string') {
    throw new TypeError('LIFX Client lights expects status to be a string');
  }

  if (status.length > 0) {
    if (status !== 'on' && status !== 'off') {
      throw new TypeError('Lifx Client lights expects status to be \'on\', \'off\' or \'\'');
    }

    var result = [];
    _.forEach(this.devices, function(light) {
      if (light.status === status) {
        result.push(light);
      }
    });
    return result;
  }

  return this.devices;
};

/**
 * Find a light by label, id or ip
 * @param {String} identifier label, id or ip to search for
 * @return {Object|Boolean} the light object or false if not found
 */
Client.prototype.light = function(identifier) {
  var result;
  if (typeof identifier !== 'string') {
    throw new TypeError('LIFX Client light expects identifier for LIFX light to be a string');
  }

  // There is no ip or id longer than 45 chars, no label longer than 32 bit
  if (identifier.length > 45 && Buffer.byteLength(identifier, 'utf8') > 32) {
    return false;
  }

  // Dots or colons is high likely an ip
  if (identifier.indexOf('.') >= 0 || identifier.indexOf(':') >= 0) {
    result = _.find(this.devices, {address: identifier}) || false;
    if (result !== false) {
      return result;
    }
  }

  // Search id
  result = _.find(this.devices, {id: identifier}) || false;
  if (result !== false) {
    return result;
  }

  // Search label
  result = _.find(this.devices, {label: identifier}) || false;

  return result;
};

exports.Client = Client;
