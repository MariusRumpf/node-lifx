'use strict';

var utils = require('../../lifx').utils;

var Packet = {
  size: 24
};

Packet.parseNanoseconds = function(buf) {
  if (buf.length !== 8) {
    throw new Error('Invalid length given for nanoseconds field');
  }

  var low = buf.readUInt32LE(0);
  var high = buf.readUInt32LE(4);

  return (high * 2**32 + low) / 1.0E9;
};

/**
 * Converts packet specific data from a buffer to an object
 * @param  {Buffer} buf Buffer containing only packet specific data no header
 * @return {Object}     Information contained in packet
 */
Packet.toObject = function(buf) {
  var obj = {};
  var offset = 0;

  // Check length
  if (buf.length !== this.size) {
    throw new Error('Invalid length given for stateInfo LIFX packet');
  }

  obj.time = this.parseNanoseconds(utils.readUInt64LE(buf, offset));
  offset += 8;

  obj.uptime = this.parseNanoseconds(utils.readUInt64LE(buf, offset));
  offset += 8;

  obj.downtime = this.parseNanoseconds(utils.readUInt64LE(buf, offset));
  offset += 8;

  return obj;
};

module.exports = Packet;
