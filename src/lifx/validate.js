'use strict';

var constants = require('../lifx').constants;
var format = require('util').format;
var validate = exports;

/**
 * Checks validity of given color hue, saturation and brightness values
 * @param {any} hue value to validate
 * @param {any} saturation value to validate
 * @param {any} brightness brightness value to validate
 * @param {String} context validation context
 */
validate.colorHsb = function(hue, saturation, brightness, context) {
  var hueMessage = 'LIFX %s expects hue to be a number between ' + constants.HSBK_MINIMUM_HUE + ' and ' + constants.HSBK_MAXIMUM_HUE;
  if (typeof hue !== 'number') {
    throwTypeError(hueMessage, context);
  } else if (hue < constants.HSBK_MINIMUM_HUE || hue > constants.HSBK_MAXIMUM_HUE) {
    throwRangeError(hueMessage, context);
  }

  var saturationMessage = 'LIFX %s expects saturation to be a number between ' + constants.HSBK_MINIMUM_SATURATION + ' and ' +
    constants.HSBK_MAXIMUM_SATURATION;
  if (typeof saturation !== 'number') {
    throwTypeError(saturationMessage, context);
  } else if (saturation < constants.HSBK_MINIMUM_SATURATION || saturation > constants.HSBK_MAXIMUM_SATURATION) {
    throwRangeError(saturationMessage, context);
  }

  var brightnessMessage = 'LIFX %s expects brightness to be a number between ' + constants.HSBK_MINIMUM_BRIGHTNESS + ' and ' +
    constants.HSBK_MAXIMUM_BRIGHTNESS;
  if (typeof brightness !== 'number') {
    throwTypeError(brightnessMessage, context);
  } else if (brightness < constants.HSBK_MINIMUM_BRIGHTNESS || brightness > constants.HSBK_MAXIMUM_BRIGHTNESS) {
    throwRangeError(brightnessMessage, context);
  }
};

/**
 * Checks validity of color RGB values
 * @param {any} red Red value to validate
 * @param {any} green Green value to validate
 * @param {any} blue Blue value to validate
 * @param {String} context validation context
 */
validate.colorRgb = function(red, green, blue, context) {
  if (typeof red !== 'number') {
    throwTypeError('LIFX %s expects first parameter red to a number', context);
  }
  if (red < constants.RGB_MINIMUM_VALUE || red > constants.RGB_MAXIMUM_VALUE) {
    throwRangeError('LIFX %s expects first parameter red to be between 0 and 255', context);
  }
  if (typeof green !== 'number') {
    throwTypeError('LIFX %s expects second parameter green to a number', context);
  }
  if (green < constants.RGB_MINIMUM_VALUE || green > constants.RGB_MAXIMUM_VALUE) {
    throwRangeError('LIFX %s expects second parameter green to be between 0 and 255', context);
  }
  if (typeof blue !== 'number') {
    throwTypeError('LIFX %s expects third parameter blue to a number', context);
  }
  if (blue < constants.RGB_MINIMUM_VALUE || blue > constants.RGB_MAXIMUM_VALUE) {
    throw new RangeError('LIFX light colorRgb method expects third parameter blue to be between 0 and 255');
  }
};

/**
 * Checks validity of IR brightness
 * @param {any} brightness IR brightness to validate
 * @param {String} context validation context
 */
validate.irBrightness = function(brightness, context) {
  if (typeof brightness !== 'number' || brightness < constants.IR_MINIMUM_BRIGHTNESS || brightness > constants.IR_MAXIMUM_BRIGHTNESS) {
    throwRangeError('LIFX %s expects brightness to be a number between ' +
      constants.IR_MINIMUM_BRIGHTNESS + ' and ' + constants.IR_MAXIMUM_BRIGHTNESS, context);
  }
};

/**
 * Checks validity of an optional kelvin value
 * @param {any} kelvin Kelvin value to validate
 * @param {String} context validation context
 */
validate.optionalKelvin = function(kelvin, context) {
  var message = 'LIFX %s expects kelvin to be a number between 2500 and 9000';
  if (kelvin !== undefined) {
    if (typeof kelvin !== 'number') {
      throwTypeError(message, context);
    } else if (kelvin < constants.HSBK_MINIMUM_KELVIN || kelvin > constants.HSBK_MAXIMUM_KELVIN) {
      throwRangeError(message, context);
    }
  }
};

/**
 * Checks validity of an optional transition time
 * @param {any} duration Transition time to validate
 * @param {String} context validation context
 */
validate.optionalDuration = function(duration, context) {
  if (duration !== undefined && typeof duration !== 'number') {
    throwTypeError('LIFX %s expects duration to be a number', context);
  }
};

/**
 * Checks validity of a callback function
 * @param {any} callback Callback to validate
 * @param {String} context validation context
 */
validate.callback = function(callback, context) {
  if (typeof callback !== 'function') {
    throwTypeError('LIFX %s expects callback to be a function', context);
  }
};

/**
 * Checks validity of an optional callback function
 * @param {any} callback Callback to validate
 * @param {String} context validation context
 */
validate.optionalCallback = function(callback, context) {
  if (callback !== undefined && typeof callback !== 'function') {
    throwTypeError('LIFX %s expects callback to be a function', context);
  }
};

/**
 * Checks validity of an optional boolean
 * @param {any} value value to validate
 * @param {any} parameter validated parameter name
 * @param {String} context validation context
 */
validate.optionalBoolean = function(value, parameter, context) {
  if (value !== undefined && typeof value !== 'boolean') {
    throwTypeError('LIFX %s expects "%s" to be a boolean', context, parameter);
  }
};

/**
 * Checks validity of a light zone index
 * @param {any} index Light zone index to validate
 * @param {String} context validation context
 */
validate.zoneIndex = function(index, context) {
  var zoneMessage = 'LIFX %s expects zone to be a number between ' +
    constants.ZONE_INDEX_MINIMUM_VALUE + ' and ' + constants.ZONE_INDEX_MAXIMUM_VALUE;
  if (typeof index !== 'number') {
    throwTypeError(zoneMessage, context);
  } else if (index < constants.ZONE_INDEX_MINIMUM_VALUE || index > constants.ZONE_INDEX_MAXIMUM_VALUE) {
    throwRangeError(zoneMessage, context);
  }
};

/**
 * Checks validity of an optional light zone index
 * @param {any} index Light zone index to validate
 * @param {String} context validation context
 */
validate.optionalZoneIndex = function(index, context) {
  var zoneMessage = 'LIFX %s expects zone to be a number between ' +
    constants.ZONE_INDEX_MINIMUM_VALUE + ' and ' + constants.ZONE_INDEX_MAXIMUM_VALUE;
  if (index !== undefined) {
    if (typeof index !== 'number') {
      throwTypeError(zoneMessage, context);
    } else if (index < constants.ZONE_INDEX_MINIMUM_VALUE || index > constants.ZONE_INDEX_MAXIMUM_VALUE) {
      throwRangeError(zoneMessage, context);
    }
  }
};

/**
 * Formats error message and throws a TypeError
 * @param {String} message Error message
 * @param {String} context Validation context
 * @param {String} [parameter] Validated parameter name
 */
function throwTypeError(message, context, parameter) {
  throw new TypeError(format(message, context, parameter));
}

/**
 * Formats the error message and throws a RangeError
 * @param {String} message Error message
 * @param {String} context Validation context
 * @param {String} [parameter] Validated parameter name
 */
function throwRangeError(message, context, parameter) {
  throw new RangeError(format(message, context, parameter));
}
