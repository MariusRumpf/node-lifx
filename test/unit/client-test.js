'use strict';

var Lifx = require('../../').Client;
var assert = require('chai').assert;
var client = null;

suite('Client', () => {
  setup(() => {
    client = new Lifx();
  });

  teardown(() => {
    client.destroy();
  });

  test('no connection by default', () => {
    assert.isNull(client.address());
  });

  test('connection after init', () => {
    client.init({}, function() {
      assert.isObject(client.address());
      assert.property(client.address(), 'address');
      assert.property(client.address(), 'port');
    });
  });

  test('accepts init parameters', () => {
    client.init({
      address: '127.0.0.1',
      port: 57500
    }, function() {
      assert.equal(client.address().address, '127.0.0.1');
      assert.equal(client.address().port, 57500);
    });
  });
});
