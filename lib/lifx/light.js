'use strict';

var packet = require('../lifx').packet;

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
 * @param {Number} [duration] transition time in milliseconds
 */
Light.prototype.off = function(duration) {
  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX bulb off method expects duration to be a number');
  }
  var packetObj = packet.create('setPower', {level: 0, duration: duration}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj);
};

/**
 * Turns the light on
 * @param {Number} [duration] transition time in milliseconds
 */
Light.prototype.on = function(duration) {
  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX bulb off method expects duration to be a number');
  }
  var packetObj = packet.create('setPower', {level: 65535, duration: duration}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj);
};

/**
 * Changes the color to the given HSBK value
 * @param {Number} hue        color hue between 0 and 65535
 * @param {Number} saturation color saturation between 0 and 65535
 * @param {Number} brightness color brightness between 0 and 65535
 * @param {Number} kelvin     color kelvin between 2500 and 9000
 * @param {Number} [duration] transition time in milliseconds
 */
Light.prototype.colorHsbk = function(hue, saturation, brightness, kelvin, duration) {
  if (duration !== undefined && typeof duration !== 'number') {
    throw new RangeError('LIFX bulb colorHsbk method expects duration to be a number');
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

exports.Light = Light;
