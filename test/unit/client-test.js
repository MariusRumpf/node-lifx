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

  test('not connected by default', () => {
    assert.isNull(client.address());
  });

  test('connected after init', (done) => {
    client.init({}, () => {
      assert.isObject(client.address());
      assert.property(client.address(), 'address');
      assert.property(client.address(), 'port');
      done();
    });
  });

  test('accepts init parameters', (done) => {
    client.init({
      address: '127.0.0.1',
      port: 57500,
      source: '12345678',
      debug: true
    }, () => {
      assert.equal(client.address().address, '127.0.0.1');
      assert.equal(client.address().port, 57500);
      assert.equal(client.source, '12345678');
      assert.isTrue(client.debug);
      done();
    });
  });

  test('discovery start and stop', (done) => {
    client.init({}, () => {
      assert.isObject(client.discoveryTimer);
      client.stopDiscovery();
      assert.isNull(client.discoveryTimer);
      client.startDiscovery();
      assert.isObject(client.discoveryTimer);
      done();
    });
  });

  test('finding bulbs by different parameters', () => {
    let bulbs = [{
        site: 'LIFXV2',
        id: '0dd124d25597',
        address: '192.168.0.8',
        port: 56700,
        status: 'off'
      }, {
        site: 'LIFXV2',
        id: 'ad227d95517z',
        address: '192.168.254.254',
        port: 56700,
        status: 'on'
      }, {
        site: 'LIFXV2',
        id: '783rbc67cg14',
        address: '192.168.1.5',
        port: 56700,
        status: 'on'
      }, {
        site: 'LIFXV2',
        id: '783rbc67cg14',
        address: 'FE80::903A:1C1A:E802:11E4',
        port: 56700,
        status: 'on'
    }];

    client.gateways = bulbs;
    assert.deepEqual(client.listLights(), bulbs);

    let result;
    result = client.findLights('0dd124d25597');
    assert.isObject(result);
    assert.equal(result.address, '192.168.0.8');

    result = client.findLights('FE80::903A:1C1A:E802:11E4');
    assert.isObject(result);
    assert.equal(result.id, '783rbc67cg14');

    result = client.findLights('192.168.254.254');
    assert.isObject(result);
    assert.equal(result.id, 'ad227d95517z');

    result = client.findLights('141svsdvsdv1');
    assert.isFalse(result);

    result = client.findLights('192.168.0.1');
    assert.isFalse(result);

    assert.throw(() => {
      client.findLights({id: '0123456789012'});
    }, TypeError);

    assert.throw(() => {
      client.findLights(['12a135r25t24']);
    }, TypeError);
  });
});
