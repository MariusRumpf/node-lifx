var lifx = exports;

// Export utils
lifx.utils = require('./lifx/utils');

// Export constants
lifx.constants = require('./lifx/constants');

// Export packet parser
lifx.packet = require('./lifx/packet');

// Export client
lifx.Client = require('./lifx/client').Client;

// // Export Connection and Stream
// lifx.Stream = require('./lifx/stream').Stream;
// lifx.Connection = require('./lifx/connection').Connection;
//
// lifx.createAgent = require('./lifx/client').create;
