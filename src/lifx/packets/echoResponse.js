'use strict';

const Packet = {
  size: 64
};

/**
 * Converts packet specific data from a buffer to an object
 * @param  {Buffer} buf Buffer containing only packet specific data no header
 * @return {Object}     Information contained in packet
 */
Packet.toObject = function(buf) {
  const obj = {};
  let offset = 0;

  // Check length
  if (buf.length !== this.size) {
    throw new Error('Invalid length given for echoResponse LIFX packet');
  }

  obj.payload = buf.toString('utf8', offset, offset + 64);
  obj.payload = obj.payload.replace(/\0/g, '');
  offset += 64;

  return obj;
};

/**
 * Converts the given packet specific object into a packet
 * This packet expects payload field of max. length 64 utf8
 * @param  {Object} obj object with configuration data
 * @return {Buffer}     packet
 */
Packet.toBuffer = function(obj) {
  const buf = new Buffer(this.size);
  buf.fill(0);
  let offset = 0;

  buf.write(obj.payload, offset, 64);
  offset += 64;

  return buf;
};

module.exports = Packet;
