import { getAmount } from '../../../../app/lib/getAmount'
import { setOptionalPIHuntEnabled } from '../../../mocks/config'
import { livestockTypes, claimType, testResults } from '../../../../app/constants'
import { claimPricesConfig as mockClaimPricesConfig } from '../../../data/claim-prices-config'

jest.mock('../../../../app/storage/getBlob', () => ({
  getBlob: () => mockClaimPricesConfig
}))

const { beef, dairy, pigs, sheep } = livestockTypes
const { review, endemics } = claimType

describe('getAmount when optionalPiHunt flag TRUE', () => {
  beforeEach(async () => {
    setOptionalPIHuntEnabled(true)
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

describe('getAmount when optionalPiHunt flag false', () => {
  beforeEach(async () => {
    setOptionalPIHuntEnabled(false)
  })
  afterAll(() => {
    jest.resetAllMocks()
  })

  test('returns correct amount for beef for claim type review', async () => {
    expect(await getAmount({
      type: review,
      data: {
        typeOfLivestock: beef,
        testResults: 'positive'
      }
    })).toBe(522)

    expect(await getAmount({
      type: review,
      data: {
        typeOfLivestock: beef,
        testResults: 'negative'
      }
    })).toBe(522)
  })

  test('returns correct amount for beef for claim type follow-up', async () => {
    expect(await getAmount({
      type: endemics,
      data: {
        typeOfLivestock: beef,
        reviewTestResults: 'positive'
      }
    })).toBe(837)

    expect(await getAmount({
      type: endemics,
      data: {
        typeOfLivestock: beef,
        reviewTestResults: 'negative'
      }
    })).toBe(215)
  })

  test('returns correct amount for dairy for claim type review', async () => {
    expect(await getAmount({
      type: review,
      data: {
        typeOfLivestock: dairy,
        testResults: 'positive'
      }
    })).toBe(372)

    expect(await getAmount({
      type: review,
      data: {
        typeOfLivestock: dairy,
        testResults: 'negative'
      }
    })).toBe(372)
  })

  test('returns correct amount for dairy for claim type follow-up', async () => {
    expect(await getAmount({
      type: endemics,
      data: {
        typeOfLivestock: dairy,
        reviewTestResults: 'positive'
      }
    })).toBe(1714)

    expect(await getAmount({
      type: endemics,
      data: {
        typeOfLivestock: dairy,
        reviewTestResults: 'negative'
      }
    })).toBe(215)
  })

  test('returns correct amount for pigs for claim type review', async () => {
    expect(await getAmount({
      type: review,
      data: {
        typeOfLivestock: pigs,
        testResults: 'positive'
      }
    })).toBe(557)

    expect(await getAmount({
      type: review,
      data: {
        typeOfLivestock: pigs,
        testResults: 'negative'
      }
    })).toBe(557)
  })

  test('returns correct amount for pigs for claim type follow-up', async () => {
    expect(await getAmount({
      type: endemics,
      data: {
        typeOfLivestock: pigs,
        testResults: 'positive'
      }
    })).toBe(923)

    expect(await getAmount({
      type: endemics,
      data: {
        typeOfLivestock: pigs,
        testResults: 'negative'
      }
    })).toBe(923)
  })

  test('returns correct amount for sheep for claim type review', async () => {
    expect(await getAmount({
      type: review,
      data: {
        typeOfLivestock: sheep,
        testResults: 'positive'
      }
    })).toBe(436)

    expect(await getAmount({
      type: review,
      data: {
        typeOfLivestock: sheep,
        testResults: 'negative'
      }
    })).toBe(436)
  })

  test('returns correct amount for sheep for claim type follow-up', async () => {
    expect(await getAmount({
      type: endemics,
      data: {
        typeOfLivestock: sheep,
        testResults: 'positive'
      }
    })).toBe(639)

    expect(await getAmount({
      type: endemics,
      data: {
        typeOfLivestock: sheep,
        testResults: 'negative'
      }
    })).toBe(639)
  })
})
