'use strict';

const {utils} = require('../../lifx');

const Packet = {
  size: 9
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
    throw new Error('Invalid length given for stateCountZone LIFX packet');
  }

  obj.time = utils.readUInt64LE(buf, offset);
  offset += 8;

  obj.count = buf.readUInt8(offset);
  offset += 1;

  return obj;
};

module.exports = Packet;
