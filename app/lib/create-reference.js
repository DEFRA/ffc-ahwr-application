const { v4: uuid } = require('uuid')

/**
 * Generate unique reference number
 * ex. VV22-B471-F25C
 * @returns string
 */
module.exports = () => {
  const id = uuid().split('-').shift().toLocaleUpperCase('en-GB').match(/.{1,4}/g).join('-')
  return `VV${new Date().getFullYear().toString().slice(-2)}-${id}`
}
