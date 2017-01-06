'use strict';

var packet = require('../lifx').packet;
var constants = require('../lifx').constants;
var utils = require('../lifx').utils;
var _ = require('lodash');

/**
 * A representation of a light bulb
 * @class
 * @param {Obj} constr constructor object
 * @param {Lifx/Client} constr.client the client the light belongs to
 * @param {String} constr.id the id used to target the light
 * @param {String} constr.address ip address of the light
 * @param {Number} constr.port port of the light
 * @param {Number} constr.seenOnDiscovery on which discovery the light was last seen
 */
function Light(constr) {
  this.client = constr.client;
  this.id = constr.id; // Used to target the light
  this.address = constr.address;
  this.port = constr.port;
  this.label = null;
  this.status = 'on';

  this.seenOnDiscovery = constr.seenOnDiscovery;
}

/**
 * Turns the light off
 * @example light('192.168.2.130').off()
 * @param {Number} [duration] transition time in milliseconds
 * @param {Function} [callback] called when light did receive message
 */
Light.prototype.off = function(duration, callback) {
  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX light off method expects duration to be a number');
  }
  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('LIFX light off method expects callback to be a function');
  }
  var packetObj = packet.create('setPower', {level: 0, duration: duration}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj, callback);
};

/**
 * Turns the light on
 * @example light('192.168.2.130').on()
 * @param {Number} [duration] transition time in milliseconds
 * @param {Function} [callback] called when light did receive message
 */
Light.prototype.on = function(duration, callback) {
  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX light on method expects duration to be a number');
  }
  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('LIFX light on method expects callback to be a function');
  }
  var packetObj = packet.create('setPower', {level: 65535, duration: duration}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj, callback);
};

/**
 * Changes the color to the given HSBK value
 * @param {Number} hue        color hue from 0 - 360 (in °)
 * @param {Number} saturation color saturation from 0 - 100 (in %)
 * @param {Number} brightness color brightness from 0 - 100 (in %)
 * @param {Number} [kelvin=3500]   color kelvin between 2500 and 9000
 * @param {Number} [duration] transition time in milliseconds
 * @param {Function} [callback] called when light did receive message
 */
Light.prototype.color = function(hue, saturation, brightness, kelvin, duration, callback) {
  if (typeof hue !== 'number' || hue < constants.HSBK_MINIMUM_HUE || hue > constants.HSBK_MAXIMUM_HUE) {
    throw new RangeError('LIFX light color method expects hue to be a number between ' +
      constants.HSBK_MINIMUM_HUE + ' and ' + constants.HSBK_MAXIMUM_HUE
    );
  }
  hue = Math.round(hue / constants.HSBK_MAXIMUM_HUE * 65535);

  if (typeof saturation !== 'number' || saturation < constants.HSBK_MINIMUM_SATURATION || saturation > constants.HSBK_MAXIMUM_SATURATION) {
    throw new RangeError('LIFX light color method expects saturation to be a number between ' +
      constants.HSBK_MINIMUM_SATURATION + ' and ' + constants.HSBK_MAXIMUM_SATURATION
    );
  }
  saturation = Math.round(saturation / constants.HSBK_MAXIMUM_SATURATION * 65535);

  if (typeof brightness !== 'number' || brightness < constants.HSBK_MINIMUM_BRIGHTNESS || brightness > constants.HSBK_MAXIMUM_BRIGHTNESS) {
    throw new RangeError('LIFX light color method expects brightness to be a number between ' +
      constants.HSBK_MINIMUM_BRIGHTNESS + ' and ' + constants.HSBK_MAXIMUM_BRIGHTNESS
    );
  }
  brightness = Math.round(brightness / constants.HSBK_MAXIMUM_BRIGHTNESS * 65535);

  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX light color method expects duration to be a number');
  }

  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('LIFX light color method expects callback to be a function');
  }

  var packetObj = packet.create('setColor', {
    hue: hue,
    saturation: saturation,
    brightness: brightness,
    kelvin: kelvin,
    duration: duration
  }, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj, callback);
};

/**
 * Changes the color to the given rgb value
 * Note RGB poorly represents the color of light, prefer setting HSBK values with the color method
 * @example light.colorRgb(255, 0, 0)
 * @param {Integer} red value between 0 and 255 representing amount of red in color
 * @param {Integer} green value between 0 and 255 representing amount of green in color
 * @param {Integer} blue value between 0 and 255 representing amount of blue in color
 * @param {Number} [duration] transition time in milliseconds
 * @param {Function} [callback] called when light did receive message
 */
Light.prototype.colorRgb = function(red, green, blue, duration, callback) {
  if (typeof red !== 'number') {
    throw new TypeError('LIFX light colorRgb method expects first parameter red to a number');
  }
  if (red < constants.RGB_MINIMUM_VALUE || red > constants.RGB_MAXIMUM_VALUE) {
    throw new RangeError('LIFX light colorRgb method expects first parameter red to be between 0 and 255');
  }
  if (typeof green !== 'number') {
    throw new TypeError('LIFX light colorRgb method expects second parameter green to a number');
  }
  if (green < constants.RGB_MINIMUM_VALUE || green > constants.RGB_MAXIMUM_VALUE) {
    throw new RangeError('LIFX light colorRgb method expects second parameter green to be between 0 and 255');
  }
  if (typeof blue !== 'number') {
    throw new TypeError('LIFX light colorRgb method expects third parameter blue to a number');
  }
  if (blue < constants.RGB_MINIMUM_VALUE || blue > constants.RGB_MAXIMUM_VALUE) {
    throw new RangeError('LIFX light colorRgb method expects third parameter blue to be between 0 and 255');
  }

  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX light colorRgb method expects duration to be a number');
  }

  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('LIFX light colorRgb method expects callback to be a function');
  }

  var hsbObj = utils.rgbToHsb({r: red, g: green, b: blue});
  this.color(hsbObj.h, hsbObj.s, hsbObj.b, 3500, duration, callback);
};

/**
 * Changes the color to the given rgb value
 * Note RGB poorly represents the color of light, prefer setting HSBK values with the color method
 * @example light.colorRgb('#FF0000')
 * @param {String} hexString rgb hex string starting with # char
 * @param {Number} [duration] transition time in milliseconds
 * @param {Function} [callback] called when light did receive message
 */
Light.prototype.colorRgbHex = function(hexString, duration, callback) {
  if (typeof hexString !== 'string') {
    throw new TypeError('LIFX light colorRgbHex method expects first parameter hexString to a string');
  }

  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX light colorRgbHex method expects duration to be a number');
  }

  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('LIFX light colorRgbHex method expects callback to be a function');
  }

  var rgbObj = utils.rgbHexStringToObject(hexString);
  var hsbObj = utils.rgbToHsb(rgbObj);
  this.color(hsbObj.h, hsbObj.s, hsbObj.b, 3500, duration, callback);
};

/**
 * Sets the Maximum Infrared brightness
 * @param {Number} brightness infrared brightness from 0 - 100 (in %)
 * @param {Function} [callback] called when light did receive message
 */
Light.prototype.maxIR = function(brightness, callback) {
  if (typeof brightness !== 'number' || brightness < constants.IR_MINIMUM_BRIGHTNESS || brightness > constants.IR_MAXIMUM_BRIGHTNESS) {
    throw new RangeError('LIFX light setMaxIR method expects brightness to be a number between ' +
      constants.IR_MINIMUM_BRIGHTNESS + ' and ' + constants.IR_MAXIMUM_BRIGHTNESS
    );
  }
  brightness = Math.round(brightness / constants.IR_MAXIMUM_BRIGHTNESS * 65535);

  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('LIFX light setMaxIR method expects callback to be a function');
  }

  var packetObj = packet.create('setInfrared', {
    brightness: brightness
  }, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj, callback);
};

/**
 * Requests the current state of the light
 * @param {Function} callback a function to accept the data
 */
Light.prototype.getState = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getState method expects callback to be a function');
  }
  var packetObj = packet.create('getLight', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateLight', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    // Convert HSB to readable format
    msg.color.hue = Math.round(msg.color.hue * (constants.HSBK_MAXIMUM_HUE / 65535));
    msg.color.saturation = Math.round(msg.color.saturation * (constants.HSBK_MAXIMUM_SATURATION / 65535));
    msg.color.brightness = Math.round(msg.color.brightness * (constants.HSBK_MAXIMUM_BRIGHTNESS / 65535));
    // Convert power to readable format
    if (msg.power === 65535) {
      msg.power = 1;
    }
    callback(null, {
      color: msg.color,
      power: msg.power,
      label: msg.label
    });
  }, sqnNumber);
};

/**
 * Requests the current maximum setting for the infrared channel
 * @param  {Function} callback a function to accept the data
 */
Light.prototype.getMaxIR = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getMaxIR method expects callback to be a function');
  }
  var packetObj = packet.create('getInfrared', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateInfrared', function(err, msg) {
    if (err) {
      return callback(err, null);
    }

    msg.brightness = Math.round(msg.brightness * (constants.HSBK_MAXIMUM_BRIGHTNESS / 65535));

    callback(null, msg.brightness);
  }, sqnNumber);
};

/**
 * Requests hardware info from the light
 * @param {Function} callback a function to accept the data with error and
 *                   message as parameters
 */
Light.prototype.getHardwareVersion = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getHardwareVersion method expects callback to be a function');
  }
  var packetObj = packet.create('getVersion', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateVersion', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    var versionInfo = _.pick(msg, [
      'vendorId',
      'productId',
      'version'
    ]);
    callback(null, _.assign(
      versionInfo,
      utils.getHardwareDetails(versionInfo.vendorId, versionInfo.productId)
    ));
  }, sqnNumber);
};

/**
 * Requests used version from the microcontroller unit of the light
 * @param {Function} callback a function to accept the data
 */
Light.prototype.getFirmwareVersion = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getFirmwareVersion method expects callback to be a function');
  }
  var packetObj = packet.create('getHostFirmware', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateHostFirmware', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    callback(null, _.pick(msg, [
      'majorVersion',
      'minorVersion'
    ]));
  }, sqnNumber);
};

/**
 * Requests infos from the microcontroller unit of the light
 * @param {Function} callback a function to accept the data
 */
Light.prototype.getFirmwareInfo = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getFirmwareVersion method expects callback to be a function');
  }
  var packetObj = packet.create('getHostInfo', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateHostInfo', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    callback(null, _.pick(msg, [
      'signal',
      'tx',
      'rx'
    ]));
  }, sqnNumber);
};

/**
 * Requests wifi infos from for the light
 * @param {Function} callback a function to accept the data
 */
Light.prototype.getWifiInfo = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getFirmwareVersion method expects callback to be a function');
  }
  var packetObj = packet.create('getWifiInfo', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateWifiInfo', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    callback(null, _.pick(msg, [
      'signal',
      'tx',
      'rx'
    ]));
  }, sqnNumber);
};

/**
 * Requests used version from the wifi controller unit of the light (wifi firmware version)
 * @param {Function} callback a function to accept the data
 */
Light.prototype.getWifiVersion = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getFirmwareVersion method expects callback to be a function');
  }
  var packetObj = packet.create('getWifiFirmware', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateWifiFirmware', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, _.pick(msg, [
      'majorVersion',
      'minorVersion'
    ]));
  }, sqnNumber);
};

/**
 * Requests the label of the light
 * @param {Function} callback a function to accept the data
 * @param {Boolean} [cache=false] return cached result if existent
 * @return {Function} callback(err, label)
 */
Light.prototype.getLabel = function(callback, cache) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getLabel method expects callback to be a function');
  }
  if (cache !== undefined && typeof cache !== 'boolean') {
    throw new TypeError('LIFX light getLabel method expects cache to be a boolean');
  }
  if (cache === true) {
    if (typeof this.label === 'string' && this.label.length > 0) {
      return callback(null, this.label);
    }
  }
  var packetObj = packet.create('getLabel', {
    target: this.id
  }, this.client.source);
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateLabel', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, msg.label);
  }, sqnNumber);
};

/**
 * Sets the label of light
 * @example light.setLabel('Kitchen')
 * @param {String} label new label to be set, maximum 32 bytes
 * @param {Function} [callback] called when light did receive message
 */
Light.prototype.setLabel = function(label, callback) {
  if (label === undefined || typeof label !== 'string') {
    throw new TypeError('LIFX light setLabel method expects label to be a string');
  }
  if (Buffer.byteLength(label, 'utf8') > 32) {
    throw new RangeError('LIFX light setLabel method expects a maximum of 32 bytes as label');
  }
  if (label.length < 1) {
    throw new RangeError('LIFX light setLabel method expects a minimum of one char as label');
  }
  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('LIFX light setLabel method expects callback to be a function');
  }

  var packetObj = packet.create('setLabel', {label: label}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj, callback);
};

/**
 * Requests ambient light value of the light
 * @param {Function} callback a function to accept the data
 */
Light.prototype.getAmbientLight = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getAmbientLight method expects callback to be a function');
  }
  var packetObj = packet.create('getAmbientLight', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('stateAmbientLight', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, msg.flux);
  }, sqnNumber);
};

/**
 * Requests the power level of the light
 * @param {Function} callback a function to accept the data
 */
Light.prototype.getPower = function(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('LIFX light getPower method expects callback to be a function');
  }
  var packetObj = packet.create('getPower', {}, this.client.source);
  packetObj.target = this.id;
  var sqnNumber = this.client.send(packetObj);
  this.client.addMessageHandler('statePower', function(err, msg) {
    if (err) {
      return callback(err, null);
    }
    if (msg.level === 65535) {
      msg.level = 1;
    }
    return callback(null, msg.level);
  }, sqnNumber);
};

exports.Light = Light;
