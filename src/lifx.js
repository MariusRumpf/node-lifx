const lifx = exports;

// Export constants
lifx.constants = require('./lifx/constants');

// Export validator
lifx.validate = require('./lifx/validate');

// Export utils
lifx.utils = require('./lifx/utils');

// Export packet parser
lifx.Packet = require('./lifx/packet');

// Export light device object
lifx.Light = require('./lifx/light');

// Export client
lifx.Client = require('./lifx/client');
