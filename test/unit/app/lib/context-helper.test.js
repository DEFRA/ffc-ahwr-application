import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../../../../app/constants/index.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../../../app/lib/context-helper.js'
import { setOptionalPIHuntEnabled } from '../../../mocks/config.js'

describe('context-helper', () => {
  beforeEach(() => {
    setOptionalPIHuntEnabled(true)
  })

  test('isPIHuntEnabledAndVisitDateAfterGoLive throws error when no visit date provided', () => {
    expect(() => { isPIHuntEnabledAndVisitDateAfterGoLive(undefined) }).toThrow('dateOfVisit must be provided')
  })
  test('isPIHuntEnabledAndVisitDateAfterGoLive throws error when visit date provided is not parsable as a date', () => {
    expect(() => { isPIHuntEnabledAndVisitDateAfterGoLive('abc123') }).toThrow('dateOfVisit must be parsable as a date, value provided: abc123')
  })
  test('isPIHuntEnabledAndVisitDateAfterGoLive returns false when feature disabled even when visit date post go live', () => {
    setOptionalPIHuntEnabled(false)
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.toISOString()
    expect(isPIHuntEnabledAndVisitDateAfterGoLive(dayOfGoLive)).toBe(false)
  })
  test('isPIHuntEnabledAndVisitDateAfterGoLive returns false when feature enabled but visit date pre go live', () => {
    const dayBeforeGoLive = new Date(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE)
    dayBeforeGoLive.setDate(dayBeforeGoLive.getDate() - 1)
    expect(isPIHuntEnabledAndVisitDateAfterGoLive(dayBeforeGoLive.toISOString())).toBe(false)
  })
  test('isPIHuntEnabledAndVisitDateAfterGoLive returns true when feature enabled and visit date post go live and value provided is a string', () => {
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.toISOString()
    expect(isPIHuntEnabledAndVisitDateAfterGoLive(dayOfGoLive)).toBe(true)
  })
  test('isPIHuntEnabledAndVisitDateAfterGoLive returns true when feature enabled and visit date post go live and value provided is a date', () => {
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
    expect(isPIHuntEnabledAndVisitDateAfterGoLive(dayOfGoLive)).toBe(true)
  })
})
