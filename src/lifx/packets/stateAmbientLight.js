'use strict';

const Packet = {
  size: 4
};

/**
 * Converts packet specific data from a buffer to an object
 * @param  {Buffer} buf Buffer containing only packet specific data no header
 * @return {Object}     Information contained in packet
 */
Packet.toObject = function(buf) {
  const obj = {};
  let offset = 0;

  if (buf.length !== this.size) {
    throw new Error('Invalid length given for stateAmbientLight LIFX packet');
  }

  obj.flux = buf.readFloatLE(offset);
  offset += 4;

  return obj;
};

/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @param  {Number} obj.flux flux value to set
 * @return {Buffer}     packet
 */
Packet.toBuffer = function(obj) {
  const buf = new Buffer(this.size);
  buf.fill(0);
  let offset = 0;

  buf.writeFloatLE(obj.flux, offset);
  offset += 4;

  return buf;
};

module.exports = Packet;
