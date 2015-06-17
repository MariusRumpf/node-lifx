var packets = exports;

/*
 * Device related packages
 */
packets.getService = require('./getService');
packets.stateService = require('./stateService');

packets.getHostInfo = require('./getHostInfo');
packets.stateHostInfo = require('./stateHostInfo');

packets.getHostFirmware = require('./getHostFirmware');
packets.stateHostFirmware = require('./stateHostFirmware');

packets.getHostFirmware = require('./getHostFirmware');
packets.stateHostFirmware = require('./stateHostFirmware');

packets.getWifiInfo = require('./getWifiInfo');
packets.stateWifiInfo = require('./stateWifiInfo');

packets.getWifiFirmware = require('./getWifiFirmware');
packets.stateWifiFirmware = require('./stateWifiFirmware');

packets.getVersion = require('./getVersion');
packets.stateVersion = require('./stateVersion');

packets.echoRequest = require('./echoRequest');
packets.echoResponse = require('./echoResponse');

packets.getLocation = require('./getLocation');
packets.stateLocation = require('./stateLocation');

packets.getOwner = require('./getOwner');
packets.stateOwner = require('./stateOwner');

packets.getGroup = require('./getGroup');
packets.stateGroup = require('./stateGroup');

/*
 * Light device related packages
 */
packets.stateLight = require('./stateLight');

packets.stateTemperature = require('./stateTemperature');

packets.statePower = require('./statePower');
