'use strict';

var packet = require('../lifx').packet;
var constants = require('../lifx').constants;
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
  this.status = 'on';

  this.seenOnDiscovery = constr.seenOnDiscovery;
}

/**
 * Turns the light off
 * @example light('192.168.2.130').off()
 * @param {Number} [duration] transition time in milliseconds
 */
Light.prototype.off = function(duration) {
  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX light off method expects duration to be a number');
  }
  var packetObj = packet.create('setPower', {level: 0, duration: duration}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj);
};

/**
 * Turns the light on
 * @example light('192.168.2.130').on()
 * @param {Number} [duration] transition time in milliseconds
 */
Light.prototype.on = function(duration) {
  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX light off method expects duration to be a number');
  }
  var packetObj = packet.create('setPower', {level: 65535, duration: duration}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj);
};

/**
 * Changes the color to the given HSBK value
 * @param {Number} hue        color hue from 0 - 360 (in °)
 * @param {Number} saturation color saturation from 0 - 100 (in %)
 * @param {Number} brightness color brightness from 0 - 100 (in %)
 * @param {Number} [kelvin=3500]   color kelvin between 2500 and 9000
 * @param {Number} [duration] transition time in milliseconds
 */
Light.prototype.color = function(hue, saturation, brightness, kelvin, duration) {
  if (typeof hue !== 'number' || hue < constants.HSBK_MINIMUM_HUE || hue > constants.HSBK_MAXIMUM_HUE) {
    throw new RangeError('LIFX light color method expects hue to be a number between ' +
      constants.HSBK_MINIMUM_HUE + ' and ' + constants.HSBK_MAXIMUM_HUE
    );
  }
  hue = Math.floor(hue / constants.HSBK_MAXIMUM_HUE * 65535);

  if (typeof saturation !== 'number' || saturation < constants.HSBK_MINIMUM_SATURATION || saturation > constants.HSBK_MAXIMUM_SATURATION) {
    throw new RangeError('LIFX light color method expects saturation to be a number between ' +
      constants.HSBK_MINIMUM_SATURATION + ' and ' + constants.HSBK_MAXIMUM_SATURATION
    );
  }
  saturation = Math.floor(saturation / constants.HSBK_MAXIMUM_SATURATION * 65535);

  if (typeof brightness !== 'number' || brightness < constants.HSBK_MINIMUM_BRIGHTNESS || brightness > constants.HSBK_MAXIMUM_BRIGHTNESS) {
    throw new RangeError('LIFX light color method expects brightness to be a number between ' +
      constants.HSBK_MINIMUM_BRIGHTNESS + ' and ' + constants.HSBK_MAXIMUM_BRIGHTNESS
    );
  }
  brightness = Math.floor(brightness / constants.HSBK_MAXIMUM_BRIGHTNESS * 65535);

  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX light color method expects duration to be a number');
  }

  var packetObj = packet.create('setColor', {
    hue: hue,
    saturation: saturation,
    brightness: brightness,
    kelvin: kelvin,
    duration: duration
  }, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj);
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
    msg.color.hue = Math.floor(msg.color.hue * (constants.HSBK_MAXIMUM_HUE / 65535));
    msg.color.saturation = Math.floor(msg.color.saturation * (constants.HSBK_MAXIMUM_SATURATION / 65535));
    msg.color.brightness = Math.floor(msg.color.brightness * (constants.HSBK_MAXIMUM_BRIGHTNESS / 65535));
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
 * Requests hardware info from the light
 * @param {Function} callback a function to accept the data with error and
 *                   message as parameters
 */
Light.prototype.getHardware = function(callback) {
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
    callback(null, _.pick(msg, [
      'vendorId',
      'vendorName',
      'productId',
      'productName',
      'version'
    ]));
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
    callback(null, _.pick(msg, [
      'majorVersion',
      'minorVersion'
    ]));
  }, sqnNumber);
};

/**
 * Sets the label of light
 * @example light.setLabel('Kitchen)
 * @param {String} [label] new label to be set
 */
Light.prototype.setLabel = function(label) {
  if (label !== undefined && typeof label !== 'string') {
    throw new RangeError('LIFX light setLabel method expects label to be a string');
  }
  var packetObj = packet.create('setLabel', {label: label}, this.client.source);
  packetObj.target = this.id;

  this.client.send(packetObj);
};

exports.Light = Light;
