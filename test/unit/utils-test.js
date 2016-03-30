'use strict';

var utils = require('../../').utils;
var assert = require('chai').assert;

suite('Utils', () => {
  test('create a random hex string', () => {
    const test1 = utils.getRandomHexString();
    assert.isString(test1);
    assert.equal(test1, test1.match(/^[0-9A-F]{8}$/)[0]);

    const test2 = utils.getRandomHexString(16);
    assert.isString(test2);
    assert.equal(test2, test2.match(/^[0-9A-F]{16}$/)[0]);
  });

  test('getting host ips', () => {
    const hostIPs = utils.getHostIPs();
    assert.isArray(hostIPs);
    hostIPs.forEach((ip) => {
      assert.isString(ip, 'IPs are given as');
      assert.isTrue(ip.indexOf('.') >= 0 || ip.indexOf(':') >= 0, 'IP format');
    });
  });

  test('validation of IPv4 ips', () => {
    assert.isTrue(utils.isIpv4Format('255.255.255.255'));
    assert.isTrue(utils.isIpv4Format('98.139.180.149'));
    assert.isTrue(utils.isIpv4Format('0.0.0.0'));
    assert.isTrue(utils.isIpv4Format('127.0.0.1'));
    assert.isTrue(utils.isIpv4Format('192.168.2.101'));

    // IPv6
    assert.isFalse(utils.isIpv4Format('FE80:0000:0000:0000:0202:B3FF:FE1E:8329'));
    assert.isFalse(utils.isIpv4Format('::1'));
    assert.isFalse(utils.isIpv4Format('FE80::0202:B3FF:FE1E:8329'));

    // IPv4 but with port
    assert.isFalse(utils.isIpv4Format('127.0.0.1:3000'));
    assert.isFalse(utils.isIpv4Format('98.139.180.149:61500'));
  });
});
