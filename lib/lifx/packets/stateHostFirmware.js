'use strict';

var ref = require('ref');

var Packet = {
  size: 20
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
    throw new Error('Invalid length given for stateHostFirmware LIFX packet');
  }

  obj.build = ref.readUInt64LE(buf, offset);
  offset += 8;

  obj.install = ref.readUInt64LE(buf, offset);
  offset += 8;

  obj.version = buf.readUInt32LE(offset);
  offset += 4;

  return obj;
};

/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @return {Buffer}     packet
 */
Packet.toBuffer = function(obj) {
  var buf = new Buffer(this.size);
  buf.fill(0);
  var offset = 0;

  ref.writeUInt64LE(buf, offset, obj.build);
  offset += 8;

  ref.writeUInt64LE(buf, offset, obj.install);
  offset += 8;

  buf.writeUInt32LE(obj.version, offset);
  offset += 4;

  return buf;
};

module.exports = Packet;
