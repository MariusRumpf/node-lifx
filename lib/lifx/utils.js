'use strict';

var os = require('os');
var constants = require('../lifx').constants;
var productDetailList = require('./products.json');
var utils = exports;

/**
 * Return all ip addresses of the machine
 * @return {Array} list containing ip address info
 */
utils.getHostIPs = function() {
  var ips = [];
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function(ifname) {
    ifaces[ifname].forEach(function(iface) {
      ips.push(iface.address);
    });
  });
  return ips;
};

/**
 * Generates a random hex string of the given length
 * @example
 * // returns something like 8AF1
 * utils.getRandomHexString(4)
 * @example
 * // returns something like 0D41C8AF
 * utils.getRandomHexString()
 * @param  {Number} [length=8] string length to generate
 * @return {String}            random hex string
 */
utils.getRandomHexString = function(length) {
  var string = '';
  var chars = '0123456789ABCDEF';

  if (!length) {
    length = 8;
  }

  for (var i = 0; i < length; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    string += chars.substring(randomNumber, randomNumber + 1);
  }

  return string;
};

/**
 * Reads a little-endian unsigned 64-bit value and returns it as buffer
 * This function exists for easy replacing if a native method will be provided
 * by node.js and does not make sense like is
 * @param  {Buffer} buffer buffer to read from
 * @param  {Number} offset offset to begin reading from
 * @return {Buffer}        resulting 64-bit buffer
 */
utils.readUInt64LE = function(buffer, offset) {
  return buffer.slice(offset, offset + 8);
};

/**
 * Writes a 64-bit value provided as buffer and returns the result
 * This function exists for easy replacing if a native method will be provided
 * by node.js and does not make sense like is
 * @param  {Buffer} buffer buffer to write from
 * @param  {Number} offset offset to begin reading from
 * @param  {Buffer} input  the buffer to write
 * @return {Buffer}        resulting 64-bit buffer
 */
utils.writeUInt64LE = function(buffer, offset, input) {
  return input.copy(buffer, offset, 0, 8);
};

/**
 * Validates a given ip address is IPv4 format
 * @param  {String} ip IP address to validate
 * @return {Boolean}   is IPv4 format?
 */
utils.isIpv4Format = function(ip) {
  var ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4Regex.test(ip);
};

/**
 * Converts an RGB Hex string to an object with decimal representations
 * @example rgbHexStringToObject('#FF00FF')
 * @param {String} rgbHexString hex value to parse, with leading #
 * @return {Object}             object with decimal values for r, g, b
 */
utils.rgbHexStringToObject = function(rgbHexString) {
  if (typeof rgbHexString !== 'string') {
    throw new TypeError('LIFX util rgbHexStringToObject expects first parameter to be a string');
  }
  var hashChar = rgbHexString.substr(0, 1);
  if (hashChar !== '#') {
    throw new RangeError('LIFX util rgbHexStringToObject expects hex parameter with leading \'#\' sign');
  }
  var pureHex = rgbHexString.substr(1);
  if (pureHex.length !== 6 && pureHex.length !== 3) {
    throw new RangeError('LIFX util rgbHexStringToObject expects hex value parameter to be 3 or 6 chars long');
  }

  var r;
  var g;
  var b;

  if (pureHex.length === 6) {
    r = pureHex.substring(0, 2);
    g = pureHex.substring(2, 4);
    b = pureHex.substring(4, 6);
  } else if (pureHex.length === 3) {
    r = pureHex.substring(0, 1);
    r += r;
    g = pureHex.substring(1, 2);
    g += g;
    b = pureHex.substring(2, 3);
    b += b;
  }

  return {
    r: parseInt(r, 16),
    g: parseInt(g, 16),
    b: parseInt(b, 16)
  };
};

utils.minNumberInArray = function(array) {
  var sortedCopy = array.slice();
  sortedCopy.sort(function(a, b) {
    return a - b;
  });
  return sortedCopy[0];
};

utils.maxNumberInArray = function(array) {
  var sortedCopy = array.slice();
  sortedCopy.sort(function(a, b) {
    return a - b;
  });
  return sortedCopy[sortedCopy.length - 1];
};

/**
 * Converts an object with r,g,b integer values to an
 * hsb integer object
 * @param {Object} rgbObj object with r,g,b keys and values
 * @return {Object} hsbObj object with h,s,b keys and converted values
 */
utils.rgbToHsb = function(rgbObj) {
  var red = rgbObj.r / constants.RGB_MAXIMUM_VALUE;
  var green = rgbObj.g / constants.RGB_MAXIMUM_VALUE;
  var blue = rgbObj.b / constants.RGB_MAXIMUM_VALUE;
  var rgb = [red, green, blue];
  var hsb = {};

  var max = utils.maxNumberInArray(rgb);
  var min = utils.minNumberInArray(rgb);
  var c = max - min;

  // https://en.wikipedia.org/wiki/HSL_and_HSV#Hue_and_chroma
  var hue;
  if (c === 0) {
    hue = 0;
  } else if (max === red) {
    hue = ((green - blue) / c);
    if (hue < 0) {
      hue += 6;
    }
  } else if (max === green) {
    hue = 2 + ((blue - red) / c);
  } else { // max === blue
    hue = 4 + ((red - green) / c);
  }
  hsb.h = Math.round(60 * hue);

  // https://en.wikipedia.org/wiki/HSL_and_HSV#Lightness
  var lightness = max;
  hsb.b = Math.round(lightness * 100);

  // https://en.wikipedia.org/wiki/HSL_and_HSV#Saturation
  var saturation;
  if (c === 0) {
    saturation = 0;
  } else {
    saturation = (c / lightness);
  }
  hsb.s = Math.round(saturation * 100);

  return hsb;
};

/**
 * Get's product and vendor details for the given id's
 * hsb integer object
 * @param {Number} vendorId id of the vendor
 * @param {Number} productId id of the product
 * @return {Object|Boolean} product and details vendor details or false if not found
 */
utils.getHardwareDetails = function(vendorId, productId) {
  for (var i = 0; i < productDetailList.length; i += 1) {
    if (productDetailList[i].vid === vendorId) {
      for (var j = 0; j < productDetailList[i].products.length; j += 1) {
        if (productDetailList[i].products[j].pid === productId) {
          return {
            vendorName: productDetailList[i].name,
            productName: productDetailList[i].products[j].name,
            productFeatures: productDetailList[i].products[j].features
          };
        }
      }
    }
  }

  return false;
};
