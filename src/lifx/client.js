'use strict';

const util = require('util');
const dgram = require('dgram');
const EventEmitter = require('eventemitter3');
const {defaults, isArray, result, find, bind, forEach} = require('lodash');
const Packet = require('../lifx').Packet;
const {Light, constants, utils} = require('../lifx');

/**
 * Creates a lifx client
 * @extends EventEmitter
 */
class Client {
  constructor() {
    EventEmitter.call(this);

    this.debug = false;
    this.socket = dgram.createSocket('udp4');
    this.isSocketBound = false;
    this.devices = {};
    this.port = null;
    this.messagesQueue = [];
    this.sendTimer = null;
    this.discoveryTimer = null;
    this.discoveryPacketSequence = 0;
    this.messageHandlers = [{
      type: 'stateService',
      callback: this.processDiscoveryPacket
    }, {
      type: 'stateLabel',
      callback: this.processLabelPacket
    }, {
      type: 'stateLight',
      callback: this.processLabelPacket
    }];
    this.sequenceNumber = 0;
    this.lightOfflineTolerance = 3;
    this.messageHandlerTimeout = 45000; // 45 sec
    this.resendPacketDelay = 150;
    this.resendMaxTimes = 5;
    this.source = utils.getRandomHexString(8);
    this.broadcastAddress = '255.255.255.255';
  }

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
   * @param {Array} [options.lights] Pre set list of ip addresses of known addressable lights
   * @param {String} [options.broadcast] The broadcast address to use for light discovery
   * @param {Number} [options.sendPort] The port to send messages to
   * @param {Function} [callback] Called after initialation
   */
  init(options, callback) {
    const defaultOpts = {
      address: '0.0.0.0',
      port: 0,
      debug: false,
      lightOfflineTolerance: 3,
      messageHandlerTimeout: 45000,
      source: '',
      startDiscovery: true,
      lights: [],
      broadcast: '255.255.255.255',
      sendPort: constants.LIFX_DEFAULT_PORT,
      resendPacketDelay: 150,
      resendMaxTimes: 3
    };

    options = options || {};
    const opts = defaults(options, defaultOpts);

    if (typeof opts.port !== 'number') {
      throw new TypeError('LIFX Client port option must be a number');
    } else if (opts.port > 65535 || opts.port < 0) {
      throw new RangeError('LIFX Client port option must be between 0 and 65535');
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

    if (typeof opts.resendPacketDelay !== 'number') {
      throw new TypeError('LIFX Client resendPacketDelay option must be a number');
    }
    this.resendPacketDelay = opts.resendPacketDelay;

    if (typeof opts.resendMaxTimes !== 'number') {
      throw new TypeError('LIFX Client resendMaxTimes option must be a number');
    }
    this.resendMaxTimes = opts.resendMaxTimes;

    if (typeof opts.broadcast !== 'string') {
      throw new TypeError('LIFX Client broadcast option must be a string');
    } else if (!utils.isIpv4Format(opts.broadcast)) {
      throw new TypeError('LIFX Client broadcast option does only allow IPv4 address format');
    }
    this.broadcastAddress = opts.broadcast;

    if (typeof opts.sendPort !== 'number') {
      throw new TypeError('LIFX Client sendPort option must be a number');
    } else if (opts.sendPort > 65535 || opts.sendPort < 1) {
      throw new RangeError('LIFX Client sendPort option must be between 1 and 65535');
    }
    this.sendPort = opts.sendPort;

    if (!isArray(opts.lights)) {
      throw new TypeError('LIFX Client lights option must be an array');
    } else {
      opts.lights.forEach(function(light) {
        if (!utils.isIpv4Format(light)) {
          throw new TypeError('LIFX Client lights option array element \'' + light + '\' is not expected IPv4 format');
        }
      });
    }

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

    this.socket.on('error', (err) => {
      this.isSocketBound = false;
      console.error('LIFX Client UDP error');
      console.trace(err);
      this.socket.close();
      this.emit('error', err);
    });

    this.socket.on('message', (msg, rinfo) => {
      // Ignore own messages and false formats
      if (utils.getHostIPs().indexOf(rinfo.address) >= 0 || !Buffer.isBuffer(msg)) {
        return;
      }

      /* istanbul ignore if  */
      if (this.debug) {
        console.log('DEBUG - ' + msg.toString('hex') + ' from ' + rinfo.address);
      }

      // Parse packet to object
      const parsedMsg = Packet.toObject(msg);

      // Check if packet is read successfully
      if (parsedMsg instanceof Error) {
        console.error('LIFX Client invalid packet header error');
        console.error('Packet: ', msg.toString('hex'));
        console.trace(parsedMsg);
      } else {
        // Convert type before emitting
        const messageTypeName = result(find(Packet.typeList, {
          id: parsedMsg.type
        }), 'name');
        if (messageTypeName !== undefined) {
          parsedMsg.type = messageTypeName;
        }
        // Check for handlers of given message and rinfo
        this.processMessageHandlers(parsedMsg, rinfo);

        this.emit('message', parsedMsg, rinfo);
      }
    });

    this.socket.bind(opts.port, opts.address, () => {
      this.isSocketBound = true;
      this.socket.setBroadcast(true);
      this.emit('listening');
      this.port = opts.port;

      // Start scanning
      if (opts.startDiscovery) {
        this.startDiscovery(opts.lights);
      }
      if (typeof callback === 'function') {
        return callback();
      }
    });
  }

  /**
   * Destroy an instance
   */
  destroy() {
    this.stopDiscovery();
    this.stopSendingProcess();
    if (this.isSocketBound) {
      this.socket.close();
    }
  }

  /**
   * Sends a packet from the messages queue or stops the sending process
   * if queue is empty
   **/
  sendingProcess = () => {
    if (!this.isSocketBound) {
      this.stopSendingProcess();
      console.log('LIFX Client stopped sending due to unbound socket');
      return;
    }

    if (this.messagesQueue.length > 0) {
      const msg = this.messagesQueue.pop();
      if (msg.address === undefined) {
        msg.address = this.broadcastAddress;
      }
      if (msg.transactionType === constants.PACKET_TRANSACTION_TYPES.ONE_WAY) {
        this.socket.send(msg.data, 0, msg.data.length, this.sendPort, msg.address);
        /* istanbul ignore if  */
        if (this.debug) {
          console.log('DEBUG - ' + msg.data.toString('hex') + ' to ' + msg.address);
        }
      } else if (msg.transactionType === constants.PACKET_TRANSACTION_TYPES.REQUEST_RESPONSE) {
        if (msg.timesSent < this.resendMaxTimes) {
          if (Date.now() > (msg.timeLastSent + this.resendPacketDelay)) {
            this.socket.send(msg.data, 0, msg.data.length, this.sendPort, msg.address);
            msg.timesSent += 1;
            msg.timeLastSent = Date.now();
            /* istanbul ignore if  */
            if (this.debug) {
              console.log(
                'DEBUG - ' + msg.data.toString('hex') + ' to ' + msg.address +
                ', send ' + msg.timesSent + ' time(s)'
              );
            }
          }
          // Add to the end of the queue again
          this.messagesQueue.unshift(msg);
        } else {
          this.messageHandlers.forEach((handler, hdlrIndex) => {
            if (handler.type === 'acknowledgement' && handler.sequenceNumber === msg.sequence) {
              this.messageHandlers.splice(hdlrIndex, 1);
              const err = new Error('No LIFX response after max resend limit of ' + this.resendMaxTimes);
              return handler.callback(err, null, null);
            }
          });
        }
      }
    } else {
      this.stopSendingProcess();
    }
  }

  /**
   * Starts the sending of all packages in the queue
   */
  startSendingProcess() {
    if (this.sendTimer === null) { // Already running?
      this.sendTimer = setInterval(this.sendingProcess, constants.MESSAGE_RATE_LIMIT);
    }
  }

  /**
   * Stops sending of all packages in the queue
   */
  stopSendingProcess() {
    if (this.sendTimer !== null) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
    }
  }

  /**
   * Start discovery of lights
   * This will keep the list of lights updated, finds new lights and sets lights
   * offline if no longer found
   * @param {Array} [lights] Pre set list of ip addresses of known addressable lights to request directly
   */
  startDiscovery(lights) {
    lights = lights || [];
    const sendDiscoveryPacket = () => {
      // Sign flag on inactive lights
      forEach(this.devices, bind(function(info, deviceId) {
        if (this.devices[deviceId].status !== 'off') {
          const diff = this.discoveryPacketSequence - info.seenOnDiscovery;
          if (diff >= this.lightOfflineTolerance) {
            this.devices[deviceId].status = 'off';
            this.emit('bulb-offline', info); // deprecated
            this.emit('light-offline', info);
          }
        }
      }, this));

      // Send a discovery packet broadcast
      this.send(Packet.create('getService', {}, this.source));

      // Send a discovery packet to each light given directly
      lights.forEach(function(lightAddress) {
        const msg = Packet.create('getService', {}, this.source);
        msg.address = lightAddress;
        this.send(msg);
      }, this);

      // Keep track of a sequent number to find not answering lights
      if (this.discoveryPacketSequence >= Number.MAX_VALUE) {
        this.discoveryPacketSequence = 0;
      } else {
        this.discoveryPacketSequence += 1;
      }
    };

    this.discoveryTimer = setInterval(
      sendDiscoveryPacket,
      constants.DISCOVERY_INTERVAL
    );

    sendDiscoveryPacket();
  }

  /**
   * Checks all registered message handlers if they request the given message
   * @param  {Object} msg message to check handler for
   * @param  {Object} rinfo rinfo address info to check handler for
   */
  processMessageHandlers(msg, rinfo) {
    // Process only packages for us
    if (msg.source.toLowerCase() !== this.source.toLowerCase()) {
      return;
    }
    // We check our message handler if the answer received is requested
    this.messageHandlers.forEach(function(handler, hdlrIndex) {
      if (msg.type === handler.type) {
        if (handler.sequenceNumber !== undefined) {
          if (handler.sequenceNumber === msg.sequence) {
            // Remove if specific packet was request, since it should only be called once
            this.messageHandlers.splice(hdlrIndex, 1);
            this.messagesQueue.forEach((packet, packetIndex) => {
              if (packet.transactionType === constants.PACKET_TRANSACTION_TYPES.REQUEST_RESPONSE &&
                packet.sequence === msg.sequence) {
                this.messagesQueue.splice(packetIndex, 1);
              }
            });

            // Call the function requesting the packet
            return handler.callback(null, msg, rinfo);
          }
        } else {
          // Call the function requesting the packet
          return handler.callback(null, msg, rinfo);
        }
      }

      // We want to call expired request handlers for specific packages after the
      // messageHandlerTimeout set in options, to specify an error
      if (handler.sequenceNumber !== undefined) {
        if (Date.now() > (handler.timestamp + this.messageHandlerTimeout)) {
          this.messageHandlers.splice(hdlrIndex, 1);

          const err = new Error('No LIFX response in time');
          return handler.callback(err, null, null);
        }
      }
    }, this);
  }

  /**
   * Processes a discovery report packet to update internals
   * @param  {Object} err Error if existant
   * @param  {Object} msg The discovery report package
   * @param  {Object} rinfo Remote host details
   */
  processDiscoveryPacket = (err, msg, rinfo) => {
    if (err) {
      return;
    }
    if (msg.service === 'udp' && msg.port === constants.LIFX_DEFAULT_PORT) {
      // Add / update the found gateway
      if (!this.devices[msg.target]) {
        const lightDevice = new Light({
          client: this,
          id: msg.target,
          address: rinfo.address,
          port: msg.port,
          seenOnDiscovery: this.discoveryPacketSequence
        });
        this.devices[msg.target] = lightDevice;

        // Request label
        const labelRequest = Packet.create('getLabel', {}, this.source);
        labelRequest.target = msg.target;
        this.send(labelRequest);

        this.emit('bulb-new', lightDevice); // deprecated
        this.emit('light-new', lightDevice);
      } else {
        if (this.devices[msg.target].status === 'off') {
          this.devices[msg.target].status = 'on';
          this.emit('bulb-online', this.devices[msg.target]); // deprecated
          this.emit('light-online', this.devices[msg.target]);
        }
        this.devices[msg.target].address = rinfo.address;
        this.devices[msg.target].seenOnDiscovery = this.discoveryPacketSequence;
      }
    }
  }

  /**
   * Processes a state label packet to update internals
   * @param {Object} err Error if existant
   * @param {Object} msg The state label package
   */
  processLabelPacket = (err, msg) => {
    if (err) {
      return;
    }
    if (this.devices[msg.target] !== undefined) {
      this.devices[msg.target].label = msg.label;
    }
  }

  /**
   * This stops the discovery process
   * The client will be no longer updating the state of lights or find lights
   */
  stopDiscovery() {
    clearInterval(this.discoveryTimer);
    this.discoveryTimer = null;
  }

  /**
   * Send a LIFX message objects over the network
   * @param  {Object} msg A message object or multiple with data to send
   * @param  {Function} [callback] Function to handle error and success after send
   * @return {Number} The sequence number of the request
   */
  send(msg, callback) {
    const packet = {
      timeCreated: Date.now(),
      timeLastSent: 0,
      timesSent: 0,
      transactionType: constants.PACKET_TRANSACTION_TYPES.ONE_WAY
    };

    // Add the target ip address if target given
    if (msg.address !== undefined) {
      packet.address = msg.address;
    }
    if (msg.target !== undefined) {
      const targetBulb = this.light(msg.target);
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
    packet.sequence = this.sequenceNumber;
    if (typeof callback === 'function') {
      msg.ackRequired = true;
      this.addMessageHandler('acknowledgement', callback, msg.sequence);
      packet.transactionType = constants.PACKET_TRANSACTION_TYPES.REQUEST_RESPONSE;
    }
    packet.data = Packet.toBuffer(msg);
    this.messagesQueue.unshift(packet);
    this.startSendingProcess();

    return this.sequenceNumber;
  }

  /**
   * Get network address data from connection
   * @return {Object} Network address data
   */
  address() {
    let address = null;
    try {
      address = this.socket.address();
    } catch (e) {}
    return address;
  }

  /**
   * Sets debug on or off at runtime
   * @param  {Boolean} debug debug messages on
   */
  setDebug(debug) {
    if (typeof debug !== 'boolean') {
      throw new TypeError('LIFX Client setDebug expects boolean as parameter');
    }
    this.debug = debug;
  }

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
  addMessageHandler(type, callback, sequenceNumber) {
    if (typeof type !== 'string') {
      throw new TypeError('LIFX Client addMessageHandler expects type parameter to be string');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('LIFX Client addMessageHandler expects callback parameter to be a function');
    }

    const typeName = find(Packet.typeList, {
      name: type
    });
    if (typeName === undefined) {
      throw new RangeError('LIFX Client addMessageHandler unknown packet type: ' + type);
    }

    const handler = {
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
  }

  /**
   * Returns the list of all known lights
   * @example client.lights()
   * @param {String} [status='on'] Status to filter for, empty string for all
   * @return {Array} Lights
   */
  lights(status) {
    if (status === undefined) {
      status = 'on';
    } else if (typeof status !== 'string') {
      throw new TypeError('LIFX Client lights expects status to be a string');
    }

    if (status.length > 0) {
      if (status !== 'on' && status !== 'off') {
        throw new TypeError('Lifx Client lights expects status to be \'on\', \'off\' or \'\'');
      }

      const result = [];
      forEach(this.devices, function(light) {
        if (light.status === status) {
          result.push(light);
        }
      });
      return result;
    }

    return this.devices;
  }

  /**
   * Find a light by label, id or ip
   * @param {String} identifier label, id or ip to search for
   * @return {Object|Boolean} the light object or false if not found
   */
  light(identifier) {
    let result;
    if (typeof identifier !== 'string') {
      throw new TypeError('LIFX Client light expects identifier for LIFX light to be a string');
    }

    // There is no ip or id longer than 45 chars, no label longer than 32 bit
    if (identifier.length > 45 && Buffer.byteLength(identifier, 'utf8') > 32) {
      return false;
    }

    // Dots or colons is high likely an ip
    if (identifier.indexOf('.') >= 0 || identifier.indexOf(':') >= 0) {
      result = find(this.devices, {address: identifier}) || false;
      if (result !== false) {
        return result;
      }
    }

    // Search id
    result = find(this.devices, {id: identifier}) || false;
    if (result !== false) {
      return result;
    }

    // Search label
    result = find(this.devices, {label: identifier}) || false;

    return result;
  }
}

util.inherits(Client, EventEmitter);

module.exports = Client;
