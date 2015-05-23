'use strict';

var Lifx = require('./lib/lifx').Client;
var client = new Lifx();

client.on('error', function (err) {
  console.log('LIFX error:\n' + err.stack);
  client.destroy();
});

client.on('message', function (msg, rinfo) {
  console.log(msg, ' from ' + rinfo.address);
});

client.on('listening', function () {
  var address = client.address();
  console.log('Started LIFX listening on ' +
      address.address + ':' + address.port);
});

client.init();
