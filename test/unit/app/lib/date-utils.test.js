import { startandEndDate } from '../../../../app/lib/date-utils.js'

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
})
