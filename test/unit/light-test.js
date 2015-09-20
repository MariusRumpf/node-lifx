'use strict';

var Lifx = require('../../').Client;
var Light = require('../../').Light;
var assert = require('chai').assert;

suite('Light', () => {
  let client = null;
  let bulb = null;
  const getMsgQueueLength = () => {
    return client.messagesQueue.length;
  };
  const getMsgHandlerLength = () => {
    return client.messageHandlers.length;
  };

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
    assert.equal(getMsgQueueLength(), 1, 'sends a packet to the queue');
  });

  test('turning a light off', () => {
    bulb.off();
    assert.equal(getMsgQueueLength(), 1, 'sends a packet to the queue');
  });

  test('getting light summary', () => {
    assert.throw(() => {
      bulb.getState('test');
    }, TypeError);

    const currHandlerCnt = getMsgHandlerLength();
    bulb.getState(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
  });
});
