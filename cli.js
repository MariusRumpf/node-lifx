'use strict';

var Lifx = require('./lib/lifx').Client;
var client = new Lifx();

client.on('error', function (err) {
  console.log('LIFX error:\n' + err.stack);
  client.destroy();
});

client.on('message', function (msg, rinfo) {
  if (typeof msg.type === 'string') {
    switch (msg.type) {
      case 'stateHostInfo':
      case 'stateHostFirmware':
      case 'stateWifiInfo':
      case 'stateWifiFirmware':
      case 'echoResponse':
        console.log(msg, ' from ' + rinfo.address);
      break;
    }
  } else {
    console.log(msg, ' from ' + rinfo.address);
  }
});

client.on('gateway', function (gateway) {
  console.log('New bulb found: ' + gateway.address);
});

client.on('listening', function () {
  var address = client.address();
  console.log(
    'Started LIFX listening on ' +
    address.address + ':' + address.port
  );
});

client.init({
  // debug: true
});
