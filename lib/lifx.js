var lifx = exports;

// Export constants
lifx.constants = require('./lifx/constants');

// Export utils
lifx.utils = require('./lifx/utils');

// Export packet parser
lifx.packet = require('./lifx/packet');

// Export light device object
lifx.Light = require('./lifx/light').Light;

// Export client
lifx.Client = require('./lifx/client').Client;
