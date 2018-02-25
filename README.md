# BluetoothLE-Explorer

[![latest version published to npm](https://badge.fury.io/js/bluetoothle-explorer.svg)](https://www.npmjs.com/package/bluetoothle-explorer)

`bluetoothle-explorer` is a Node.js package for logging information about available Bluetooth Low Energy (BLE) devices, and the data they generate, at the command line.

It is a tool for debugging / exploration, building on top of the `noble` library, and not intended for consumption from other applications.


### Instructions

    git clone https://github.com/chbrown/BluetoothLE-Explorer
    cd BluetoothLE-Explorer
    npm install
    node server.js

By default, that will limit discovery to devices advertising recognized service UUIDs (those listed in `services.js`).
To specify a different filter, set the `BLE_SERVICES` environment variable to a `:`-separated list of UUIDs.
E.g., `BLE_SERVICES=180a:1821 node server.js` will only connect to devices that advertise the "[Device Information](https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.device_information.xml)" or "[Indoor Positioning](https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.indoor_positioning.xml)" services.
Use an empty value, e.g., `BLE_SERVICES= node server.js`, to discover _all_ BLE devices.

### Notes on Bluetooth LE / the interface provided by `noble`

* [Noble on GitHub](https://github.com/sandeepmistry/noble)
* [Noble on npm](https://www.npmjs.com/package/noble)

#### Root level `noble` object

    const noble = require('noble')

That's the `noble` controller you start with.

You can't do anything with it until it's "powered on", which happens automatically,
so you have to listen for its `stateChange` event,
check that `noble.state` is `poweredOn`, and then do stuff.

`noble.startScanning(serviceUUIDs, allowDuplicates)` is the main entry point.
* This triggers the `noble` object's `discover` event, once (assuming `allowDuplicates` is set to `false`) for each new device
* When you provide an non-empty list of `serviceUUIDs` (a list of hexadecimal strings),
  it will only trigger discover events for devices ("peripherals") that advertise having that serviceUUID.

#### `peripheral` objects

Peripherals are Bluetooth LE devices acting as servers that your machine, the client, is connecting to.

* A peripheral always has an `id` attribute (duplicated as `uuid`), and sometimes an `address` and `addressType`, as identifying features.
* The `advertisement` is a descriptive object with more information about the peripheral.
  It has some handy attributes, like:
  - `localName`: a high-level name for the device
  - `serviceUuids`: which lists the the service UUIDs it will match
* The `rssi` indicates the strength of signal from the peripheral; it's negative, and maxes out at 0.
  So, the closer to 0 it is, the stronger the signal is.

Besides that chunk of information, you can't do much with the peripheral until you "connect" to it.
Assuming the `connectable` attribute is `true`, and the current `state` is `"disconnected"`,
you "connect" to the peripheral with `peripheral.connect(error => { ... })`.

At this point you can call `peripheral.discoverServices(serviceUUIDs, (error, services) => { ... })`,
which as with the `noble` global's `startScanning` method, can supply an array of `serviceUUIDs` to filter,
or `[]` to discover all services.

These are all returned in a single batch, via the callback's `services` argument.

The `discoverServices` method will likely return many more services than the device directly advertises (though it includes those),
but these are probably metadata, like battery level -- not as integral to the function of the device as what it advertises.

#### `service` objects

A service object represents a service as conceptualized by the Bluetooth LE standard.

These are mostly just data; using them is negotiated via the peripheral,
though the noble package's interface has the relevant methods attached to the service objects.

Calling `service.discoverCharacteristics(characteristicUUIDs, (error, characteristics) => { ... })`
triggers discovery of the peripherals characteristics for that service, filtered by `characteristicUUIDs`,
or returning all characteristics if `characteristicUUIDs` is `[]`.

These are all returned in a single batch, via the callback's `characteristics` argument.

#### `characteristic` objects

Characteristic objects represent various sources of data that the device can produce,
which are specified in the Bluetooth LE standard.

Again, these are mostly data, but the noble interface provides helper methods on the `characteristic` objects.

Most of the information you'll need to parse/interpret characteristics comes from the corresponding Bluetooth LE specification,
but it provides one handy attribute that determines what you can do with it via noble: `properties`, which is an array of strings.

* If `properties` contains the string `"notify"`, you can "subscribe" to the characteristic,
  which will start triggering `data` events on the characteristic object, as sent by the device.
* If `properties` contains the string `"read"`, you can "read" from the characteristic to get the current value.

  You cannot "subscribe" to characteristics with a `"read"` property hoping to get continual updates whenever it changes;
  instead, you'd have to set up an interval of your own and poll the characteristic as often as you suspect it might change.

The data structures returned by `characteristic.read` or emitted as the characteristic's `data` events are `Buffer` instances.
* To parse these, you must consult the Bluetooth LE specification for that characteristic.
* Several parsers for characteristics of interest (to me) are provided in `characteristics.js`;
  when a characteristic defined in that file matches a characteristic received from a device,
  the command line tool will use that definition's `parse(data: Buffer)` function to process the data structure.
  Otherwise, the command line tool will display the raw Buffer.


## License

Copyright 2018 Christopher Brown.
[MIT Licensed](https://chbrown.github.io/licenses/MIT/#2018).
