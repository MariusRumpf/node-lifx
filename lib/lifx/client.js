'use strict';

var util = require('util');
var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Packet = require('../lifx').Packet;
var constants = require('../lifx').constants;

/**
 * Creates a lifx client
 * @module Lifx/Client
 * @extends EventEmitter
 */
function Client() {
  EventEmitter.call(this);

  this.socket = dgram.createSocket('udp4');
  this.gateways = {};
  this.bulbs = {};
  this.scanning = false;
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
    console.log(' U- ' + msg.toString('hex'));
    // Parse packet to object
    var packet = new Packet(msg);
    msg = packet.toObject();
    self.emit('message', msg, rinfo);
  });

  this.socket.bind(opts, function() {
    self.socket.setBroadcast(true);
    self.emit('listening');
    if (typeof callback === 'function') {
      callback();
    }
  });

  // Start scanning
  this.start();
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
Client.prototype.start = function() {
  this.scanning = true;
};

/**
 * Stop all network activity
 */
Client.prototype.stop = function() {
  this.scanning = false;
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
