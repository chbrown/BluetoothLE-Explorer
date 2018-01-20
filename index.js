function BufferToJSON() {
  // return {type: 'Buffer', data: [...this]} // the default, effectively
  // return {type: 'Buffer', data: this.toString('hex')}
  return {type: 'Buffer', data: this.toString('hex'), utf8: this.toString('utf8')}
}
Buffer.prototype.toJSON = BufferToJSON

const jsonSpace = 0 // for compact printing
// const jsonSpace = 2 // for pretty printing
function jsonReplacer(key, value) {
  if (key == '_noble') {
    return undefined
  }
  // if (value === 'unknown') {
  //   return undefined
  // }
  // if (value === undefined || (Array.isArray(value) && value.length === 0)) {
  //   return undefined
  // }
  // if (Buffer.isBuffer(value)) { // Buffer#toJSON gets called before jsonReplacer
  //   return {type: 'Buffer', data: value.toString('hex')}
  // }
  return value
}
function logJson(...objects) {
  const parts = objects.map(object => {
    const objectType = typeof object
    if (objectType == 'string') {
      // avoid JSON-wrapping strings
      return object
    }
    return JSON.stringify(object, jsonReplacer, jsonSpace)
  })
  return console.log(parts.join(' '))
}
console.json = logJson
