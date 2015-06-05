'use strict';

var util = require('util');
var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;
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
  var self = this;
  var defaults = {
    address: '0.0.0.0',
    port: constants.LIFX_DEFAULT_PORT
  };

  options = options || {};
  var opts = _.defaults(options, defaults);

  this.socket.on('error', function (err) {
    console.error('LIFX UDP packet error');
    console.trace(err);
    self.emit('error', err);
  });

  this.socket.on('message', function(msg, rinfo) {
    // Ignore own messages
    if (utils.getHostIPs().indexOf(rinfo.address) >= 0) {
      return;
    }

    console.log(' U < ' + msg.toString('hex'));
    // Parse packet to object
    msg = Packet.toObject(msg);
    if (msg.type === Packet.typeList.statePanGateway) {
      self.processDiscoveryPacket(msg, rinfo);
    }
    self.emit('message', msg, rinfo);
  });

  this.socket.bind(opts, function() {
    self.socket.setBroadcast(true);
    self.emit('listening');
    self.port = opts.port;
    self.sendTimer = setInterval(function() {
      if (self.messagesQueue.length > 0) {
        var msg = self.messagesQueue.pop();
        if (msg.address === undefined) {
          self.socket.send(msg.data, 0, msg.data.length, self.port, '255.255.255.255');
        } else {
          self.socket.send(msg.data, 0, msg.data.length, self.port, msg.address);
        }
        console.log(' U > ' + msg.data.toString('hex'));
      }
    }, constants.MESSAGE_RATE_LIMIT);
    if (typeof callback === 'function') {
      callback();
    }
  });

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
  var self = this;
  this.discoveryTimer = setInterval(function() {
    // @TODO Get from Packet as getPANGateway
    self.send({
      size: 36,
      addressable: true,
      tagged: true,
      protocolVersion: constants.PROTOCOL_VERSION_CURRENT,
      source: '3e805108', // @TODO Provide correct source
      type: 2
    });
  }, constants.DISCOVERY_INTERVAL);
};

/**
 * Processes a discovery report packet to update internals
 * @param  {Object} msg The discovery report package
 */
Client.prototype.processDiscoveryPacket = function(msg, rinfo) {
  console.log('Discovery packet', msg, rinfo);
  // @TODO check correct saving format
  if (!this.gateways[rinfo.address]) {
    var gateway = {
      site: msg.site,
      source: msg.source
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
