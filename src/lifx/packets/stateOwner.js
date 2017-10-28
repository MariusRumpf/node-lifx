'use strict';

const {utils} = require('../../lifx');

const Packet = {
  size: 56
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
    throw new Error('Invalid length given for stateOwner LIFX packet');
  }

  obj.owner = buf.toString('hex', offset, offset + 16);
  offset += 16;

  obj.label = buf.toString('utf8', offset, offset + 32);
  obj.label = obj.label.replace(/\0/g, '');
  offset += 32;

  obj.updatedAt = utils.readUInt64LE(buf, offset);
  offset += 8;

  return obj;
};

/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @return {Buffer}     packet
 */
Packet.toBuffer = function(obj) {
  const buf = new Buffer(this.size);
  buf.fill(0);
  let offset = 0;

  if (obj.owner !== undefined) {
    buf.write(obj.owner, offset, 16, 'hex');
    offset += 16;
  }

  if (obj.label !== undefined) {
    buf.write(obj.label, offset, 32, 'utf8');
    offset += 32;
  }

  if (obj.updatedAt !== undefined) {
    utils.writeUInt64LE(buf, offset, obj.updatedAt);
    offset += 8;
  }

  return buf;
};

module.exports = Packet;
