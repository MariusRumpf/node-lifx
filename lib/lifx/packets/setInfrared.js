'use strict';

var Packet = {
  size: 2
};

/**
 * Converts packet specific data from a buffer to an object
 * @param  {Buffer} buf Buffer containing only packet specific data no header
 * @return {Object}     Information contained in packet
 */
Packet.toObject = function(buf) {
  var obj = {};
  var offset = 0;

  if (buf.length !== this.size) {
    throw new Error('Invalid length given for setInfrared LIFX packet');
  }

  obj.brightness = buf.readUInt16LE(offset);
  offset += 2;

  return obj;
};

/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @param  {Number} obj.brightness between 0 and 65535
 * @return {Buffer} packet
 */
Packet.toBuffer = function(obj) {
  var buf = new Buffer(this.size);
  buf.fill(0);
  var offset = 0;

  if (typeof obj.brightness !== 'number' && obj.brightness < 0 && obj.brightness > 65535) {
    throw new RangeError('Invalid brightness given for setInfrared LIFX packet, must be a number between 0 and 65535');
  }
  buf.writeUInt16LE(obj.brightness, offset);
  offset += 2;

  return buf;
};

module.exports = Packet;
