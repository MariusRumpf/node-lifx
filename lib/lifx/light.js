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
  if (duration === undefined) {
    duration = 0;
  } else if (typeof duration !== 'number') {
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
  if (duration === undefined) {
    duration = 0;
  } else if (typeof duration !== 'number') {
    throw new RangeError('LIFX bulb off method expects duration to be a number');
  }
  var packetObj = packet.create('setPower', {level: 65535, duration: duration}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj);

};

exports.Light = Light;
