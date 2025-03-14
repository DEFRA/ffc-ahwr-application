import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../../../../app/constants/index.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../../../app/lib/context-helper.js'
import { setOptionalPIHuntEnabled } from '../../../mocks/config.js'

describe('context-helper', () => {
  beforeEach(() => {
    setOptionalPIHuntEnabled(true)
  })

  test('isPIHuntEnabledAndVisitDateAfterGoLive throws error when no visit date provided', () => {
    expect(() => { isPIHuntEnabledAndVisitDateAfterGoLive(undefined) }).toThrow('dateOfVisitString must be provided')
  })
  test('isPIHuntEnabledAndVisitDateAfterGoLive returns false when feature disabled even when visit date post go live', () => {
    setOptionalPIHuntEnabled(false)
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.toString()
    expect(isPIHuntEnabledAndVisitDateAfterGoLive(dayOfGoLive)).toBe(false)
  })
  test('isPIHuntEnabledAndVisitDateAfterGoLive returns false when feature enabled but visit date pre go live', () => {
    const dayBeforeGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.setDate(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.getDate() - 1).toString()
    expect(isPIHuntEnabledAndVisitDateAfterGoLive(dayBeforeGoLive)).toBe(false)
  })
  test('isPIHuntEnabledAndVisitDateAfterGoLive returns true when feature enabled and visit date post go live', () => {
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.toString()
    expect(isPIHuntEnabledAndVisitDateAfterGoLive(dayOfGoLive)).toBe(true)
  })
})
