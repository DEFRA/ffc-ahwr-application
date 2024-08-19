jest.mock('../../app/config', () => ({
  ...jest.requireActual('../../app/config')
}))
const { endemics, optionalPIHunt } = require('../../app/config')

const setEndemicsEnabled = (endemicsEnabled) => {
  endemics.enabled = endemicsEnabled
}
const setOptionalPIHuntEnabled = (optionalPIHuntEnabled) => {
  optionalPIHunt.enabled = optionalPIHuntEnabled
}

module.exports = {
  setEndemicsEnabled,
  setOptionalPIHuntEnabled
}
