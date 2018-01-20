module.exports = [ // export default
  /**
  The parse function of each characteristic takes a Buffer
  and returns a JSON-friendly object (Object, String, even just Buffer, etc.)
  */

  /*
  // Characteristics of the "TemplateCopy" (0xTMPL) service
  {
    uuid: 0xTODO,
    name: 'TODOname',
    type: 'TODOtype',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=TODOtype.xml
      // > TODOabstract
      return todoParse(data)
    },
  },
  */

  // Characteristics of the "Device Information" (0x180A) service
  {
    uuid: 0x2A29,
    name: 'Manufacturer Name String',
    type: 'org.bluetooth.characteristic.manufacturer_name_string',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.manufacturer_name_string.xml
      // > The value of this characteristic is a UTF-8 string representing the name of the manufacturer of the device.
      return data.toString('utf8')
    },
  },
  {
    uuid: 0x2A24,
    name: 'Model Number String',
    type: 'org.bluetooth.characteristic.model_number_string',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.model_number_string.xml
      // > The value of this characteristic is a UTF-8 string representing the model number assigned by the device vendor.
      return data.toString('utf8')
    },
  },
  {
    uuid: 0x2A25,
    name: 'Serial Number String',
    type: 'org.bluetooth.characteristic.serial_number_string',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.serial_number_string.xml
      // > The value of this characteristic is a variable-length UTF-8 string representing the serial number for a particular instance of the device.
      return data.toString('utf8')
    },
  },
  {
    uuid: 0x2A27,
    name: 'Hardware Revision String',
    type: 'org.bluetooth.characteristic.hardware_revision_string',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.hardware_revision_string.xml
      // > The value of this characteristic is a UTF-8 string representing the hardware revision for the hardware within the device.
      return data.toString('utf8')
    },
  },
  {
    uuid: 0x2A26,
    name: 'Firmware Revision String',
    type: 'org.bluetooth.characteristic.firmware_revision_string',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.firmware_revision_string.xml
      // > The value of this characteristic is a UTF-8 string representing the firmware revision for the firmware within the device.
      return data.toString('utf8')
    },
  },
  {
    uuid: 0x2A28,
    name: 'Software Revision String',
    type: 'org.bluetooth.characteristic.software_revision_string',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.software_revision_string.xml
      // > The value of this characteristic is a UTF-8 string representing the software revision for the software within the device.
      return data.toString('utf8')
    },
  },
  {
    uuid: 0x2A23,
    name: 'System ID',
    type: 'org.bluetooth.characteristic.system_id',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.system_id.xml
      // > a 64-bit structure which consists of a 40-bit manufacturer-defined identifier concatenated with a 24 bit unique Organizationally Unique Identifier (OUI)
      // in the documentation, OUI = Company Identifier
      const manufacturer = data.readUIntBE(0, 5) // read the first 5 bytes => 40 bits
      const oui = data.readUIntBE(5, 3) // read the next 3 bytes => 24 bits
      // TODO: if the manufacturer has a 0xFFFE suffix, strip it and return a different structure
      return {manufacturer, oui}
    },
  },

  // Characteristics of the "Battery Service" (0x180F) service
  {
    uuid: 0x2A19,
    name: 'Battery Level',
    type: 'org.bluetooth.characteristic.battery_level',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.battery_level.xml
      // > The current charge level of a battery. 100% represents fully charged while 0% represents fully discharged.
      // > Minimum Value: 0, Maximum Value: 100 (101 - 255 are "Reserved")
      // > Unit: org.bluetooth.unit.percentage
      return data.readUInt8(0)
    },
  },

  // Characteristics of the "Heart Rate" (0x180D) service
  {
    uuid: 0x2A37,
    name: 'Heart Rate Measurement',
    type: 'org.bluetooth.characteristic.heart_rate_measurement',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.heart_rate_measurement.xml
      // data is a multi-byte Buffer emitted by the characteristic's 'data' event
      let cursor = 0
      function readNext(byteLength) {
        const value = (byteLength > 0) ? data.readUIntLE(cursor, byteLength) : undefined
        cursor += byteLength
        return value
      }
      // the first byte of data is the mandatory "Flags" value,
      // which indicates how to read the rest of the data buffer.
      const flags = readNext(1)
      // 0b00010110
      //          ^ 0 => Heart Rate Value Format is set to UINT8. Units: beats per minute (bpm)
      //            1 => Heart Rate Value Format is set to UINT16. Units: beats per minute (bpm)
      //        ^^ 00 or 01 => Sensor Contact feature is not supported in the current connection
      //           10       => Sensor Contact feature is supported, but contact is not detected
      //           11       => Sensor Contact feature is supported and contact is detected
      //       ^ 0 => Energy Expended field is not present
      //         1 => Energy Expended field is present (units are kilo Joules)
      //      ^ 0 => RR-Interval values are not present
      //        1 => One or more RR-Interval values are present
      //   ^^^ Reserved for future use
      const valueFormat =          (flags >> 0) & 0b01
      const sensorContactStatus =  (flags >> 1) & 0b11
      const energyExpendedStatus = (flags >> 3) & 0b01
      const rrIntervalStatus =     (flags >> 4) & 0b01

      const bpm = readNext(valueFormat === 0 ? 1 : 2)
      const sensor = (sensorContactStatus === 2) ? 'no contact' : ((sensorContactStatus === 3) ? 'contact' : 'N/A')
      const energyExpended = readNext(energyExpendedStatus === 1 ? 2 : 0)
      // RR-Interval is provided with "Resolution of 1/1024 second"
      const rrInterval = readNext(rrIntervalStatus === 1 ? 2 : 0)
      return {bpm, sensor, energyExpended, rrInterval}
    },
  },
  {
    uuid: 0x2A38,
    name: 'Body Sensor Location',
    type: 'org.bluetooth.characteristic.body_sensor_location',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.body_sensor_location.xml
      // Enumerations:
      // > Key Value
      // > 0 Other
      // > 1 Chest
      // > 2 Wrist
      // > 3 Finger
      // > 4 Hand
      // > 5 Ear Lobe
      // > 6 Foot
      // > 7 - 255 Reserved for future use
      const key = data.readUInt8(0)
      switch (key) {
        case 0: return 'Other'
        case 1: return 'Chest'
        case 2: return 'Wrist'
        case 3: return 'Finger'
        case 4: return 'Hand'
        case 5: return 'Ear Lobe'
        case 6: return 'Foot'
      }
      return {error: `Invalid/unrecognized 'Body Sensor Location' value: ${key}`}
    },
  },
  {
    uuid: 0x2A39,
    name: 'Heart Rate Control Point',
    type: 'org.bluetooth.characteristic.heart_rate_control_point',
    parse(data) {
      // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.heart_rate_control_point.xml
      // > Enumerations:
      // > Key Value
      // > 1 Reset Energy Expended: resets the value of the Energy Expended field in the Heart Rate Measurement characteristic to 0
      // > 2 - 255 Reserved for future use
      // > 0 - 0
      // This is a write-only characteristic, but this is sort of how it'd work:
      const key = data.readUInt8(0)
      switch (key) {
        case 0: return 'Reset Energy Expended'
      }
      return {error: `Invalid/unrecognized 'Heart Rate Control Point' value: ${key}`}
    },
  },
]
