'use strict';

/**
 * Searches for new lights, if one is found it sends a setWaveform packet
 * which tells the light to pulse to red and back three times over a period of 800ms
 */

const LifxClient = require('../lib/lifx').Client;
const packet = require('../lib/lifx').packet;
const constants = require('../lib/lifx').constants;
const client = new LifxClient();

// Create our packet with for pulsing red color effect
const packetObj = packet.create('setWaveform', {
  isTransient: true,
  color: {hue: 0, saturation: 65535, brightness: 65535, kelvin: 3500},
  period: 800,
  cycles: 3,
  skewRatio: 0,
  waveform: constants.LIGHT_WAVEFORMS.indexOf('SINE') // SAW, SINE, HALF_SINE, TRIANGLE, PULSE
}, client.source);

// Function running when packet was received by light
const callback = function() {
  console.log('Packet send\n');
};

client.on('light-new', function(light) {
  console.log('New light found.');
  console.log('ID: ' + light.id);

  // Set the light id
  packetObj.target = light.id; // set target id to new light
  client.send(packetObj, callback);
});

// Give feedback when running
client.on('listening', function() {
  const address = client.address();
  console.log(
    'Started LIFX listening on ' +
    address.address + ':' + address.port + '\n'
  );
});

client.init();
