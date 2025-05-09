import { getAmount } from '../../../../app/lib/getAmount'
import { livestockTypes, claimType, testResults } from '../../../../app/constants'
import { claimPricesConfig as mockClaimPricesConfig } from '../../../data/claim-prices-config'
import { isVisitDateAfterGoLive } from '../../../../app/lib/context-helper.js'

jest.mock('../../../../app/lib/context-helper.js')

jest.mock('../../../../app/storage/getBlob', () => ({
  getBlob: () => mockClaimPricesConfig
}))

const { beef, dairy, pigs, sheep } = livestockTypes
const { review, endemics } = claimType

describe('getAmount', () => {
  beforeEach(async () => {
    isVisitDateAfterGoLive.mockImplementation(() => { return true })
  })
  afterAll(() => {
    jest.resetAllMocks()
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
          reviewTestResults: testResults.positive
        }
      },
      amount: 639
    }
  ])('for type: $payload.type $payload.data.typeOfLivestock $payload.data.testResults $payload.data.piHunt should return $amount', async ({ payload, amount }) => {
    expect(await getAmount(payload)).toBe(amount)
  })
})
