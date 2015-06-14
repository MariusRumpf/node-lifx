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
 * @module Lifx/Client
 * @extends EventEmitter
 */
function Client() {
  EventEmitter.call(this);

  this.debug = false;
  this.socket = dgram.createSocket('udp4');
  this.gateways = [];
  this.bulbs = {};
  this.port = null;
  this.messagesQueue = [];
  this.sendTimer = null;
  this.discoveryTimer = null;
  this.sequenceNumber = 0;
}
util.inherits(Client, EventEmitter);

/**
 * Creates a new socket and starts discovery
 * @param {Object} [options]
 * @param {string} [options.address] The IPv4 address to bind to
 * @param {number} [options.port] The port to bind to
 * @param {Function} [callback]
 */
Client.prototype.init = function(options, callback) {
  var defaults = {
    address: '0.0.0.0',
    port: constants.LIFX_DEFAULT_PORT,
    debug: false
  };

  options = options || {};
  var opts = _.defaults(options, defaults);

  this.debug = opts.debug;

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
      console.log(' U < ' + msg.toString('hex'));
    }
    // Parse packet to object
    msg = Packet.toObject(msg);
    if (msg.type === _.result(_.find(Packet.typeList, {name: 'stateService'}), 'id')) {
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
          this.socket.send(msg.data, 0, msg.data.length, this.port, '255.255.255.255');
        } else {
          this.socket.send(msg.data, 0, msg.data.length, this.port, msg.address);
        }
        if (this.debug) {
          console.log(' U > ' + msg.data.toString('hex'));
        }
      }
    }.bind(this), constants.MESSAGE_RATE_LIMIT);
    if (typeof callback === 'function') {
      callback();
    }
  }.bind(this));

  // Start scanning
  this.startDiscovery();
};

/**
 * Destroy an instance
 */
Client.prototype.destroy = function() {
  this.socket.close();
};

/**
 * Start all network activity
 */
Client.prototype.startDiscovery = function() {
  this.discoveryTimer = setInterval(function() {
    this.send(Packet.create('getService', '3e805108'));
  }.bind(this), constants.DISCOVERY_INTERVAL);
};

/**
 * Processes a discovery report packet to update internals
 * @param  {Object} msg The discovery report package
 * @param  {Object} rinfo Remote host details
 */
Client.prototype.processDiscoveryPacket = function(msg, rinfo) {
  if (!this.gateways[rinfo.address] && msg.service === 'udp' && msg.port === constants.LIFX_DEFAULT_PORT) {
    var gateway = {
      site: msg.site,
      source: msg.source,
      address: rinfo.address
    };
    this.gateways[rinfo.address] = gateway;
    this.emit('gateway', gateway);
  }
};

/**
 * Stop all network activity
 */
Client.prototype.stopDiscovery = function() {
  clearInterval(this.discoveryTimer);
};

/**
 * Sends a message
 * @param  {Object} msg A message object with data to send
 * @return {Boolean} Success
 */
Client.prototype.send = function(msg) {
  var packet = {};
  packet.data = Packet.toBuffer(msg);
  // @TODO packet.address
  this.messagesQueue.unshift(packet);
  return true;
};

/**
 * Get network address data from used udp socket
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

exports.Client = Client;
