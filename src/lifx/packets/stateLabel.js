'use strict';

const Packet = {
  size: 32
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
    throw new Error('Invalid length given for stateLabel LIFX packet');
  }

  obj.label = buf.toString('utf8', offset, offset + 32);
  obj.label = obj.label.replace(/\0/g, '');
  offset += 32;

  return obj;
};

/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @param  {String} obj.label label to set, maximum 32 bytes
 * @return {Buffer}     packet
 */
Packet.toBuffer = function(obj) {
  const buf = new Buffer(this.size);
  buf.fill(0);
  let offset = 0;

  buf.write(obj.label, offset, 32, 'utf8');
  offset += 32;

  return buf;
};

module.exports = Packet;
