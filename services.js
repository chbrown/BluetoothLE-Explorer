module.exports = [ // export default
  { // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.device_information.xml
    uuid: 0x180A,
    name: 'Device Information',
    type: 'org.bluetooth.service.device_information',
    optionalCharacteristics: [
      0x2A29, // org.bluetooth.characteristic.manufacturer_name_string
      0x2A24, // org.bluetooth.characteristic.model_number_string
      0x2A25, // org.bluetooth.characteristic.serial_number_string
      0x2A27, // org.bluetooth.characteristic.hardware_revision_string
      0x2A26, // org.bluetooth.characteristic.firmware_revision_string
      0x2A28, // org.bluetooth.characteristic.software_revision_string
      // 0x2A2A // org.bluetooth.characteristic.ieee_11073-20601_regulatory_certification_data_list // not implemented
      // 0x2A50 // org.bluetooth.characteristic.pnp_id // not implemented
    ],
  },
  { // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.battery_service.xml
    uuid: 0x180F,
    name: 'Battery Service',
    type: 'org.bluetooth.service.battery_service',
    characteristics: [
      0x2A19, // org.bluetooth.characteristic.battery_level
    ],
  },
  { // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.heart_rate.xml
    uuid: 0x180D,
    name: 'Heart Rate',
    type: 'org.bluetooth.service.heart_rate',
    characteristics: [
      0x2A37, // org.bluetooth.characteristic.heart_rate_measurement
    ],
    optionalCharacteristics: [
      0x2A38, // org.bluetooth.characteristic.body_sensor_location
    ],
    conditionalCharacteristics: [
      // > The Heart Rate Control Point characteristic is used to enable a Client to write control points to a Server to control behavior.
      // > Note: This charateristic is conditional. The charatersitic is Mandatory if the Energy Expended feature is supported, otherwise excluded.
      0x2A39, // org.bluetooth.characteristic.heart_rate_control_point
    ],
  },
]
