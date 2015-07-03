'use strict';

var Packet = require('../../../').packet;
var assert = require('chai').assert;

suite('Packet setPower', () => {
  suite('create', () => {
    test('power off', () => {
      let packet = Packet.create('setPower', {level: 0}, 'ff2c4807', 'd073d5006d72');
      assert.equal(packet.size, 38);
      assert.equal(packet.level, 0);
      assert.equal(packet.type, 21);
    });

    test('power on', () => {
      let packet = Packet.create('setPower', {level: 65535}, 'ff2c4807', 'd073d5006d72');
      assert.equal(packet.size, 38);
      assert.equal(packet.level, 65535);
      assert.equal(packet.type, 21);
    });
  });
});
