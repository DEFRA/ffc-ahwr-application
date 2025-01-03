import { config } from '../../app/config'
jest.mock('../../app/config', () => ({
  ...jest.requireActual('../../app/config')
}))

export const setOptionalPIHuntEnabled = (optionalPIHuntEnabled) => {
  config.optionalPIHunt.enabled = optionalPIHuntEnabled
}
