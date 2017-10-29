'use strict';

const {Packet, constants, validate, utils} = require('../lifx');
const {assign, pick} = require('lodash');

class Light {
  constructor(constr) {
    this.client = constr.client;
    this.id = constr.id; // Used to target the light
    this.address = constr.address;
    this.port = constr.port;
    this.label = null;
    this.status = 'on';

    this.seenOnDiscovery = constr.seenOnDiscovery;
  }

  /**
   * Turns the light off
   * @example light('192.168.2.130').off()
   * @param {Number} [duration] transition time in milliseconds
   * @param {Function} [callback] called when light did receive message
   */
  off(duration, callback) {
    validate.optionalDuration(duration, 'light off method');
    validate.optionalCallback(callback, 'light off method');

    const packetObj = Packet.create('setPower', {
      level: 0,
      duration: duration
    }, this.client.source);
    packetObj.target = this.id;
    this.client.send(packetObj, callback);
  }

  /**
   * Turns the light on
   * @example light('192.168.2.130').on()
   * @param {Number} [duration] transition time in milliseconds
   * @param {Function} [callback] called when light did receive message
   */
  on(duration, callback) {
    validate.optionalDuration(duration, 'light on method');
    validate.optionalCallback(callback, 'light on method');

    const packetObj = Packet.create('setPower', {
      level: 65535,
      duration: duration
    }, this.client.source);
    packetObj.target = this.id;
    this.client.send(packetObj, callback);
  }

  /**
   * Changes the color to the given HSBK value
   * @param {Number} hue        color hue from 0 - 360 (in °)
   * @param {Number} saturation color saturation from 0 - 100 (in %)
   * @param {Number} brightness color brightness from 0 - 100 (in %)
   * @param {Number} [kelvin=3500]   color kelvin between 2500 and 9000
   * @param {Number} [duration] transition time in milliseconds
   * @param {Function} [callback] called when light did receive message
   */
  color(hue, saturation, brightness, kelvin, duration, callback) {
    validate.colorHsb(hue, saturation, brightness, 'light color method');

    validate.optionalKelvin(kelvin, 'light color method');
    validate.optionalDuration(duration, 'light color method');
    validate.optionalCallback(callback, 'light color method');

    // Convert HSB values to packet format
    hue = Math.round(hue / constants.HSBK_MAXIMUM_HUE * 65535);
    saturation = Math.round(saturation / constants.HSBK_MAXIMUM_SATURATION * 65535);
    brightness = Math.round(brightness / constants.HSBK_MAXIMUM_BRIGHTNESS * 65535);

    const packetObj = Packet.create('setColor', {
      hue: hue,
      saturation: saturation,
      brightness: brightness,
      kelvin: kelvin,
      duration: duration
    }, this.client.source);
    packetObj.target = this.id;
    this.client.send(packetObj, callback);
  }

  /**
   * Changes the color to the given rgb value
   * Note RGB poorly represents the color of light, prefer setting HSBK values with the color method
   * @example light.colorRgb(255, 0, 0)
   * @param {Integer} red value between 0 and 255 representing amount of red in color
   * @param {Integer} green value between 0 and 255 representing amount of green in color
   * @param {Integer} blue value between 0 and 255 representing amount of blue in color
   * @param {Number} [duration] transition time in milliseconds
   * @param {Function} [callback] called when light did receive message
   */
  colorRgb(red, green, blue, duration, callback) {
    validate.colorRgb(red, green, blue, 'light colorRgb method');
    validate.optionalDuration(duration, 'light colorRgb method');
    validate.optionalCallback(callback, 'light colorRgb method');

    const hsbObj = utils.rgbToHsb({
      r: red,
      g: green,
      b: blue
    });
    this.color(hsbObj.h, hsbObj.s, hsbObj.b, 3500, duration, callback);
  }

  /**
   * Changes the color to the given rgb value
   * Note RGB poorly represents the color of light, prefer setting HSBK values with the color method
   * @example light.colorRgb('#FF0000')
   * @param {String} hexString rgb hex string starting with # char
   * @param {Number} [duration] transition time in milliseconds
   * @param {Function} [callback] called when light did receive message
   */
  colorRgbHex(hexString, duration, callback) {
    if (typeof hexString !== 'string') {
      throw new TypeError('LIFX light colorRgbHex method expects first parameter hexString to a string');
    }

    validate.optionalDuration(duration, 'light colorRgbHex method');
    validate.optionalCallback(callback, 'light colorRgbHex method');

    const rgbObj = utils.rgbHexStringToObject(hexString);
    const hsbObj = utils.rgbToHsb(rgbObj);
    this.color(hsbObj.h, hsbObj.s, hsbObj.b, 3500, duration, callback);
  }

  /**
   * Sets the Maximum Infrared brightness
   * @param {Number} brightness infrared brightness from 0 - 100 (in %)
   * @param {Function} [callback] called when light did receive message
   */
  maxIR(brightness, callback) {
    validate.irBrightness(brightness, 'light setMaxIR method');

    brightness = Math.round(brightness / constants.IR_MAXIMUM_BRIGHTNESS * 65535);

    if (callback !== undefined && typeof callback !== 'function') {
      throw new TypeError('LIFX light setMaxIR method expects callback to be a function');
    }

    const packetObj = Packet.create('setInfrared', {
      brightness: brightness
    }, this.client.source);
    packetObj.target = this.id;
    this.client.send(packetObj, callback);
  }

  /**
   * Requests the current state of the light
   * @param {Function} callback a function to accept the data
   */
  getState(callback) {
    validate.callback(callback, 'light getState method');

    const packetObj = Packet.create('getLight', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateLight', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      // Convert HSB to readable format
      msg.color.hue = Math.round(msg.color.hue * (constants.HSBK_MAXIMUM_HUE / 65535));
      msg.color.saturation = Math.round(msg.color.saturation * (constants.HSBK_MAXIMUM_SATURATION / 65535));
      msg.color.brightness = Math.round(msg.color.brightness * (constants.HSBK_MAXIMUM_BRIGHTNESS / 65535));
      // Convert power to readable format
      if (msg.power === 65535) {
        msg.power = 1;
      }
      callback(null, {
        color: msg.color,
        power: msg.power,
        label: msg.label
      });
    }, sqnNumber);
  }

  /**
   * Requests the current maximum setting for the infrared channel
   * @param  {Function} callback a function to accept the data
   */
  getMaxIR(callback) {
    validate.callback(callback, 'light getMaxIR method');

    const packetObj = Packet.create('getInfrared', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateInfrared', function(err, msg) {
      if (err) {
        return callback(err, null);
      }

      msg.brightness = Math.round(msg.brightness * (constants.HSBK_MAXIMUM_BRIGHTNESS / 65535));

      callback(null, msg.brightness);
    }, sqnNumber);
  }

  /**
   * Requests hardware info from the light
   * @param {Function} callback a function to accept the data with error and
   *                   message as parameters
   */
  getHardwareVersion(callback) {
    validate.callback(callback, 'light getHardwareVersion method');

    const packetObj = Packet.create('getVersion', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateVersion', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      const versionInfo = pick(msg, [
        'vendorId',
        'productId',
        'version'
      ]);
      callback(null, assign(
        versionInfo,
        utils.getHardwareDetails(versionInfo.vendorId, versionInfo.productId)
      ));
    }, sqnNumber);
  }

  /**
   * Requests used version from the microcontroller unit of the light
   * @param {Function} callback a function to accept the data
   */
  getFirmwareVersion(callback) {
    validate.callback(callback, 'light getFirmwareIgetFirmwareVersion method');

    const packetObj = Packet.create('getHostFirmware', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateHostFirmware', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      callback(null, pick(msg, [
        'majorVersion',
        'minorVersion'
      ]));
    }, sqnNumber);
  }

  /**
   * Requests infos from the microcontroller unit of the light
   * @param {Function} callback a function to accept the data
   */
  getFirmwareInfo(callback) {
    validate.callback(callback, 'light getFirmwareInfo method');

    const packetObj = Packet.create('getHostInfo', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateHostInfo', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      callback(null, pick(msg, [
        'signal',
        'tx',
        'rx'
      ]));
    }, sqnNumber);
  }

  /**
   * Requests wifi infos from for the light
   * @param {Function} callback a function to accept the data
   */
  getWifiInfo(callback) {
    validate.callback(callback, 'light getWifiInfo method');

    const packetObj = Packet.create('getWifiInfo', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateWifiInfo', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      callback(null, pick(msg, [
        'signal',
        'tx',
        'rx'
      ]));
    }, sqnNumber);
  }

  /**
   * Requests used version from the wifi controller unit of the light (wifi firmware version)
   * @param {Function} callback a function to accept the data
   */
  getWifiVersion(callback) {
    validate.callback(callback, 'light getWifiVersion method');

    const packetObj = Packet.create('getWifiFirmware', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateWifiFirmware', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, pick(msg, [
        'majorVersion',
        'minorVersion'
      ]));
    }, sqnNumber);
  }

  /**
   * Requests the label of the light
   * @param {Function} callback a function to accept the data
   * @param {Boolean} [cache=false] return cached result if existent
   * @return {Function} callback(err, label)
   */
  getLabel(callback, cache) {
    validate.callback(callback, 'light getLabel method');

    if (cache !== undefined && typeof cache !== 'boolean') {
      throw new TypeError('LIFX light getLabel method expects cache to be a boolean');
    }
    if (cache === true) {
      if (typeof this.label === 'string' && this.label.length > 0) {
        return callback(null, this.label);
      }
    }
    const packetObj = Packet.create('getLabel', {
      target: this.id
    }, this.client.source);
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateLabel', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, msg.label);
    }, sqnNumber);
  }

  /**
   * Sets the label of light
   * @example light.setLabel('Kitchen')
   * @param {String} label new label to be set, maximum 32 bytes
   * @param {Function} [callback] called when light did receive message
   */
  setLabel(label, callback) {
    if (label === undefined || typeof label !== 'string') {
      throw new TypeError('LIFX light setLabel method expects label to be a string');
    }
    if (Buffer.byteLength(label, 'utf8') > 32) {
      throw new RangeError('LIFX light setLabel method expects a maximum of 32 bytes as label');
    }
    if (label.length < 1) {
      throw new RangeError('LIFX light setLabel method expects a minimum of one char as label');
    }
    validate.optionalCallback(callback, 'light setLabel method');

    const packetObj = Packet.create('setLabel', {
      label: label
    }, this.client.source);
    packetObj.target = this.id;
    this.client.send(packetObj, callback);
  }

  /**
   * Requests ambient light value of the light
   * @param {Function} callback a function to accept the data
   */
  getAmbientLight(callback) {
    validate.callback(callback, 'light getAmbientLight method');

    const packetObj = Packet.create('getAmbientLight', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('stateAmbientLight', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, msg.flux);
    }, sqnNumber);
  }

  /**
   * Requests the power level of the light
   * @param {Function} callback a function to accept the data
   */
  getPower(callback) {
    validate.callback(callback, 'light getPower method');

    const packetObj = Packet.create('getPower', {}, this.client.source);
    packetObj.target = this.id;
    const sqnNumber = this.client.send(packetObj);
    this.client.addMessageHandler('statePower', function(err, msg) {
      if (err) {
        return callback(err, null);
      }
      if (msg.level === 65535) {
        msg.level = 1;
      }
      return callback(null, msg.level);
    }, sqnNumber);
  }

  /**
   * Requests the current color zone states from a light
   * @param {Number} startIndex start color zone index
   * @param {Number} [endIndex] end color zone index
   * @param {Function} callback a function to accept the data
   */
  getColorZones(startIndex, endIndex, callback) {
    validate.zoneIndex(startIndex, 'light getColorZones method');
    validate.optionalZoneIndex(endIndex, 'light getColorZones method');
    validate.optionalCallback(callback, 'light getColorZones method');

    const packetObj = Packet.create('getColorZones', {}, this.client.source);
    packetObj.target = this.id;
    packetObj.startIndex = startIndex;
    packetObj.endIndex = endIndex;
    const sqnNumber = this.client.send(packetObj);
    if (endIndex === undefined || startIndex === endIndex) {
      this.client.addMessageHandler('stateZone', function(err, msg) {
        if (err) {
          return callback(err, null);
        }
        // Convert HSB to readable format
        msg.color.hue = Math.round(msg.color.hue * (constants.HSBK_MAXIMUM_HUE / 65535));
        msg.color.saturation = Math.round(msg.color.saturation * (constants.HSBK_MAXIMUM_SATURATION / 65535));
        msg.color.brightness = Math.round(msg.color.brightness * (constants.HSBK_MAXIMUM_BRIGHTNESS / 65535));
        callback(null, {
          count: msg.count,
          index: msg.index,
          color: msg.color
        });
      }, sqnNumber);
    } else {
      this.client.addMessageHandler('stateMultiZone', function(err, msg) {
        if (err) {
          return callback(err, null);
        }
        // Convert HSB values to readable format
        msg.color.forEach(function(color) {
          color.hue = Math.round(color.hue * (constants.HSBK_MAXIMUM_HUE / 65535));
          color.saturation = Math.round(color.saturation * (constants.HSBK_MAXIMUM_SATURATION / 65535));
          color.brightness = Math.round(color.brightness * (constants.HSBK_MAXIMUM_BRIGHTNESS / 65535));
        });
        callback(null, {
          count: msg.count,
          index: msg.index,
          color: msg.color
        });
      }, sqnNumber);
    }
  }

  /**
   * Changes a color zone range to the given HSBK value
   * @param {Number} startIndex start zone index from 0 - 255
   * @param {Number} endIndex start zone index from 0 - 255
   * @param {Number} hue color hue from 0 - 360 (in °)
   * @param {Number} saturation color saturation from 0 - 100 (in %)
   * @param {Number} brightness color brightness from 0 - 100 (in %)
   * @param {Number} [kelvin=3500] color kelvin between 2500 and 9000
   * @param {Number} [duration] transition time in milliseconds
   * @param {Boolean} [apply=true] apply changes immediately or leave pending for next apply
   * @param {Function} [callback] called when light did receive message
   */
  colorZones(startIndex, endIndex, hue, saturation, brightness, kelvin, duration, apply, callback) {
    validate.zoneIndex(startIndex, 'color zones method');
    validate.zoneIndex(endIndex, 'color zones method');
    validate.colorHsb(hue, saturation, brightness, 'color zones method');

    validate.optionalKelvin(kelvin, 'color zones method');
    validate.optionalDuration(duration, 'color zones method');
    validate.optionalBoolean(apply, 'apply', 'color zones method');
    validate.optionalCallback(callback, 'color zones method');

    // Convert HSB values to packet format
    hue = Math.round(hue / constants.HSBK_MAXIMUM_HUE * 65535);
    saturation = Math.round(saturation / constants.HSBK_MAXIMUM_SATURATION * 65535);
    brightness = Math.round(brightness / constants.HSBK_MAXIMUM_BRIGHTNESS * 65535);

    const appReq = apply === false ? constants.APPLICATION_REQUEST_VALUES.NO_APPLY : constants.APPLICATION_REQUEST_VALUES.APPLY;
    const packetObj = Packet.create('setColorZones', {
      startIndex: startIndex,
      endIndex: endIndex,
      hue: hue,
      saturation: saturation,
      brightness: brightness,
      kelvin: kelvin,
      duration: duration,
      apply: appReq
    }, this.client.source);
    packetObj.target = this.id;
    this.client.send(packetObj, callback);
  }
}

module.exports.Light = Light;
