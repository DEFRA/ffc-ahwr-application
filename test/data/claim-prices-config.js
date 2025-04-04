export const claimPricesConfig = {
  review: {
    beef: {
      value: 522,
      code: 'AHWR-Beef'
    },
    dairy: {
      value: 372,
      code: 'AHWR-Dairy'
    },
    pigs: {
      value: 557,
      code: 'AHWR-Pigs'
    },
    sheep: {
      value: 436,
      code: 'AHWR-Sheep'
    }
  },
  followUp: {
    beef: {
      value: {
        positive: 837,
        negative: {
          noPiHunt: 215,
          yesPiHunt: 837
        }
      },
      code: 'AHWR-Beef'
    },
    dairy: {
      value: {
        positive: 1714,
        negative: {
          noPiHunt: 215,
          yesPiHunt: 1714
        }
      },
      code: 'AHWR-Dairy'
    },
    pigs: {
      value: 923,
      code: 'AHWR-Pigs'
    },
    sheep: {
      value: 639,
      code: 'AHWR-Sheep'
    }
  }
}
