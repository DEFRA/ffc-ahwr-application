import { getAmount } from '../../../../app/lib/getAmount'
import { livestockTypes, claimType, testResults } from '../../../../app/constants'
import { claimPricesConfig as mockClaimPricesConfig, claimPricesConfig20260122 as mockClaimPricesConfig20260122 } from '../../../data/claim-prices-config'
import { isVisitDateAfterPIHuntAndDairyGoLive, isPigsAndPaymentsUserJourney } from '../../../../app/lib/context-helper.js'

jest.mock('../../../../app/lib/context-helper.js')

jest.mock('../../../../app/storage/getBlob', () => ({
  getBlob: (filename) => {
    return (filename === 'claim-prices-config-20260122.json') ? mockClaimPricesConfig20260122 : mockClaimPricesConfig
  }
}))

const { beef, dairy, pigs, sheep } = livestockTypes
const { review, endemics } = claimType

describe('getAmount', () => {
  beforeEach(async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
  })
  afterAll(() => {
    jest.resetAllMocks()
  })

  describe('pre payment rate increase', () => {
    beforeEach(async () => {
      isPigsAndPaymentsUserJourney.mockImplementation(() => { return false })
    })

    test.each([
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: beef,
            dateOfVisit: '2026-01-21'
          }
        },
        amount: 522
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: dairy,
            dateOfVisit: '2026-01-21'
          }
        },
        amount: 372
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: pigs,
            dateOfVisit: '2026-01-21'
          }
        },
        amount: 557
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: sheep,
            dateOfVisit: '2026-01-21'
          }
        },
        amount: 436
      }
    ])('for type: $payload.type $payload.data.typeOfLivestock should return $amount', async ({ payload, amount }) => {
      expect(await getAmount(payload)).toBe(amount)
    })

    test.each([
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.positive,
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
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.negative,
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
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.negative,
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
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.positive,
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
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.negative,
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
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.negative,
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
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.negative
          }
        },
        amount: 923
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: pigs,
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.positive
          }
        },
        amount: 923
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: sheep,
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.negative
          }
        },
        amount: 639
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: sheep,
            dateOfVisit: '2026-01-21',
            reviewTestResults: testResults.positive
          }
        },
        amount: 639
      }
    ])('for type: $payload.type $payload.data.typeOfLivestock $payload.data.testResults $payload.data.piHunt should return $amount', async ({ payload, amount }) => {
      expect(await getAmount(payload)).toBe(amount)
    })
  })

  describe('post payment rate increase', () => {
    beforeEach(async () => {
      isPigsAndPaymentsUserJourney.mockImplementation(() => { return true })
    })

    test.each([
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: beef,
            dateOfVisit: '2026-01-22'
          }
        },
        amount: 647
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: dairy,
            dateOfVisit: '2026-01-22'
          }
        },
        amount: 447
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: pigs,
            dateOfVisit: '2026-01-22'
          }
        },
        amount: 648
      },
      {
        payload: {
          type: review,
          data: {
            typeOfLivestock: sheep,
            dateOfVisit: '2026-01-22'
          }
        },
        amount: 574
      }
    ])('for type: $payload.type $payload.data.typeOfLivestock should return $amount', async ({ payload, amount }) => {
      expect(await getAmount(payload)).toBe(amount)
    })

    test.each([
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.positive,
            piHunt: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: 954
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.negative,
            piHunt: 'yes',
            piHuntRecommended: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: 954
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: beef,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.negative,
            piHunt: 'no',
            piHuntRecommended: 'no',
            piHuntAllAnimals: 'no'
          }
        },
        amount: 258
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.positive,
            piHunt: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: 1844
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.negative,
            piHunt: 'yes',
            piHuntRecommended: 'yes',
            piHuntAllAnimals: 'yes'
          }
        },
        amount: 1844
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: dairy,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.negative,
            piHunt: 'no',
            piHuntRecommended: 'no',
            piHuntAllAnimals: 'no'
          }
        },
        amount: 258
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: pigs,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.negative
          }
        },
        amount: 1087
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: pigs,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.positive
          }
        },
        amount: 1087
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: sheep,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.negative
          }
        },
        amount: 658
      },
      {
        payload: {
          type: endemics,
          data: {
            typeOfLivestock: sheep,
            dateOfVisit: '2026-01-22',
            reviewTestResults: testResults.positive
          }
        },
        amount: 658
      }
    ])('for type: $payload.type $payload.data.typeOfLivestock $payload.data.testResults $payload.data.piHunt should return $amount', async ({ payload, amount }) => {
      expect(await getAmount(payload)).toBe(amount)
    })
  })
})
