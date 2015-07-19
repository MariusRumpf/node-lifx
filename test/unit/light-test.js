'use strict';

var Lifx = require('../../').Client;
var Light = require('../../').Light;
var assert = require('chai').assert;

suite('Light', () => {
  let client = null;
  let bulb = null;

  beforeEach(() => {
    client = new Lifx();
    bulb = new Light({
      client: client,
      id: 'F37A4311B857',
      address: '192.168.0.1',
      port: 56700,
      seenOnDiscovery: 1
    });
  });

  afterEach(() => {
    client.destroy();
  });

  test('light status \'on\' after instanciation', () => {
    assert.equal(bulb.status, 'on');
  });

  test('turning a light on', () => {
    bulb.on();
    assert.lengthOf(client.messagesQueue, 1, 'sends a packet to the queue');
  });

  test('turning a light off', () => {
    bulb.off();
    assert.lengthOf(client.messagesQueue, 1, 'sends a packet to the queue');
  });
});
