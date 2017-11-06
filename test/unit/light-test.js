'use strict';

const Lifx = require('../../').Client;
const Light = require('../../').Light;
const constant = require('../../').constants;
const assert = require('chai').assert;

suite('Light', () => {
  let client;
  let bulb;
  const getMsgQueueLength = () => {
    return client.getMessageQueue().length;
  };
  const getMsgHandlerLength = () => {
    return client.messageHandlers.length;
  };
  const getLastMsgHandlerType = () => {
    return client.messageHandlers[client.messageHandlers.length - 1].type;
  };

  // Invalid argument types
  const not = {
    bool: 'someValue',
    string: 0,
    number: 'someValue',
    func: 'someValue'
  };

  // Valid argument values
  const valid = {
    bool: true,
    hue: 100,
    saturation: 100,
    brightness: 100,
    kelvin: 3500,
    duration: 0,
    zoneIndex: 0,
    callback: () => {}
  };

  // Minimum valid values
  const min = {
    hue: 0,
    saturation: 0,
    brightness: 0,
    kelvin: 2500,
    zoneIndex: 0
  };

  // Maximum valid values
  const max = {
    hue: 360,
    saturation: 100,
    brightness: 100,
    kelvin: 9000,
    zoneIndex: 255
  };

  beforeEach(() => {
    client = new Lifx();
    bulb = new Light({
      client: client,
      id: 'F37A4311B857',
      address: '192.168.0.1',
      port: constant.LIFX_DEFAULT_PORT,
      seenOnDiscovery: 0
    });
  });

  afterEach(() => {
    client.destroy();
  });

  test('light status \'on\' after instanciation', () => {
    assert.equal(bulb.status, 'on');
  });

  test('turning a light on', () => {
    let currMsgQueCnt = getMsgQueueLength();
    let currHandlerCnt = getMsgHandlerLength();
    bulb.on();
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;

    bulb.on(200);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;

    assert.throw(() => {
      bulb.on('200');
    }, TypeError);
    assert.equal(getMsgQueueLength(), currMsgQueCnt, 'no package added to the queue');

    assert.throw(() => {
      bulb.on(200, []);
    }, TypeError);
    assert.equal(getMsgQueueLength(), currMsgQueCnt, 'no package added to the queue');
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.on(0, () => {});
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('turning a light off', () => {
    let currMsgQueCnt = getMsgQueueLength();
    let currHandlerCnt = getMsgHandlerLength();

    bulb.off();
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;

    bulb.off(200);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;

    assert.throw(() => {
      bulb.off('200');
    }, TypeError);
    assert.equal(getMsgQueueLength(), currMsgQueCnt, 'no package added to the queue');

    assert.throw(() => {
      bulb.off(200, []);
    }, TypeError);
    assert.equal(getMsgQueueLength(), currMsgQueCnt, 'no package added to the queue');
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.off(0, () => {});
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('changing the color of a light', () => {
    let currMsgQueCnt = getMsgQueueLength();
    let currHandlerCnt = getMsgHandlerLength();

    // Error cases
    assert.throw(() => {
      // No arguments
      bulb.color();
    }, TypeError);

    assert.throw(() => {
      // Too few arguments
      bulb.color(constant.HSBK_MINIMUM_HUE);
    }, TypeError);

    assert.throw(() => {
      // Too few arguments
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MINIMUM_SATURATION);
    }, TypeError);

    assert.throw(() => {
      // Saturation too low
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MINIMUM_SATURATION - 1, constant.HSBK_MINIMUM_BRIGHTNESS);
    }, RangeError);

    assert.throw(() => {
      // Saturation too high
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MAXIMUM_SATURATION + 1, constant.HSBK_MINIMUM_BRIGHTNESS);
    }, RangeError);

    assert.throw(() => {
      // Hue too low
      bulb.color(constant.HSBK_MINIMUM_HUE - 1, constant.HSBK_MINIMUM_SATURATION, constant.HSBK_MINIMUM_BRIGHTNESS);
    }, RangeError);

    assert.throw(() => {
      // Hue too high
      bulb.color(constant.HSBK_MAXIMUM_HUE + 1, constant.HSBK_MINIMUM_SATURATION, constant.HSBK_MINIMUM_BRIGHTNESS);
    }, RangeError);

    assert.throw(() => {
      // Brightness too low
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MINIMUM_SATURATION, constant.HSBK_MINIMUM_BRIGHTNESS - 1);
    }, RangeError);

    assert.throw(() => {
      // Brightness too high
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MINIMUM_SATURATION, constant.HSBK_MAXIMUM_BRIGHTNESS + 1);
    }, RangeError);

    assert.throw(() => {
      // Kelvin too high
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MINIMUM_SATURATION, constant.HSBK_MAXIMUM_BRIGHTNESS, constant.HSBK_MAXIMUM_KELVIN + 1);
    }, RangeError);

    assert.throw(() => {
      // Kelvin not a number
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MINIMUM_SATURATION, constant.HSBK_MAXIMUM_BRIGHTNESS, '100');
    }, TypeError);

    assert.throw(() => {
      // Invalid duration
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MAXIMUM_SATURATION, constant.HSBK_MINIMUM_BRIGHTNESS, constant.HSBK_MAXIMUM_KELVIN, '100');
    }, TypeError);

    assert.throw(() => {
      // Invalid callback
      bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MAXIMUM_SATURATION, constant.HSBK_MINIMUM_BRIGHTNESS, constant.HSBK_MAXIMUM_KELVIN, 100, []);
    }, TypeError);
    assert.equal(getMsgQueueLength(), currMsgQueCnt, 'no package added to the queue');

    // Success cases
    bulb.color(constant.HSBK_MAXIMUM_HUE, constant.HSBK_MINIMUM_SATURATION, constant.HSBK_MAXIMUM_BRIGHTNESS);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MAXIMUM_SATURATION, constant.HSBK_MINIMUM_BRIGHTNESS, constant.HSBK_MINIMUM_KELVIN);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.color(constant.HSBK_MINIMUM_HUE, constant.HSBK_MAXIMUM_SATURATION, constant.HSBK_MINIMUM_BRIGHTNESS, constant.HSBK_MINIMUM_KELVIN, 200);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.color(constant.HSBK_MINIMUM_BRIGHTNESS, constant.HSBK_MAXIMUM_SATURATION, constant.HSBK_MINIMUM_BRIGHTNESS, constant.HSBK_MINIMUM_KELVIN, 100, () => {});
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('changing the color of a light via rgb integer values', () => {
    let currMsgQueCnt = getMsgQueueLength();
    let currHandlerCnt = getMsgHandlerLength();

    // Error cases
    assert.throw(() => {
      // No arguments
      bulb.colorRgb();
    }, TypeError);

    assert.throw(() => {
      // Not all required arguments
      bulb.colorRgb(0);
    }, TypeError);

    assert.throw(() => {
      // Not all required arguments
      bulb.colorRgb(0, 0);
    }, TypeError);

    assert.throw(() => {
      // Invalid min red value
      bulb.colorRgb(-1, 10, 120);
    }, RangeError);

    assert.throw(() => {
      // Invalid max red value
      bulb.colorRgb(256, 250, 128);
    }, RangeError);

    assert.throw(() => {
      // Invalid min green value
      bulb.colorRgb(20, -1, 255);
    }, RangeError);

    assert.throw(() => {
      // Invalid max green value
      bulb.colorRgb(20, 2555, 82);
    }, RangeError);

    assert.throw(() => {
      // Invalid min blue value
      bulb.colorRgb(40, 123, -20);
    }, RangeError);

    assert.throw(() => {
      // Invalid max blue value
      bulb.colorRgb(95, 0, 2255);
    }, RangeError);

    // Success cases
    bulb.colorRgb(constant.RGB_MINIMUM_VALUE, constant.RGB_MINIMUM_VALUE, constant.RGB_MINIMUM_VALUE);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.colorRgb(constant.RGB_MINIMUM_VALUE, constant.RGB_MAXIMUM_VALUE, constant.RGB_MINIMUM_VALUE, 200);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.colorRgb(constant.RGB_MAXIMUM_VALUE, constant.RGB_MAXIMUM_VALUE, constant.RGB_MAXIMUM_VALUE, 15, () => {});
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('changing the color of a light via rgb hex values', () => {
    let currMsgQueCnt = getMsgQueueLength();
    let currHandlerCnt = getMsgHandlerLength();

    // Error cases
    assert.throw(() => {
      // No arguments
      bulb.colorRgbHex();
    }, TypeError);

    assert.throw(() => {
      // Wrong argument type
      bulb.colorRgbHex(0);
    }, TypeError);

    // Success cases
    bulb.colorRgbHex('#F00');
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.colorRgbHex('#FFFF00', 200);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.colorRgbHex('#FFFF00', 15, () => {});
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'package added to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('changing infrared maximum brightness', () => {
    let currMsgQueCnt = getMsgQueueLength();
    let currHandlerCnt = getMsgHandlerLength();

    // Error cases
    assert.throw(() => {
      // No arguments
      bulb.maxIR();
    }, RangeError);

    assert.throw(() => {
      // Brightness too low
      bulb.maxIR(constant.IR_MINIMUM_BRIGHTNESS - 1);
    }, RangeError);

    assert.throw(() => {
      // Brightness too high
      bulb.maxIR(constant.IR_MAXIMUM_BRIGHTNESS + 1);
    }, RangeError);

    assert.throw(() => {
      // Invalid callback
      bulb.maxIR(constant.IR_MAXIMUM_BRIGHTNESS, 'someValue');
    }, TypeError);

    bulb.maxIR(50);
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;

    bulb.maxIR(50, () => {});
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting light summary', () => {
    assert.throw(() => {
      bulb.getState('test');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getState(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting hardware', () => {
    assert.throw(() => {
      bulb.getHardwareVersion('test');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getHardwareVersion(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting firmware version', () => {
    assert.throw(() => {
      bulb.getFirmwareVersion('test');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getFirmwareVersion(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting firmware info', () => {
    assert.throw(() => {
      bulb.getFirmwareInfo('test');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getFirmwareInfo(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting wifi info', () => {
    assert.throw(() => {
      bulb.getWifiInfo('test');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getWifiInfo(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting wifi version', () => {
    assert.throw(() => {
      bulb.getWifiVersion('test');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getWifiVersion(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting the label', (done) => {
    assert.throw(() => {
      bulb.getLabel('test');
    }, TypeError, 'expects callback to be a function');

    assert.throw(() => {
      bulb.getLabel(() => {}, 'true');
    }, TypeError, 'expects cache to be a boolean');

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getLabel(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;

    bulb.getLabel(() => {}, true);
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler if no cache availible');
    currHandlerCnt += 1;

    bulb.label = 'test';
    bulb.getLabel((err, label) => {
      if (err) {
        return;
      }
      assert.equal(label, 'test');
      done();
    }, true);
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'does not add a handler if cache availible');
  });

  test('setting the label', () => {
    let currMsgQueCnt = getMsgQueueLength();
    let currHandlerCnt = getMsgHandlerLength();
    assert.throw(() => {
      bulb.setLabel(15);
    }, TypeError);

    assert.throw(() => {
      bulb.setLabel();
    }, TypeError);

    assert.throw(() => {
      bulb.setLabel('Test', []);
    }, TypeError);

    assert.throw(() => {
      bulb.setLabel('');
    }, RangeError, 'minimum of one char');

    assert.throw(() => {
      bulb.setLabel('123456789012345678901234567890123'); // 33 chars
    }, RangeError, 'maximum of 32 bytes');

    assert.throw(() => {
      bulb.setLabel('1234567890123456789012345678901💩'); // 32 chars but one 2 byte
    }, RangeError, 'maximum of 32 bytes');
    assert.equal(getMsgQueueLength(), currMsgQueCnt, 'no packet added to the queue');

    bulb.setLabel('12345678901234567890123456789012');
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt, 'no handler added');

    bulb.setLabel('12345678901234567890123456789012', () => {});
    assert.equal(getMsgQueueLength(), currMsgQueCnt + 1, 'sends a packet to the queue');
    currMsgQueCnt += 1;
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting ambient light', () => {
    assert.throw(() => {
      bulb.getAmbientLight('someValue');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getAmbientLight(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting power', () => {
    assert.throw(() => {
      bulb.getPower('someValue');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getPower(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting infrared', () => {
    assert.throw(() => {
      bulb.getMaxIR('someValue');
    }, TypeError);

    let currHandlerCnt = getMsgHandlerLength();
    bulb.getMaxIR(() => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });

  test('getting color zones', () => {
    // No arguments
    assert.throw(() => {
      bulb.getColorZones();
    }, TypeError);

    // Argument types and min/max values
    assert.throw(() => bulb.getColorZones(not.number), TypeError);
    assert.throw(() => bulb.getColorZones(not.number, valid.zoneIndex, () => {}), TypeError);
    assert.throw(() => bulb.getColorZones(valid.zoneIndex, not.number, () => {}), TypeError);
    assert.throw(() => bulb.getColorZones(valid.zoneIndex, valid.zoneIndex, not.func), TypeError);

    assert.throw(() => bulb.getColorZones(min.zoneIndex - 1, max.zoneIndex, () => {}), RangeError);
    assert.throw(() => bulb.getColorZones(min.zoneIndex, max.zoneIndex + 1, () => {}), RangeError);

    // Message handler is added
    let currHandlerCnt = getMsgHandlerLength();
    bulb.getColorZones(valid.zoneIndex, valid.zoneIndex, () => {});
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;

    // stateZone handler is added for single zone request
    bulb.getColorZones(0, 0);
    assert.equal(getLastMsgHandlerType(), 'stateZone');
    currHandlerCnt += 1;

    // stateMultiZone handler is added when multiple zones are requested
    bulb.getColorZones(0, 7);
    assert.equal(getLastMsgHandlerType(), 'stateMultiZone');
    currHandlerCnt += 1;
  });

  test('changing the color of light zones', () => {
    // No arguments or too few arguments
    assert.throw(() => bulb.colorZones(), TypeError);
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex), TypeError);

    // Argument types and ranges for zones
    assert.throw(() => bulb.colorZones(not.number, valid.zoneIndex, valid.hue, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback), TypeError);
    assert.throw(() => bulb.colorZones(valid.zoneIndex, not.number, valid.hue, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback), TypeError);

    assert.throw(() => bulb.colorZones(min.zoneIndex - 1, max.zoneIndex, valid.hue, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback), RangeError);
    assert.throw(() => bulb.colorZones(min.zoneIndex, max.zoneIndex + 1, valid.hue, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback), RangeError);

    // HSBK min/max values
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, min.hue - 1, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback), RangeError);
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, max.hue + 1, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback), RangeError);

    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, min.hue, min.saturation - 1,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback), RangeError);
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, max.hue, max.saturation + 1,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback), RangeError);

    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, valid.hue, min.saturation,
      min.brightness - 1, valid.kelvin, valid.duration, valid.bool, valid.callback), RangeError);
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, valid.hue, max.saturation,
      max.brightness + 1, valid.kelvin, valid.duration, valid.bool, valid.callback), RangeError);

    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, valid.hue, valid.saturation,
      min.brightness, min.kelvin - 1, valid.duration, valid.bool, valid.callback), RangeError);
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, valid.hue, valid.saturation,
      max.brightness, max.kelvin + 1, valid.duration, valid.bool, valid.callback), RangeError);

    // Duration, apply and callback
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, valid.hue, valid.saturation,
      valid.brightness, valid.kelvin, not.number, valid.bool, valid.callback), TypeError);
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, valid.hue, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, not.bool, valid.callback), TypeError);
    assert.throw(() => bulb.colorZones(valid.zoneIndex, valid.zoneIndex, valid.hue, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, not.func), TypeError);

    // Message handler is added
    let currHandlerCnt = getMsgHandlerLength();
    bulb.colorZones(0, 1, valid.hue, valid.saturation,
      valid.brightness, valid.kelvin, valid.duration, valid.bool, valid.callback);
    assert.equal(getMsgHandlerLength(), currHandlerCnt + 1, 'adds a handler');
    currHandlerCnt += 1;
  });
});
