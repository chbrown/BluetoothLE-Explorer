const noble = require('noble')
const serviceDefinitions = require('./services')
const characteristicDefinitions = require('./characteristics')
require('./index') // for the side-effects, like console.json

/**
A characteristic looks like:

    characteristic = {
      uuid: "<uuid>",
       // properties contains a list of strings indicating the interface/capabilities of the characteristic:
       // 'broadcast', 'read', 'writeWithoutResponse', 'write', 'notify', 'indicate', 'authenticatedSignedWrites', 'extendedProperties'
      properties: [...]
    }
*/
function initializeCharacteristic(peripheral, service, characteristic) {
  const targetId = `peripheral[${peripheral.id}].services[${service.uuid}].characteristic[${characteristic.uuid}]`
  console.json(targetId, 'Initializing characteristic:', characteristic)

  const properties = new Set(characteristic.properties)
  const uuid = parseInt(characteristic.uuid, 16)
  const characteristicDefinition = characteristicDefinitions.find(characteristicDefinition => characteristicDefinition.uuid == uuid)
  const printData = data => {
    if (characteristicDefinition) {
      console.json(targetId, 'Parsed data:', characteristicDefinition.parse(data))
    }
    else {
      console.json(targetId, 'Raw:', data)
    }
  }

  // set up subscription for 'notify' characteristics
  if (properties.has('notify') || properties.has('indicate')) { // not sure if 'indicate' is proper here
    characteristic.on('data', data => {
      printData(data)
    })
    console.json(targetId, 'Subscribing...')
    characteristic.subscribe(error => {
      if (error) {
        return console.json(targetId, 'Failed to subscribe:', error)
      }
      console.json(targetId, 'Subscribed!')
    })
  }

  // read value for 'read' characteristics
  if (properties.has('read')) {
    console.json(targetId, 'Reading...')
    characteristic.read((error, data) => {
      if (error) {
        return console.json(targetId, 'Failed to read value:', error)
      }
      printData(data)
    })
  }
}

/**
A service looks like:

    service = {
      _peripheralId: "ce7acb7b0b48e98129018cf88e9edf88",
      uuid: "180a",
      name: "Device Information",
      type: "org.bluetooth.service.device_information",
      includedServiceUuids: null,
      characteristics: null
    }

*/
function initializeService(peripheral, service) {
  const targetId = `peripheral[${peripheral.id}].services[${service.uuid}]`
  console.json(targetId, 'Initializing service:', service)

  // service.discoverIncludedServices(serviceUUIDs[, callback(error, includedServiceUuids)])
  service.discoverCharacteristics([], (error, characteristics) => {
    if (error) {
      return console.json(targetId, 'Failed to discover characteristics:', error)
    }
    for (let characteristic of characteristics) {
      initializeCharacteristic(peripheral, service, characteristic)
    }
  })
}

/**
A peripheral object looks like:

    peripheral = {
      id: "<id>",
      address: "<BT address">, // Bluetooth Address of device, or 'unknown' if not known
      addressType: "<BT address type>", // Bluetooth Address type (public, random), or 'unknown' if not known
      connectable: <connectable>, // true or false, or undefined if not known
      advertisement: {
        localName: "<name>",
        txPowerLevel: <int>,
        serviceUuids: ["<service UUID>", ...],
        serviceSolicitationUuid: ["<service solicitation UUID>", ...],
        manufacturerData: <Buffer>,
        serviceData: [
            {
                uuid: "<service UUID>"
                data: <Buffer>
            },
            ...
        ]
      },
      rssi: <rssi>
    }

There's also `services` and `state` attributes.
And a reference back to the original `noble` object.
*/
function initializePeripheral(peripheral) {
  const targetId = `peripheral[${peripheral.id}]`
  console.json(targetId, 'Initializing peripheral:', peripheral)

  console.json(targetId, 'Connecting...')
  peripheral.connect(error => {
    if (error) {
      return console.json(targetId, 'Failed to connect', error)
    }
    console.json(targetId, 'Connected!')

    peripheral.discoverServices([], (error, services) => {
      if (error) {
        return console.json(targetId, 'Failed to discoverServices:', error)
      }
      console.json(targetId, 'Discovering services...')
      for (let service of services) {
        initializeService(peripheral, service)
      }
    })
  })
}

/**
The global `noble` object has a state attribute, which has one of these values:

    'unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn'

The default `serviceUUIDs` value of [] will match all devices
*/
function initializeNoble(serviceUUIDs=[]) {
  const targetId = `noble[${serviceUUIDs.join(',')}]`
  console.json(targetId, 'Initializing:', noble)

  if (noble.state != 'poweredOn') {
    console.json(targetId, 'Noble is not currently powered on')
    return noble.once('stateChange', state => {
      console.json(targetId, 'changed state:', state)
      return initializeNoble(serviceUUIDs)
    })
  }

  // 'discover' events are kicked off as the Bluetooth adapter finds new devices
  noble.on('discover', initializePeripheral)

  console.json(targetId, 'Starting scan...')
  // the second argument of noble.startScanning is 'allowDuplicates'
  noble.startScanning(serviceUUIDs, false, error => {
    if (error) {
      return console.json(targetId, 'Failed to start scan:', error)
    }
    console.json(targetId, 'Now scanning!')
  })
}

function main() {
  // limit to devices with known services
  const serviceUUIDs = serviceDefinitions.map(serviceDefinition => serviceDefinition.uuid.toString(16))
  initializeNoble(serviceUUIDs)
}

if (require.main === module) {
  main()
}
