import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../../../../app/constants/index.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../../app/lib/context-helper.js'

describe('context-helper', () => {
  test('isVisitDateAfterGoLive throws error when no visit date provided', () => {
    expect(() => { isVisitDateAfterPIHuntAndDairyGoLive(undefined) }).toThrow('dateOfVisit must be parsable as a date, value provided: undefined')
  })
  test('isVisitDateAfterGoLive throws error when visit date provided is not parsable as a date', () => {
    expect(() => { isVisitDateAfterPIHuntAndDairyGoLive('abc123') }).toThrow('dateOfVisit must be parsable as a date, value provided: abc123')
  })
  test('isVisitDateAfterGoLive returns true when visit date is same', () => {
    const dayOfGoLive = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE.toISOString()
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayOfGoLive)).toBe(true)
  })
  test('isVisitDateAfterGoLive returns false when visit date pre go live', () => {
    const dayBeforeGoLive = new Date(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE)
    dayBeforeGoLive.setDate(dayBeforeGoLive.getDate() - 1)
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayBeforeGoLive.toISOString())).toBe(false)
  })
  test('isVisitDateAfterGoLive returns true when visit date post go live', () => {
    const dayBeforeGoLive = new Date(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE)
    dayBeforeGoLive.setDate(dayBeforeGoLive.getDate() + 1)
    expect(isVisitDateAfterPIHuntAndDairyGoLive(dayBeforeGoLive.toISOString())).toBe(true)
  })
})
