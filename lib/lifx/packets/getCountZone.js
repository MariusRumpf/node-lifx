'use strict';

var Packet = {
  size: 1
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
    throw new Error('Invalid length given for getCountZones LIFX packet');
  }

  obj.scan = buf.readUInt8(offset);
  offset += 1;

  return obj;
};

/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @param  {Object} obj.scan scan value
 * @return {Buffer}     packet
 */
Packet.toBuffer = function(obj) {
  var buf = new Buffer(this.size);
  buf.fill(0);
  var offset = 0;

  if (obj.scan === undefined) {
    throw new TypeError('obj.scan value must be given for getCountZones LIFX packet');
  }
  if (typeof obj.scan !== 'boolean') {
    throw new TypeError('Invalid scan value given for getCountZones LIFX packet, must be boolean');
  }

  buf.writeUInt8(obj.scan, offset);
  offset += 1;

  return buf;
};

module.exports = Packet;
