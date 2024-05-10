/**
the logic for the agreement number
The agreement number is a 14 digit alpha numeric number Eg IAHW-9154-8827
first 4 digits IAHW is the short form of improve animal health and welfare
followed by a hyphen
the next 4 digits random numbers
followed by a hyphen
next 4 digits random numbers
*/
const fourDigitRandomNumberGenerator = () => parseInt(Math.floor(1000 + Math.random() * 9000))

module.exports = (operationFunction = fourDigitRandomNumberGenerator) => {
  const firstRandomNumber = operationFunction()
  const secondRandomNumber = operationFunction()
  return ['IAHW', firstRandomNumber, secondRandomNumber].join('-')
}
