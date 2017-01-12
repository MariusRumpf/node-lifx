'use strict';

var Packet = {
  size: 2
};

/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @param  {Number} obj.startIndex start zone index, between 0 and 255
 * @param  {Number} obj.endIndex end zone index, between 0 and 255
 * @return {Buffer} packet
 */
Packet.toBuffer = function(obj) {
  var buf = new Buffer(this.size);
  buf.fill(0);
  var offset = 0;

  if (typeof obj.startIndex !== 'number' && obj.startIndex < 0 || obj.startIndex > 255) {
    throw new RangeError('Invalid startIndex value given for setColorZones LIFX packet, must be a number between 0 and 255');
  }
  buf.writeUInt8(obj.startIndex, offset);
  offset += 1;

  if (typeof obj.endIndex !== 'number' && obj.endIndex < 0 || obj.endIndex > 255) {
    throw new RangeError('Invalid endIndex value given for setColorZones LIFX packet, must be a number between 0 and 255');
  }
  buf.writeUInt8(obj.endIndex, offset);
  offset += 1;

  return buf;
};

module.exports = Packet;
