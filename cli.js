'use strict';

var Lifx = require('./lib/lifx').Client;
var client = new Lifx();

client.on('error', function (err) {
  console.log('LIFX error:\n' + err.stack);
  client.destroy();
});

client.on('message', function (msg, rinfo) {
  if (typeof msg.type === 'string') {
    // Known packages send by the bulbs
    // as broadcast
    switch (msg.type) {
      case 'stateHostInfo':
      case 'stateHostFirmware':
      case 'stateWifiInfo':
      case 'stateWifiFirmware':
      case 'echoResponse':
      case 'getOwner':
      case 'stateOwner':
      case 'getGroup':
      case 'getVersion':
      case 'stateVersion':
      case 'stateGroup':
      case 'getLocation':
      case 'stateLocation':
      case 'stateTemperature':
      case 'stateLight':
      case 'statePower':
        console.log(msg, ' from ' + rinfo.address);
      break;
    }
  } else {
    // Unknown message type
    console.log(msg, ' from ' + rinfo.address);
  }
});

client.on('bulb-new', function (bulb) {
  console.log('New bulb found: ' + bulb.address + ':' + bulb.port);
});

client.on('bulb-online', function (bulb) {
  console.log('Bulb back online: ' + bulb.address + ':' + bulb.port);
});

client.on('bulb-offline', function (bulb) {
  console.log('Bulb offline: ' + bulb.address + ':' + bulb.port);
});

client.on('listening', function () {
  var address = client.address();
  console.log(
    'Started LIFX listening on ' +
    address.address + ':' + address.port
  );
});

client.init();
