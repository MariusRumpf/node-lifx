'use strict';

var constants = require('../../lifx').constants;

var Packet = {
  size: 50
};

/**
 * Converts packet specific data from a buffer to an object
 * @param  {Buffer} buf Buffer containing only packet specific data no header
 * @return {Object}     Information contained in packet
 */
Packet.toObject = function(buf) {
  var obj = {};
  var offset = 0;

  if (buf.length < 10) {
    throw new Error('Invalid length for stateMultiZone LIFX packet, expected minimum 10 but received ' + buf.length);
  }

  obj.count = buf.readUInt8(offset);
  offset += 1;

  obj.index = buf.readUInt8(offset);
  offset += 1;

  obj.color = [];
  while (buf.length - offset >= 8) {
    var colorObj = {};
    colorObj.hue = buf.readUInt16LE(offset);
    offset += 2;
    colorObj.saturation = buf.readUInt16LE(offset);
    offset += 2;
    colorObj.brightness = buf.readUInt16LE(offset);
    offset += 2;
    colorObj.kelvin = buf.readUInt16LE(offset);
    offset += 2;
    obj.color.push(colorObj);
  }

  return obj;
};

/**
 * Converts the given packet specific object into a packet
 * @param  {Object} obj object with configuration data
 * @param  {Number} obj.count zone count, between 0 and 255
 * @param  {Number} obj.index index of first zone, between 0 and 255
 * @param  {Array}  obj.color an array with 1 to 8 HSBK color objects
 * @return {Buffer} packet
 */
Packet.toBuffer = function(obj) {
  var buf = new Buffer();
  buf.fill(0);
  var offset = 0;

  if (typeof obj.count !== 'number' && obj.count < 0 || obj.count > 255) {
    throw new RangeError('Invalid count value given for stateMultiZone LIFX packet, must be a number between 0 and 255');
  }
  buf.writeUInt8(obj.count, offset);
  offset += 1;

  if (typeof obj.index !== 'number' && obj.index < 0 || obj.index > 255) {
    throw new RangeError('Invalid index value given for stateMultiZone LIFX packet, must be a number between 0 and 255');
  }
  buf.writeUInt8(obj.index, offset);
  offset += 1;

  if (!Array.isArray(obj.color)) {
    throw new TypeError('Invalid color value given for stateMultiZone LIFX packet, must be an array');
  }
  if (obj.color.length < 1 || obj.color.length > 8) {
    throw new RangeError('Invalid color value given for stateMultiZone LIFX packet, must be an array of 1 to 8 objects');
  }

  obj.color.forEach(function(colorObj, index) {
    if (colorObj === null || typeof colorObj !== 'object') {
      throw new TypeError('Invalid HSBK color value at index ' + index + ', must be a HSBK color object');
    }
    if (typeof colorObj.hue !== 'number' && colorObj.hue < 0 || colorObj.hue > 65535) {
      throw new RangeError('Invalid color hue given at index ' + index + ', must be a number between 0 and 65535');
    }
    buf.writeUInt16LE(colorObj.hue, offset);
    offset += 2;

    if (typeof colorObj.saturation !== 'number' && colorObj.saturation < 0 || colorObj.saturation > 65535) {
      throw new RangeError('Invalid color saturation given at index ' + index + ', must be a number between 0 and 65535');
    }
    buf.writeUInt16LE(colorObj.saturation, offset);
    offset += 2;

    if (typeof colorObj.brightness !== 'number' && colorObj.brightness < 0 || colorObj.brightness > 65535) {
      throw new RangeError('Invalid color brightness given at index ' + index + ', must be a number between 0 and 65535');
    }
    buf.writeUInt16LE(colorObj.brightness, offset);
    offset += 2;

    if (colorObj.kelvin === undefined) {
      colorObj.kelvin = constants.HSBK_DEFAULT_KELVIN;
    }
    if (typeof colorObj.kelvin !== 'number' && colorObj.kelvin < 2500 || colorObj.kelvin > 9000) {
      throw new RangeError('Invalid color kelvin given at index ' + index + ', must be a number between 2500 and 9000');
    }
    buf.writeUInt16LE(colorObj.kelvin, offset);
    offset += 2;
  });

  return buf;
};

module.exports = Packet;
