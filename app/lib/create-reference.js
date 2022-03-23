const { v4: uuid } = require('uuid')

module.exports = () => {
  const id = uuid().split('-').shift().toLocaleUpperCase('en-GB').match(/.{1,4}/g).join("-")
  const reference = `VV${new Date().getFullYear().toString().slice(-2)}-${id}`

  return reference
}