'use strict';

var LifxClient = require('../lib/lifx').Client;
var client = new LifxClient();

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

console.log('Keys:');
console.log('Press 1 to turn the lights on');
console.log('Press 2 to turn the lights off');
console.log('Press 3 to turn the lights red');
console.log('Press 4 to turn the lights green');
console.log('Press 5 to turn the lights blue');
console.log('Press 6 to turn the lights a bright bluish white');
console.log('Press 7 to turn the lights a bright reddish white');
console.log('Press 8 to show debug messages including network traffic');
console.log('Press 9 to hide debug messages including network traffic');
console.log('Press 0 to exit\n');

process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);

process.stdin.on('data', function(key) {
  if (key === '1') {
    client.lights().forEach(function(bulb) {
      bulb.on();
    });
    console.log('All lights turned on');
  } else if (key === '2') {
    client.lights().forEach(function(bulb) {
      bulb.off();
    });
    console.log('All lights turned off');
  } else if (key === '3') {
    client.lights().forEach(function(bulb) {
      bulb.color(0, 100, 100);
    });
    console.log('All lights turned red');
  } else if (key === '4') {
    client.lights().forEach(function(bulb) {
      bulb.color(120, 100, 100);
    });
    console.log('All lights turned green');
  } else if (key === '5') {
    client.lights().forEach(function(bulb) {
      bulb.color(240, 100, 100);
    });
    console.log('All lights turned blue');
  } else if (key === '6') {
    client.lights().forEach(function(bulb) {
      bulb.color(0, 0, 100, 9000);
    });
    console.log('All lights turned to bright bluish white');
  } else if (key === '7') {
    client.lights().forEach(function(bulb) {
      bulb.color(0, 0, 100, 2500);
    });
    console.log('All lights turned to bright reddish white');
  } else if (key === '8') {
    client.setDebug(true);
    console.log('Debug messages are shown');
  } else if (key === '9') {
    client.setDebug(false);
    console.log('Debug messages are hidden');
  } else if (key === '\u0003' || key === '0') { // Ctrl + C
    client.destroy();
    process.exit(); // eslint-disable-line no-process-exit
  }
});
