const crypto = require('crypto')
/**
the logic for the agreement number
The agreement number is a 14 digit alpha numeric number Eg IAHW-9154-8827
first 4 digits IAHW is the short form of improve animal health and welfare
followed by a hyphen
the next 4 digits random numbers
followed by a hyphen
next 4 digits random numbers
*/
const generateRandomBytes = (length) => crypto.randomBytes(length)
const convertToUint32Array = (buffer) => new Uint32Array(buffer.buffer)

const setValueInRange = (value, min, max) => Math.floor(value / 0xFFFFFFFF * (max - min + 1) + min).toString()

const fourDigitRandomNumberGenerator = () => {
  const randomBytes = generateRandomBytes(4)
  const randomUint32Array = convertToUint32Array(randomBytes)
  return setValueInRange(randomUint32Array[0], 1000, 9999).toString()
}

module.exports = (firstText = 'IAHW', operationFunction = fourDigitRandomNumberGenerator) => {
  const firstRandomNumber = operationFunction()
  const secondRandomNumber = operationFunction()

  return [firstText, firstRandomNumber, secondRandomNumber].join('-')
}
