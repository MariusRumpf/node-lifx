export class Client {

  /**
  * Creates a lifx client
  * @extends EventEmitter
  */
  constructor();

  /**
  * Adds a message handler that calls a function when the requested
  * info was received
  * @param {String} type A type of packet to listen for, like stateLight
  * @param {Function} callback the function to call if the packet was received,
  *                   this will be called with parameters msg and rinfo
  * @param {Number} [sequenceNumber] Expects a specific sequenceNumber on which will
  *                                  be called, this will call it only once. If not
  *                                  given the callback handler is permanent
  */
  addMessageHandler(type: any, callback: any, sequenceNumber: any): void;

  /**
  * Get network address data from connection
  * @return {Object} Network address data
  */
  address(): any;

  /**
  * Destroy an instance
  */
  destroy(): void;

  /**
  * Creates a new socket and starts discovery
  * @example
  * init({debug: true}, function() {
  *   console.log('Client started');
  * })
  * @param {Object} [options] Configuration to use
  * @param {String} [options.address] The IPv4 address to bind to
  * @param {Number} [options.port] The port to bind to
  * @param {Boolean} [options.debug] Show debug output
  * @param {Number} [options.lightOfflineTolerance] If light hasn't answered for amount of discoveries it is set offline
  * @param {Number} [options.messageHandlerTimeout] Message handlers not called will be removed after this delay in ms
  * @param {String} [options.source] The source to send to light, must be 8 chars lowercase or digit
  * @param {Boolean} [options.startDiscovery] Weather to start discovery after initialization or not
  * @param {Array} [options.lights] Pre set list of ip addresses of known addressable lights
  * @param {String} [options.broadcast] The broadcast address to use for light discovery
  * @param {Function} [callback] Called after initialation
  */
  init(options: any, callback: any): any;

  /**
  * Find a light by label, id or ip
  * @param {String} identifier label, id or ip to search for
  * @return {Object|Boolean} the light object or false if not found
  */
  light(identifier: any): any;

  /**
  * Returns the list of all known lights
  * @example client.lights()
  * @param {String} [status='on'] Status to filter for, empty string for all
  * @return {Array} Lights
  */
  lights(status: any): any;

  /**
  * Processes a discovery report packet to update internals
  * @param {Object} err Error if existant
  * @param {Object} msg The discovery report package
  * @param {Object} rinfo Remote host details
  */
  processDiscoveryPacket(err: any, msg: any, rinfo: any): void;

  /**
  * Processes a state label packet to update internals
  * @param {Object} err Error if existant
  * @param {Object} msg The state label package
  */
  processLabelPacket(err: any, msg: any): void;

  /**
  * Checks all registered message handlers if they request the given message
  * @param {Object} msg message to check handler for
  * @param {Object} rinfo rinfo address info to check handler for
  */
  processMessageHandlers(msg: any, rinfo: any): any;

  /**
  * Send a LIFX message objects over the network
  * @param  {Object} msg A message object or multiple with data to send
  * @param  {Function} [callback] Function to handle error and success after send
  * @return {Number} The sequence number of the request
  */
  send(msg: any, callback: any): any;

  /**
  * Sends a packet from the messages queue or stops the sending process
  * if queue is empty
  **/
  sendingProcess(): any;

  /**
  * Sets debug on or off at runtime
  * @param {Boolean} debug debug messages on
  */
  setDebug(debug: any): void;

  /**
  * Start discovery of lights
  * This will keep the list of lights updated, finds new lights and sets lights
  * offline if no longer found
  * @param {Array} [lights] Pre set list of ip addresses of known addressable lights to request directly
  */
  startDiscovery(lights: any): void;

  /**
  * Starts the sending of all packages in the queue
  */
  startSendingProcess(): void;

  /**
  * This stops the discovery process
  * The client will be no longer updating the state of lights or find lights
  */
  stopDiscovery(): void;

  /**
  * Stops sending of all packages in the queue
  */
  stopSendingProcess(): void;
}

export class Light {

  /**
  * A representation of a light bulb
  * @class
  * @param {Obj} constr constructor object
  * @param {Lifx/Client} constr.client the client the light belongs to
  * @param {String} constr.id the id used to target the light
  * @param {String} constr.address ip address of the light
  * @param {Number} constr.port port of the light
  * @param {Number} constr.seenOnDiscovery on which discovery the light was last seen
  */
  constructor(constr: any);

  /**
  * Changes the color to the given HSBK value
  * @param {Number} hue        color hue from 0 - 360 (in °)
  * @param {Number} saturation color saturation from 0 - 100 (in %)
  * @param {Number} brightness color brightness from 0 - 100 (in %)
  * @param {Number} [kelvin=3500]   color kelvin between 2500 and 9000
  * @param {Number} [duration] transition time in milliseconds
  * @param {Function} [callback] called when light did receive message
  */
  color(hue: any, saturation: any, brightness: any, kelvin: any, duration: any, callback: any): void;

  /**
  * Changes the color to the given rgb value
  * Note RGB poorly represents the color of light, prefer setting HSBK values with the color method
  * @example light.colorRgb(255, 0, 0)
  * @param {Integer} red value between 0 and 255 representing amount of red in color
  * @param {Integer} green value between 0 and 255 representing amount of green in color
  * @param {Integer} blue value between 0 and 255 representing amount of blue in color
  * @param {Number} [duration] transition time in milliseconds
  * @param {Function} [callback] called when light did receive message
  */
  colorRgb(red: any, green: any, blue: any, duration: any, callback: any): void;

  /**
  * Changes the color to the given rgb value
  * Note RGB poorly represents the color of light, prefer setting HSBK values with the color method
  * @example light.colorRgb('#FF0000')
  * @param {String} hexString rgb hex string starting with # char
  * @param {Number} [duration] transition time in milliseconds
  * @param {Function} [callback] called when light did receive message
  */
  colorRgbHex(hexString: any, duration: any, callback: any): void;

  /**
  * Changes a color zone range to the given HSBK value
  * @param {Number} startIndex start zone index from 0 - 255
  * @param {Number} endIndex start zone index from 0 - 255
  * @param {Number} hue color hue from 0 - 360 (in °)
  * @param {Number} saturation color saturation from 0 - 100 (in %)
  * @param {Number} brightness color brightness from 0 - 100 (in %)
  * @param {Number} [kelvin=3500] color kelvin between 2500 and 9000
  * @param {Number} [duration] transition time in milliseconds
  * @param {Boolean} [apply=true] apply changes immediately or leave pending for next apply
  * @param {Function} [callback] called when light did receive message
  */
  colorZones(startIndex: any, endIndex: any, hue: any, saturation: any, brightness: any, kelvin: any, duration: any, apply: any, callback: any): void;

  /**
  * Requests ambient light value of the light
  * @param {Function} callback a function to accept the data
  */
  getAmbientLight(callback: any): any;

  /**
  * Requests the current color zone state of the light
  * @param {Number} startIndex start color zone index
  * @param {Number} [endIndex] end color zone index
  * @param {Function} callback a function to accept the data
  */
  getColorZones(startIndex: any, endIndex: any, callback: any): any;

  /**
  * Requests infos from the microcontroller unit of the light
  * @param {Function} callback a function to accept the data
  */
  getFirmwareInfo(callback: any): any;

  /**
  * Requests used version from the microcontroller unit of the light
  * @param {Function} callback a function to accept the data
  */
  getFirmwareVersion(callback: any): any;

  /**
  * Requests hardware info from the light
  * @param {Function} callback a function to accept the data with error and
  *                   message as parameters
  */
  getHardwareVersion(callback: any): any;

  /**
  * Requests the label of the light
  * @param {Function} callback a function to accept the data
  * @param {Boolean} [cache=false] return cached result if existent
  * @return {Function} callback(err, label)
  */
  getLabel(callback: any, cache: any): any;

  /**
  * Requests the current maximum setting for the infrared channel
  * @param  {Function} callback a function to accept the data
  */
  getMaxIR(callback: any): any;

  /**
  * Requests the power level of the light
  * @param {Function} callback a function to accept the data
  */
  getPower(callback: any): any;

  /**
  * Requests the current state of the light
  * @param {Function} callback a function to accept the data
  */
  getState(callback: any): any;

  /**
  * Requests wifi infos from for the light
  * @param {Function} callback a function to accept the data
  */
  getWifiInfo(callback: any): any;


  /**
  * Requests used version from the wifi controller unit of the light (wifi firmware version)
  * @param {Function} callback a function to accept the data
  */
  getWifiVersion(callback: any): any;

  /**
  * Sets the Maximum Infrared brightness
  * @param {Number} brightness infrared brightness from 0 - 100 (in %)
  * @param {Function} [callback] called when light did receive message
  */
  maxIR(brightness: any, callback: any): void;

  /**
  * Turns the light off
  * @example light('192.168.2.130').off()
  * @param {Number} [duration] transition time in milliseconds
  * @param {Function} [callback] called when light did receive message
  */
  off(duration: any, callback: any): void;

  /**
  * Turns the light on
  * @example light('192.168.2.130').on()
  * @param {Number} [duration] transition time in milliseconds
  * @param {Function} [callback] called when light did receive message
  */
  on(duration: any, callback: any): void;

  /**
  * Sets the label of light
  * @example light.setLabel('Kitchen')
  * @param {String} label new label to be set, maximum 32 bytes
  * @param {Function} [callback] called when light did receive message
  */
  setLabel(label: any, callback: any): void;
}

export const constants: {
  ACK_REQUIRED_BIT: number;
  ADDRESSABLE_BIT: number;
  APPLICATION_REQUEST_VALUES: {
    APPLY: number;
    APPLY_ONLY: number;
    NO_APPLY: number;
  };
  COLOR_NAME_HS_VALUES: {
    blue: {
      hue: number;
      saturation: number;
    };
    cyan: {
      hue: number;
      saturation: number;
    };
    green: {
      hue: number;
      saturation: number;
    };
    orange: {
      hue: number;
      saturation: number;
    };
    pink: {
      hue: number;
      saturation: number;
    };
    purple: {
      hue: number;
      saturation: number;
    };
    red: {
      hue: number;
      saturation: number;
    };
    white: {
      hue: number;
      saturation: number;
    };
    yellow: {
      hue: number;
      saturation: number;
    };
  };
  DISCOVERY_INTERVAL: number;
  HSBK_DEFAULT_KELVIN: number;
  HSBK_MAXIMUM_BRIGHTNESS: number;
  HSBK_MAXIMUM_HUE: number;
  HSBK_MAXIMUM_KELVIN: number;
  HSBK_MAXIMUM_SATURATION: number;
  HSBK_MINIMUM_BRIGHTNESS: number;
  HSBK_MINIMUM_HUE: number;
  HSBK_MINIMUM_KELVIN: number;
  HSBK_MINIMUM_SATURATION: number;
  IR_MAXIMUM_BRIGHTNESS: number;
  IR_MINIMUM_BRIGHTNESS: number;
  LIFX_ANY_PORT: number;
  LIFX_DEFAULT_PORT: number;
  LIFX_PRODUCT_IDS: {
    id: number;
    name: string;
  }[];
  LIFX_VENDOR_IDS: {
    id: number;
    name: string;
  }[];
  LIGHT_WAVEFORMS: string[];
  MESSAGE_RATE_LIMIT: number;
  ORIGIN_BITS: number;
  PACKET_HEADER_SEQUENCE_MAX: number;
  PACKET_HEADER_SIZE: number;
  PACKET_TRANSACTION_TYPES: {
    ONE_WAY: number;
    REQUEST_RESPONSE: number;
  };
  PROTOCOL_VERSION_1: number;
  PROTOCOL_VERSION_BITS: number;
  PROTOCOL_VERSION_CURRENT: number;
  RESPONSE_REQUIRED_BIT: number;
  RGB_MAXIMUM_VALUE: number;
  RGB_MINIMUM_VALUE: number;
  TAGGED_BIT: number;
  ZONE_INDEX_MAXIMUM_VALUE: number;
  ZONE_INDEX_MINIMUM_VALUE: number;
};

export namespace packet {
  const typeList: {
    id: number;
    name: string;
  }[];

  /**
  * Creates a new packet by the given type
  * Note: This does not validate the given params
  * @param  {String|Number} type the type of packet to create as number or string
  * @param  {Object} params further settings to pass
  * @param  {String} [source] the source of the packet, length 8
  * @param  {String} [target] the target of the packet, length 12
  * @return {Object} The prepared packet object including header
  */
  function create(type: any, params: any, source: any, target: any): any;

  /**
  * Creates a lifx packet header from a given object
  * @param {Object} obj Object containg header configuration for packet
  * @return {Buffer} packet header buffer
  */
  function headerToBuffer(obj: any): any;

  /**
  * Parses a lifx packet header
  * @param {Buffer} buf Buffer containg lifx packet including header
  * @return {Object} parsed packet header
  */
  function headerToObject(buf: any): any;

  /**
  * Creates a packet from a configuration object
  * @param {Object} obj Object with configuration for packet
  * @return {Buffer|Boolean} the packet or false in case of error
  */
  function toBuffer(obj: any): any;

  /**
  * Parses a lifx packet
  * @param {Buffer} buf Buffer with lifx packet
  * @return {Object} parsed packet
  */
  function toObject(buf: any): any;
}

export namespace utils {
  /**
  * Get's product and vendor details for the given id's
  * hsb integer object
  * @param {Number} vendorId id of the vendor
  * @param {Number} productId id of the product
  * @return {Object|Boolean} product and details vendor details or false if not found
  */
  function getHardwareDetails(vendorId: number, productId: number): Object | boolean;

  /**
  * Return all ip addresses of the machine
  * @return {Array} list containing ip address info
  */
  function getHostIPs(): Array<any>;

  /**
  * Generates a random hex string of the given length
  * @example
  * // returns something like 8AF1
  * utils.getRandomHexString(4)
  * @example
  * // returns something like 0D41C8AF
  * utils.getRandomHexString()
  * @param  {Number} [length=8] string length to generate
  * @return {String}            random hex string
  */
  function getRandomHexString(length?: number): string;

  /**
  * Validates a given ip address is IPv4 format
  * @param  {String} ip IP address to validate
  * @return {Boolean}   is IPv4 format?
  */
  function isIpv4Format(ip: string): boolean;

  function maxNumberInArray(array: Array<number>): Array<number>;
  function minNumberInArray(array: Array<number>): Array<number>;

  /**
  * Reads a little-endian unsigned 64-bit value and returns it as buffer
  * This function exists for easy replacing if a native method will be provided
  * by node.js and does not make sense like is
  * @param  {Buffer} buffer buffer to read from
  * @param  {Number} offset offset to begin reading from
  * @return {Buffer}        resulting 64-bit buffer
  */
  function readUInt64LE(buffer: Buffer, offset: number): Buffer;

  /**
  * Converts an RGB Hex string to an object with decimal representations
  * @example rgbHexStringToObject('#FF00FF')
  * @param {String} rgbHexString hex value to parse, with leading #
  * @return {Object}             object with decimal values for r, g, b
  */
  function rgbHexStringToObject(rgbHexString: string): Object;

  /**
  * Converts an object with r,g,b integer values to an
  * hsb integer object
  * @param {Object} rgbObj object with r,g,b keys and values
  * @return {Object} hsbObj object with h,s,b keys and converted values
  */
  function rgbToHsb(rgbObj: Object): Object;

  /**
  * Writes a 64-bit value provided as buffer and returns the result
  * This function exists for easy replacing if a native method will be provided
  * by node.js and does not make sense like is
  * @param  {Buffer} buffer buffer to write from
  * @param  {Number} offset offset to begin reading from
  * @param  {Buffer} input  the buffer to write
  * @return {Buffer}        resulting 64-bit buffer
  */
  function writeUInt64LE(buffer: Buffer, offset: number, input: Buffer): Buffer;
}

export namespace validate {
  function callback(callback: any, context: any): void;
  function colorHsb(hue: any, saturation: any, brightness: any, context: any): void;
  function colorRgb(red: any, green: any, blue: any, context: any): void;
  function irBrightness(brightness: any, context: any): void;
  function optionalCallback(callback: any, context: any): void;
  function optionalDuration(duration: any, context: any): void;
  function zoneIndex(index: any, context: any): void;
}
