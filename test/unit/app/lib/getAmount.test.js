const { getAmount } = require('../../../../app/lib/getAmount')
const { livestockTypes } = require('../../../../app/constants/claim')
const pricesConfig = require('../../../data/claim-prices-config.json')
describe('getAmount', () => {
  test('returns correct amount for beef for claim type review', () => {
    expect(getAmount(livestockTypes.beef, 'negative', pricesConfig, true, false)).toBe(522)
    expect(getAmount(livestockTypes.beef, 'positive', pricesConfig, true, false)).toBe(522)
  })
  test('returns correct amount for beef for claim type endemics follow up', () => {
    expect(getAmount(livestockTypes.beef, 'negative', pricesConfig, false, true)).toBe(215)
    expect(getAmount(livestockTypes.beef, 'positive', pricesConfig, false, true)).toBe(837)
  })
  test('returns correct amount for dairy for claim type review', () => {
    expect(getAmount(livestockTypes.dairy, 'negative', pricesConfig, true, false)).toBe(372)
    expect(getAmount(livestockTypes.dairy, 'positive', pricesConfig, true, false)).toBe(372)
  })

  test('returns correct amount for dairy for claim type follow up', () => {
    expect(getAmount(livestockTypes.dairy, 'negative', pricesConfig, false, true)).toBe(215)
    expect(getAmount(livestockTypes.dairy, 'positive', pricesConfig, false, true)).toBe(1714)
  })

  test('returns correct amount for pig for claim type review', () => {
    expect(getAmount(livestockTypes.pigs, 'negative', pricesConfig, true, false)).toBe(557)
    expect(getAmount(livestockTypes.pigs, 'positive', pricesConfig, true, false)).toBe(557)
  })

  test('returns correct amount for pig for claim type follow up', () => {
    expect(getAmount(livestockTypes.pigs, 'negative', pricesConfig, false, true)).toBe(923)
    expect(getAmount(livestockTypes.pigs, 'positive', pricesConfig, false, true)).toBe(923)
  })
})
