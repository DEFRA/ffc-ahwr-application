const { getAmount } = require('../../../../app/lib/getAmount')
const { livestockTypes: { beef, dairy, pigs, sheep }, claimType: { review, endemics }, testResults, piHuntAllAnimals } = require('../../../../app/constants/claim')
const { getBlob } = require('../../../../app/storage')
const pricesConfig = require('../../../data/claim-prices-config.json')
jest.mock('../../../../app/storage')

describe('getAmount', () => {
  beforeAll(() => {
    getBlob.mockReturnValue(pricesConfig)
  })
  describe('optionalPiHunt flag TRUE', () => {
    beforeAll(() => {
      jest.mock('../../../../app/config', () => ({
        ...jest.requireActual('../../../../app/config'),
        optionalPIHunt: {
          enabled: true
        }
      }))
    })
    test.each([
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: beef
          }
        },
        amount: 522
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: dairy
          }
        },
        amount: 372
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: pigs
          }
        },
        amount: 557
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: sheep
          }
        },
        amount: 436
      },
    ])('for type: $payload.type $payload.data.typeOfLivestock should return $amount', async ({ payload, amount }) => {
      expect(await getAmount(payload)).toBe(amount)
    })

    test.each([
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            testResults: testResults.positive,
            piHunt: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: 837
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            testResults: testResults.negative,
            piHunt: 'yes',
            piHuntRecommended: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: 837
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            testResults: testResults.negative,
            piHunt: 'no',
            piHuntRecommended: 'no',
            piHuntAllAnimals: 'no'
          }
        },
        amount: 215
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            testResults: testResults.positive,
            piHunt: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: 1714
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            testResults: testResults.negative,
            piHunt: 'yes',
            piHuntRecommended: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: 1714
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            testResults: testResults.negative,
            piHunt: 'no',
            piHuntRecommended: 'no',
            piHuntAllAnimals: 'no'
          }
        },
        amount: 215
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: pigs,
            testResults: testResults.negative
          }
        },
        amount: 923
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: pigs,
            testResults: testResults.positive
          }
        },
        amount: 923
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: sheep,
            testResults: testResults.negative
          }
        },
        amount: 639
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: sheep,
            testResults: testResults.positive
          }
        },
        amount: 639
      },
    ])('for type: $payload.type $payload.data.typeOfLivestock $payload.data.testResults $payload.data.piHunt should return $amount', async ({ payload, amount }) => {
      expect(await getAmount(payload)).toBe(amount)
    })
  })

  describe('optionalPiHunt flag false', () => {
    beforeAll(() => {
      jest.mock('../../../../app/config', () => ({
        ...jest.requireActual('../../../../app/config'),
        optionalPIHunt: {
          enabled: false
        }
      }))
    })
    test('returns correct amount for beef for claim type review', async () => {
      expect(await getAmount({
        type: review,
        data: {
          typeOfLivestock: beef,
          testResults: 'positive',
        },
      })).toBe(522)

      expect(await getAmount({
        type: review,
        data: {
          typeOfLivestock: beef,
          testResults: 'negative',
        },
      })).toBe(522)
    })

    test('returns correct amount for beef for claim type follow-up', async () => {
      expect(await getAmount({
        type: endemics,
        data: {
          typeOfLivestock: beef,
          testResults: 'positive',
        },
      })).toBe(837)

      expect(await getAmount({
        type: endemics,
        data: {
          typeOfLivestock: beef,
          testResults: 'negative',
        },
      })).toBe(215)
    })

    test('returns correct amount for dairy for claim type review', async () => {
      expect(await getAmount({
        type: review,
        data: {
          typeOfLivestock: dairy,
          testResults: 'positive',
        },
      })).toBe(372)

      expect(await getAmount({
        type: review,
        data: {
          typeOfLivestock: dairy,
          testResults: 'negative',
        },
      })).toBe(372)
    })

    test('returns correct amount for dairy for claim type follow-up', async () => {
      expect(await getAmount({
        type: endemics,
        data: {
          typeOfLivestock: dairy,
          testResults: 'positive',
        },
      })).toBe(1714)

      expect(await getAmount({
        type: endemics,
        data: {
          typeOfLivestock: dairy,
          testResults: 'negative',
        },
      })).toBe(215)
    })

    test('returns correct amount for pigs for claim type review', async () => {
      expect(await getAmount({
        type: review,
        data: {
          typeOfLivestock: pigs,
          testResults: 'positive',
        },
      })).toBe(557)

      expect(await getAmount({
        type: review,
        data: {
          typeOfLivestock: pigs,
          testResults: 'negative',
        },
      })).toBe(557)
    })

    test('returns correct amount for pigs for claim type follow-up', async () => {
      expect(await getAmount({
        type: endemics,
        data: {
          typeOfLivestock: pigs,
          testResults: 'positive',
        },
      })).toBe(923)

      expect(await getAmount({
        type: endemics,
        data: {
          typeOfLivestock: pigs,
          testResults: 'negative',
        },
      })).toBe(923)
    })

    test('returns correct amount for sheep for claim type review', async () => {
      expect(await getAmount({
        type: review,
        data: {
          typeOfLivestock: sheep,
          testResults: 'positive',
        },
      })).toBe(436)

      expect(await getAmount({
        type: review,
        data: {
          typeOfLivestock: sheep,
          testResults: 'negative',
        },
      })).toBe(436)
    })

    test('returns correct amount for sheep for claim type follow-up', async () => {
      expect(await getAmount({
        type: endemics,
        data: {
          typeOfLivestock: sheep,
          testResults: 'positive',
        },
      })).toBe(639)

      expect(await getAmount({
        type: endemics,
        data: {
          typeOfLivestock: sheep,
          testResults: 'negative',
        },
      })).toBe(639)
    })
    
  })
})
