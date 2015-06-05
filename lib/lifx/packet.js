'use strict';
var constants = require('../lifx').constants;
var ref = require('ref');

// Package headers 36 bit in total consisting of
//
// size - 2 bit
// description - 2 bit
//
// source - 4 bit
// target - 6 bit
// 00 00
// site - 6 bit
//
// 00
// sequence - 1 bit
// time - 8 bit
// type - 2 bit
// 00 00

var Packet = {};

/**
 * Mapping for types
 * @type {Object}
 */
Packet.typeList = {
  getPanGateway: 2,
  statePanGateway: 3
};
/**
 * Parses a lifx packet
 * @param {Buffer} buf Buffer containg lifx packet
 * @return {Object} parsed packet object
 */
Packet.toObject = function(buf) {
  var obj = {};
  var offset = 0;

  obj.size = buf.readUInt16LE(offset);
  offset += 2;

  obj.description = buf.readUInt16LE(offset);
  offset += 2;
  obj.addressable = (obj.description & constants.ADDRESSABLE_BIT) !== 0;
  obj.tagged = (obj.description & constants.TAGGED_BIT) !== 0;
  obj.origin = ((obj.description & constants.ORIGIN_BITS) >> 14) !== 0;
  obj.protocolVersion = (obj.description & constants.PROTOCOL_VERSION_BITS);

  obj.source = buf.toString('hex', offset, offset + 4);
  offset += 4;

  obj.target = buf.toString('hex', offset, offset + 6);
  offset += 6;

  obj.reserved1 = buf.slice(offset, offset + 2);
  offset += 2;

  obj.site = buf.toString('utf8', offset, offset + 6);
  obj.site = obj.site.replace(/\0/g, '');
  offset += 6;

  obj.reserved2 = buf.slice(offset, offset + 1);
  offset += 1;

  obj.sequence = buf.readUInt8(offset);
  offset += 1;

  obj.time = ref.readUInt64LE(buf, offset);
  offset += 8;

  obj.type = buf.readUInt16LE(offset);
  offset += 2;

  obj.reserved3 = buf.slice(offset, offset + 2);
  offset += 2;

  return obj;
};

/**
 * Creates a buffer for a lifx header from an object
 * @param {Object} obj Object containg header data
 * @return {Buffer} header buffer
 */
Packet.toBuffer = function(obj) {
  var buf = new Buffer(36);
  buf.fill(0);
  var offset = 0;

  buf.writeUInt16LE(obj.size, offset);
  offset += 2;

  if (obj.description === undefined || obj.description === null) {
    if(obj.protocolVersion === undefined) {
      obj.protocolVersion = constants.PROTOCOL_VERSION_CURRENT;
    }

    obj.description = obj.protocolVersion;

    if(obj.addressable !== undefined && obj.addressable === true) {
      obj.description |= constants.ADDRESSABLE_BIT;
    }

    if(obj.tagged !== undefined && obj.tagged === true) {
      obj.description |= constants.TAGGED_BIT;
    }

    if(obj.origin !== undefined && obj.origin === true) {
      // 0 or 1 to the 14 bit
      obj.description |= (1 << 14);
    }
  }

  buf.writeUInt16LE(obj.description, offset);
  offset += 2;

  if (obj.source !== undefined && obj.source.length > 0) {
    buf.write(obj.source, offset, 4, 'hex');
  }
  offset += 4;

  if (obj.target !== undefined && obj.target !== null) {
    buf.write(obj.target, offset, 6, 'hex');
  }
  offset += 6;

  // reserved1
  offset += 2;

  if (obj.site !== undefined && obj.site !== null) {
    buf.write(obj.site, offset, 6, 'utf8');
  }
  offset += 6;

  // reserved2
  offset += 1;

  buf.writeUInt8(obj.sequence, offset);
  offset += 1;

  if (obj.time !== undefined) {
    ref.writeUInt64LE(buf, offset, obj.time);
  }
  offset += 8;

  buf.writeUInt16LE(obj.type, offset);
  offset += 2;

  // reserved3
  offset += 2;

  return buf;
};

module.exports = Packet;
