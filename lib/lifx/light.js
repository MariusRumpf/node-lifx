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
 */
Light.prototype.off = function() {
  var packetObj = packet.create('setPower', {level: 0}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj);
};


/**
 * Turns the light on
 */
Light.prototype.on = function() {
  var packetObj = packet.create('setPower', {level: 65535}, this.client.source);
  packetObj.target = this.id;
  this.client.send(packetObj);

};

exports.Light = Light;
