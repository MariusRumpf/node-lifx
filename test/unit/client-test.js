'use strict';

var Lifx = require('../../').Client;
var Light = require('../../').Light;
var packet = require('../../').packet;
var assert = require('chai').assert;

suite('Client', () => {
  let client;

  beforeEach(() => {
    client = new Lifx();
  });

  afterEach(() => {
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

  test('inits with random source by default', (done) => {
    client.init({
      startDiscovery: false
    }, () => {
      assert.typeOf(client.source, 'string');
      assert.lengthOf(client.source, 8);
      done();
    });
  });

  test('discovery start and stop', (done) => {
    client.init({
      startDiscovery: false
    }, () => {
      assert.isNull(client.discoveryTimer);
      client.startDiscovery();
      assert.isObject(client.discoveryTimer);
      client.stopDiscovery();
      assert.isNull(client.discoveryTimer);
      done();
    });
  });

  test('finding bulbs by different parameters', () => {
    let bulbs = [];
    let bulb;

    bulb = new Light({
      client: client,
      id: '0dd124d25597',
      address: '192.168.0.8',
      port: 56700,
      seenOnDiscovery: 1
    });
    bulb.status = 'off';
    bulbs.push(bulb);

    bulb = new Light({
      client: client,
      id: 'ad227d95517z',
      address: '192.168.254.254',
      port: 56700,
      seenOnDiscovery: 1
    });
    bulbs.push(bulb);

    bulb = new Light({
      client: client,
      id: '783rbc67cg14',
      address: '192.168.1.5',
      port: 56700,
      seenOnDiscovery: 2
    });
    bulbs.push(bulb);

    bulb = new Light({
      client: client,
      id: '883rbd67cg15',
      address: 'FE80::903A:1C1A:E802:11E4',
      port: 56700,
      seenOnDiscovery: 2
    });
    bulbs.push(bulb);

    client.devices = bulbs;

    let result;
    result = client.light('0dd124d25597');
    assert.instanceOf(result, Light);
    assert.equal(result.address, '192.168.0.8');

    result = client.light('FE80::903A:1C1A:E802:11E4');
    assert.instanceOf(result, Light);
    assert.equal(result.id, '883rbd67cg15');

    result = client.light('192.168.254.254');
    assert.instanceOf(result, Light);
    assert.equal(result.id, 'ad227d95517z');

    result = client.light('141svsdvsdv1');
    assert.isFalse(result);

    result = client.light('192.168.0.1');
    assert.isFalse(result);

    assert.throw(() => {
      client.light({id: '0123456789012'});
    }, TypeError);

    assert.throw(() => {
      client.light(['12a135r25t24']);
    }, TypeError);
  });

  test('package sending', (done) => {
    client.init({
      startDiscovery: false
    }, () => {
      assert.lengthOf(client.messagesQueue, 0, 'is empty');
      client.send(packet.create('getService', {}, '12345678'));
      assert.lengthOf(client.messagesQueue, 1);
      assert.property(client.messagesQueue[0], 'data');
      assert.notProperty(client.messagesQueue[0], 'address');
      done();
    });
  });

  test('getting all known lights', () => {
    let bulbs = [];
    let bulb;

    bulb = new Light({
      client: client,
      id: '0dd124d25597',
      address: '192.168.0.8',
      port: 56700,
      seenOnDiscovery: 1
    });
    bulbs.push(bulb);

    bulb = new Light({
      client: client,
      id: '783rbc67cg14',
      address: '192.168.0.9',
      port: 56700,
      seenOnDiscovery: 1
    });
    bulb.status = 'off';
    bulbs.push(bulb);

    client.devices = bulbs;
    assert.deepEqual(client.lights(''), bulbs);

    assert.deepEqual(client.lights(), [bulbs[0]]);
    assert.deepEqual(client.lights('on'), [bulbs[0]]);

    assert.deepEqual(client.lights('off'), [bulbs[1]]);
  });

  suite('message handler', () => {
    test('discovery message handler registered by default', () => {
      assert.lengthOf(client.messageHandlers, 1);
      assert.equal(client.messageHandlers[0].type, 'stateService');
    });

    test('adding valid message handlers', () => {
      let prevMsgHandlerCount = client.messageHandlers.length;
      client.addMessageHandler('stateLight', () => {}, 1);
      assert.lengthOf(client.messageHandlers, prevMsgHandlerCount + 1, 'message handler has been added');
      assert.equal(client.messageHandlers[1].type, 'stateLight', 'correct handler type');
    });

    test('adding invalid message handlers', () => {
      assert.throw(() => {
        client.addMessageHandler('stateLight', () => {}, '1');
      }, TypeError);
    });

    test('removing one time handlers after call', (done) => {
      let prevMsgHandlerCount = client.messageHandlers.length;
      client.addMessageHandler('temporaryHandler', () => {
        done(); // Make sure callback is called
      }, 1);
      assert.lengthOf(client.messageHandlers, prevMsgHandlerCount + 1, 'message handler has been added');

      // emit a fake message, rinfo is not relevant for fake
      client.processMessageHandlers({
        type: 'temporaryHandler',
        sequenceNumber: 1
      }, {});

      assert.lengthOf(client.messageHandlers, prevMsgHandlerCount, 'message handler has been removed');
    });

    test('keeping permanent handlers after call', (done) => {
      let prevMsgHandlerCount = client.messageHandlers.length;
      client.addMessageHandler('permanentHandler', () => {
        done(); // Make sure callback is called
      });
      assert.lengthOf(client.messageHandlers, prevMsgHandlerCount + 1, 'message handler has been added');

      // emit a fake message, rinfo is not relevant for fake
      client.processMessageHandlers({ type: 'permanentHandler' }, {});

      assert.lengthOf(client.messageHandlers, prevMsgHandlerCount + 1, 'message handler is still present');
    });
  });

  test('change debugging mode', () => {
    assert.equal(client.debug, false);

    client.setDebug(true);
    assert.equal(client.debug, true);

    client.setDebug(false);
    assert.equal(client.debug, false);
  });
});
