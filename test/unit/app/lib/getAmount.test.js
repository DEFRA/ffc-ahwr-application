const { getAmount } = require('../../../../app/lib/getAmount')
const { livestockTypes } = require('../../../../app/constants/claim')

describe('getAmount', () => {
  const pricesConfig = {
    [livestockTypes.beef]: {
      value: {
        Negative: 100,
        Positive: 300
      },
      code: 200
    },
    [livestockTypes.dairy]: {
      value: {
        Negative: 400,
        Positive: 600
      },
      code: 500
    },
    [livestockTypes.pig]: {
      value: 700,
      code: 800
    }
  }

  test('returns correct amount for beef with test results', () => {
    expect(getAmount(livestockTypes.beef, 'Negative', pricesConfig)).toBe('100')
    expect(getAmount(livestockTypes.beef, 'Positive', pricesConfig)).toBe('300')
  })

  test('returns correct amount for dairy with test results', () => {
    expect(getAmount(livestockTypes.dairy, 'Negative', pricesConfig)).toBe('400')
    expect(getAmount(livestockTypes.dairy, 'Positive', pricesConfig)).toBe('600')
  })

  test('returns correct amount for pig without test results', () => {
    expect(getAmount(livestockTypes.pig, null, pricesConfig)).toBe('700')
  })
})
