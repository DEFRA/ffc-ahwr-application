import { minusHours, startandEndDate, isAtLeastMonthsOld } from '../../../../app/lib/date-utils.js'

describe('date utils', () => {
  describe('startandEndDate', () => {
    it('should return an object with start and end date', () => {
      const date = '01/01/2022'
      const result = startandEndDate(date)
      const expectedStartDate = new Date(2022, 0, 1)
      const expectedEndDate = new Date(2022, 0, 2)

      expect(result.startDate).toEqual(expectedStartDate)
      expect(result.endDate).toEqual(expectedEndDate)
    })
  })

  describe('minusHours', () => {
    it('should subtract the given number of hours from the date string', () => {
      const input = '2025-09-08T12:00:00.000Z'

      const result = minusHours(input, 5)

      expect(result).toBe('2025-09-08T07:00:00.000Z')
    })

    it('should handle subtracting 0 hours correctly', () => {
      const input = '2025-09-08T12:00:00.000Z'

      const result = minusHours(input, 0)

      expect(result).toBe(input)
    })

    it('should correctly handle day change when subtracting enough hours', () => {
      const input = '2025-09-08T02:00:00.000Z'

      const result = minusHours(input, 3)

      expect(result).toBe('2025-09-07T23:00:00.000Z')
    })

    it('should throw an invalid eate error if dateStr is invalid', () => {
      expect(() => minusHours('invalid-date', 5)).toThrow()
    })
  })

  describe('isAtLeastMonthsOld', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-11-07T00:00:00Z'))
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    test('returns true when date is older than specified months', () => {
      const oldDate = new Date('2025-02-01')
      expect(isAtLeastMonthsOld(oldDate, 6)).toBe(true)
    })

    test('returns false when date is newer than specified months', () => {
      const recentDate = new Date('2025-09-01')
      expect(isAtLeastMonthsOld(recentDate, 3)).toBe(false)
    })

    test('returns true when date is exactly N months old', () => {
      const exactDate = new Date('2025-05-07')
      expect(isAtLeastMonthsOld(exactDate, 6)).toBe(true)
    })

    test('returns false when date is in the future', () => {
      const futureDate = new Date('2026-01-01')
      expect(isAtLeastMonthsOld(futureDate, 1)).toBe(false)
    })
  })
})
