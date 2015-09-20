# LIFX Node.js Library

[![Build Status](https://travis-ci.org/MariusRumpf/node-lifx.svg?branch=master)](https://travis-ci.org/MariusRumpf/node-lifx)
[![Build status](https://ci.appveyor.com/api/projects/status/by1ea0oh53qknq7u?svg=true)](https://ci.appveyor.com/project/MariusRumpf/node-lifx)
[![Dependency Status](https://www.versioneye.com/user/projects/557212093935300021000034/badge.svg?style=flat)](https://www.versioneye.com/user/projects/557212093935300021000034)
[![Inline docs](http://inch-ci.org/github/mariusrumpf/node-lifx.svg?branch=master)](http://inch-ci.org/github/mariusrumpf/node-lifx)

A Node.js implementation of the [LIFX protocol](https://github.com/LIFX/lifx-protocol-docs). Developed to work with a minimum firmware version of 2.0.

This library is still under development and not to be considered stable. Method names and functions may change in future releases till the first stable release.

This library is not, in any way, affiliated or related to LiFi Labs, Inc.. Use it at your own risk.

## Installation

```sh
$ npm install node-lifx --save
```

## Usage
The file `cli.js` contains a working example.

### Client
The library uses a client for network communication. This client handles communication with all lights in the network.
```js
var LifxClient = require('node-lifx').Client;
var client = new LifxClient();

client.init();
```
The `Client` object is an EventEmitter and emmits events whenever any changes occur. This can be a new light discovery, a light sending a message or similar.  
The client starts discovery of lights right after it is initialized with the `init` method. If a new light is found the client emmits a `light-new` event. This event contains the light as an object on which methods can be called then:

```js
var LifxClient = require('node-lifx').Client;
var client = new LifxClient();

client.on('light-new', function (light) {
  // Change light state here
});

client.init();
```

### Changing light state
The states of a light can be changed with different methods:

#### `light.on([duration])`  
This turns a light on. If the `duration` (in milliseconds) is given it will be faded on over the time.

#### `light.off([duration])`  
This turns a light off. If the `duration` (in milliseconds) is given it will be faded off over the time.

#### `light.color(hue, saturation, brightness, [kelvin], [duration])`  
Changes the color off a light to the given value.  
`hue` is given as number between 0 and 360. The represents the color hue in degree which changes the color.  
`saturation` is given as number between 0 and 100, representing the color intensitity from 0% to 100%.  
`brightness` is given as number between 0 and 100, representing the light brightness from 0% to 100%.  
`kelvin` if given as number between 2500 and 9000, representing the color temperature. The default value is 3500 if not given.  
`duration` if given (in milliseconds) it will fade the color to the new value over time.  
Examples: `light.color(0, 100, 50)` is red at 50% brightness. `light.color(50, 50, 80)` is a light green at 80% brightness.

### Requesting light state and info
Infos of the state and spec of the light can be requested with the following methods:

#### `light.getState(callback)`
Requests general info from a light, this includes color, label and power state. This function is asynchronous. The callback will be provided with two parameters for error and the requested data use `function(error, data) {}`.

#### `light.getFirmwareVersion(callback)`
Requests the firmware version from a light (minor and major version). This function is asynchronous. The callback will be provided with two parameters for error and the requested data use `function(error, data) {}`.

#### `light.getHardwareVersion(callback)`
Requests the hardware version from a light (vendor, product and version). This function is asynchronous. The callback will be provided with two parameters for error and the requested data use `function(error, data) {}`.

### Target a light
To get a specific light the `client.light` method can be used. It expects an identifier as first parameter, this can be the lights ip address `client.light('192.168.2.102')` or the light id `client.light('0123456789012')`. The light returned can then be used to call methods on it. For example `client.light('192.168.2.102').on()`.

### Get all known lights
All active lights will be returned as array when calling `client.lights()`. Each object can then be used to individually call methods on it. To get all lights call `client.lights('')` and to find all inactive lights call `client.lights('off')`.
