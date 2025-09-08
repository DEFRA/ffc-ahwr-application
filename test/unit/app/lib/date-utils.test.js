import { minusHours, startandEndDate } from '../../../../app/lib/date-utils.js'

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
})
