/**
 * Generate unique reference number
 * ex. VV22-B471-F25C
 * @returns string
 */
module.exports = (id) => {
  const appRef = id.split('-').shift().toLocaleUpperCase('en-GB').match(/.{1,4}/g).join('-')
  return `VV-${appRef}`
}
