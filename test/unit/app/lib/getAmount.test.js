const { optionalPIHunt } = require('../../../../app/config')

if (optionalPIHunt.enabled) {
  const { getAmount } = require('../../../../app/lib/getAmount')
  const { livestockTypes: { beef, dairy, pigs, sheep }, claimType: { review, endemics } } = require('../../../../app/constants/claim')
  const pricesConfig = require('../../../data/claim-prices-config.json')

  describe('getAmount', () => {
    test.each([
      {
        payload: undefined,
        errorLog: 'Missing payload'
      },
      {
        payload: {},
        errorLog: 'Missing payload.type parameter'
      },
      {
        payload: {
          type: endemics
        },
        errorLog: 'Missing typeOfLivestock parameter'
      },
      {
        payload: {
          type: review
        },
        errorLog: 'Missing typeOfLivestock parameter'
      },
      {
        payload: {
          type: endemics,
          data: {}
        },
        errorLog: 'Missing typeOfLivestock parameter'
      },
      {
        payload: {
          data: {
            typeOfLivestock: beef
          }
        },
        errorLog: 'Missing payload.type parameter'
      },
      {
        payload: {
          data: {
            typeOfLivestock: dairy
          }
        },
        errorLog: 'Missing payload.type parameter'
      },
      {
        payload: {
          data: {
            typeOfLivestock: pigs
          }
        },
        errorLog: 'Missing payload.type parameter'
      },
      {
        payload: {
          data: {
            typeOfLivestock: sheep
          }
        },
        errorLog: 'Missing payload.type parameter'
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef
          }
        },
        errorLog: 'Missing piHunt parameter'
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy
          }
        },
        errorLog: 'Missing piHunt parameter'
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            piHunt: 'yes'
          }
        },
        errorLog: 'Missing piHuntAllAnimals parameter'
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            piHunt: 'yes'
          }
        },
        errorLog: 'Missing piHuntAllAnimals parameter'
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            piHunt: 'yes',
            piHuntRecommended: 'yes'
          }
        },
        errorLog: 'Missing piHuntAllAnimals parameter'
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            piHunt: 'yes',
            piHuntRecommended: 'yes'
          }
        },
        errorLog: 'Missing piHuntAllAnimals parameter'
      }
    ])('for payload : $payload should return Error: Unable to calculate amount]', async ({ payload, errorLog }) => {
      const consoleLogSpy = jest.spyOn(console, 'error')
      expect(getAmount(payload, pricesConfig)).toBe('[Error: Unable to calculate amount]')
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(`unable to calculate amount : ${errorLog} - payload : ${JSON.stringify(payload)}`)
      jest.clearAllMocks()
    })

    test.each([
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: beef
          }
        },
        amount: pricesConfig.review[beef].value
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: dairy
          }
        },
        amount: pricesConfig.review[dairy].value
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: pigs
          }
        },
        amount: pricesConfig.review[pigs].value
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: sheep
          }
        },
        amount: pricesConfig.review[sheep].value
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: pigs
          }
        },
        amount: pricesConfig.followUp[pigs].value
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: sheep
          }
        },
        amount: pricesConfig.followUp[sheep].value
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            piHunt: 'no'
          }
        },
        amount: pricesConfig.followUp[beef].value.negative
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            piHunt: 'no'
          }
        },
        amount: pricesConfig.followUp[dairy].value.negative
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            piHunt: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: pricesConfig.followUp[beef].value.positive
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            piHunt: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: pricesConfig.followUp[dairy].value.positive
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            piHunt: 'yes',
            piHuntRecommended: 'no'
          }
        },
        amount: pricesConfig.followUp[beef].value.negative
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            piHunt: 'yes',
            piHuntRecommended: 'no'
          }
        },
        amount: pricesConfig.followUp[dairy].value.negative
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            piHunt: 'yes',
            piHuntRecommended: 'yes',
            piHuntAllAnimals: 'no'
          }
        },
        amount: pricesConfig.followUp[beef].value.negative
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            piHunt: 'yes',
            piHuntRecommended: 'yes',
            piHuntAllAnimals: 'no'
          }
        },
        amount: pricesConfig.followUp[dairy].value.negative
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            piHunt: 'yes',
            piHuntRecommended: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: pricesConfig.followUp[beef].value.positive
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            piHunt: 'yes',
            piHuntRecommended: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: pricesConfig.followUp[dairy].value.positive
      }
    ])('for payload : $payload should return $amount', async ({ payload, amount }) => {
      expect(getAmount(payload, pricesConfig)).toBe(amount)
    })
  })
} else {
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
}
