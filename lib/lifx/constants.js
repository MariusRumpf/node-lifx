'use strict';

module.exports = {
  // Ports used by LIFX
  LIFX_DEFAULT_PORT: 56700,
  LIFX_ANY_PORT: 56800,

  // Masks for packet description
  ADDRESSABLE_BIT: 0x1000,
  TAGGED_BIT: 0x2000,
  ORIGIN_BITS: 0xC000,
  PROTOCOL_VERSION_BITS: 0xFFF,

  // Protocol version mappings
  PROTOCOL_VERSION_CURRENT: 1024,
  PROTOCOL_VERSION_1: 1024,

  MESSAGE_RATE_LIMIT: 25, // in ms
  DISCOVERY_INTERVAL: 5000 // in ms
};
