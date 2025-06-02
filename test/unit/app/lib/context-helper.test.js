import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../../../../app/constants/index.js'
import { config } from '../../../../app/config/index.js'
import { isVisitDateAfterPIHuntAndDairyGoLive, isMultipleHerdsUserJourney } from '../../../../app/lib/context-helper.js'

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

  test('isMultipleHerdsUserJourney, returns false when feature disabled', () => {
    config.multiHerds.enabled = false

    expect(isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [])).toBe(false)
  })
  test('isMultipleHerdsUserJourney, returns false when visit date before golive', () => {
    config.multiHerds.enabled = true

    expect(isMultipleHerdsUserJourney('2025-04-30T00:00:00.000Z', [])).toBe(false)
  })
  test('isMultipleHerdsUserJourney, returns false when reject T&Cs flag', () => {
    config.multiHerds.enabled = true

    expect(isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [{ appliesToMh: false }, { appliesToMh: true }])).toBe(false)
  })
  test('isMultipleHerdsUserJourney, returns true when feature enabled, visit date on/after golive and no flags', () => {
    config.multiHerds.enabled = true

    expect(isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [])).toBe(true)
  })
  test('isMultipleHerdsUserJourney, returns true when feature enabled, visit date on/after golive and no reject T&Cs flag', () => {
    config.multiHerds.enabled = true

    expect(isMultipleHerdsUserJourney('2025-05-01T00:00:00.000Z', [{ appliesToMh: false }])).toBe(true)
  })
})
