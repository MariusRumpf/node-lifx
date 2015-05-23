'use strict';

var os = require('os');
var utils = exports;

/**
 * Return all ip addresses of the machine
 */
utils.getHostIPs = function() {
  var ips = [];
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    ifaces[ifname].forEach(function (iface) {
      ips.push(iface.address);
    });
  });
  return ips;
};
