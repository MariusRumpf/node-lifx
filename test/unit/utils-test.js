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

  test('rgb hex string to object with decimal rgb values', () => {
    assert.deepEqual(utils.rgbHexStringToObject('#FFF'), {r: 255, g: 255, b: 255});
    assert.deepEqual(utils.rgbHexStringToObject('#fff'), {r: 255, g: 255, b: 255});
    assert.deepEqual(utils.rgbHexStringToObject('#000'), {r: 0, g: 0, b: 0});
    assert.deepEqual(utils.rgbHexStringToObject('#F00'), {r: 255, g: 0, b: 0});
    assert.deepEqual(utils.rgbHexStringToObject('#f00'), {r: 255, g: 0, b: 0});
    assert.deepEqual(utils.rgbHexStringToObject('#30d'), {r: 51, g: 0, b: 221});
    assert.deepEqual(utils.rgbHexStringToObject('#FFFFFF'), {r: 255, g: 255, b: 255});
    assert.deepEqual(utils.rgbHexStringToObject('#000000'), {r: 0, g: 0, b: 0});
    assert.deepEqual(utils.rgbHexStringToObject('#747147'), {r: 116, g: 113, b: 71});
    assert.deepEqual(utils.rgbHexStringToObject('#d52664'), {r: 213, g: 38, b: 100});
  });

  test('maximum number in array', () => {
    let values = [24, 1, 18, 254, 255, 21, 0];
    assert.equal(utils.maxNumberInArray(values), 255);
    assert.equal(values[0], 24); // Keep original order

    values = [0.25, 0.325, 0.125, 0.333, 0.75, 0.999];
    assert.equal(utils.maxNumberInArray(values), 0.999);
    assert.equal(values[0], 0.25); // Keep original order
  });

  test('minimum number in array', () => {
    let values = [24, 1, 18, 254, 255, 21, 0];
    assert.equal(utils.minNumberInArray(values), 0);
    assert.equal(values[0], 24); // Keep original order

    values = [0.25, 0.325, 0.125, 0.333, 0.75, 0.999];
    assert.equal(utils.minNumberInArray(values), 0.125);
    assert.equal(values[0], 0.25); // Keep original order
  });

  test('rgb to hsb conversion', () => {
    let rgbObj = {r: 255, g: 255, b: 255};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 0, s: 0, b: 100});

    rgbObj = {r: 0, g: 0, b: 0};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 0, s: 0, b: 0});

    rgbObj = {r: 255, g: 0, b: 0};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 0, s: 100, b: 100});

    rgbObj = {r: 0, g: 255, b: 0};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 120, s: 100, b: 100});

    rgbObj = {r: 0, g: 0, b: 255};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 240, s: 100, b: 100});

    rgbObj = {r: 128, g: 128, b: 0};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 60, s: 100, b: 50});

    rgbObj = {r: 128, g: 128, b: 128};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 0, s: 0, b: 50});

    rgbObj = {r: 218, g: 21, b: 211};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 302, s: 90, b: 85});

    rgbObj = {r: 83, g: 146, b: 141};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 175, s: 43, b: 57});

    rgbObj = {r: 146, g: 108, b: 83};
    assert.deepEqual(utils.rgbToHsb(rgbObj), {h: 24, s: 43, b: 57});
  });

  test('get hardware info', () => {
    const vendorId = 1;
    let hardwareId;

    hardwareId = 1;
    assert.deepEqual(utils.getHardwareDetails(vendorId, hardwareId), {
      vendorName: 'LIFX',
      productName: 'Original 1000',
      productFeatures: {
        color: true,
        infrared: false,
        multizone: false
      }
    });

    hardwareId = 10;
    assert.deepEqual(utils.getHardwareDetails(vendorId, hardwareId), {
      vendorName: 'LIFX',
      productName: 'White 800 (Low Voltage)',
      productFeatures: {
        color: false,
        infrared: false,
        multizone: false
      }
    });

    // Product and Vendor IDs start with 1
    assert.equal(utils.getHardwareDetails(0, 1), false);
    assert.equal(utils.getHardwareDetails(1, 0), false);
  });
});
