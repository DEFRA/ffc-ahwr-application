jest.mock('../../app/config', () => ({
  ...jest.requireActual('../../app/config')
}))
import { config } from '../../app/config'

const setOptionalPIHuntEnabled = (optionalPIHuntEnabled) => {
  config.optionalPIHunt.enabled = optionalPIHuntEnabled
}

module.exports = {
  setOptionalPIHuntEnabled
}
