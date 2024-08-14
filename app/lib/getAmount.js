const { claimType: { endemics, review } } = require('../../app/constants/claim')

// decisionMatrix.claimType.livestockType.piHunt.piHuntRecommended.piHuntAllAnimals
const getDecisionMatrix = (pricesConfig) => {
  const decisionMatrix = {}
  decisionMatrix['empty.empty.empty.empty.empty'] = 'Missing payload.type parameter'
  decisionMatrix['review.empty.empty.empty.empty'] = 'Missing typeOfLivestock parameter'
  decisionMatrix['followUp.empty.empty.empty.empty'] = 'Missing typeOfLivestock parameter'
  decisionMatrix['empty.beef.empty.empty.empty'] = 'Missing payload.type parameter'
  decisionMatrix['empty.dairy.empty.empty.empty'] = 'Missing payload.type parameter'
  decisionMatrix['empty.pigs.empty.empty.empty'] = 'Missing payload.type parameter'
  decisionMatrix['empty.sheep.empty.empty.empty'] = 'Missing payload.type parameter'
  decisionMatrix['review.beef.empty.empty.empty'] = pricesConfig.review.beef.value
  decisionMatrix['review.dairy.empty.empty.empty'] = pricesConfig.review.dairy.value
  decisionMatrix['review.pigs.empty.empty.empty'] = pricesConfig.review.pigs.value
  decisionMatrix['review.sheep.empty.empty.empty'] = pricesConfig.review.sheep.value
  decisionMatrix['followUp.beef.empty.empty.empty'] = 'Missing piHunt parameter'
  decisionMatrix['followUp.dairy.empty.empty.empty'] = 'Missing piHunt parameter'
  decisionMatrix['followUp.pigs.empty.empty.empty'] = pricesConfig.followUp.pigs.value
  decisionMatrix['followUp.sheep.empty.empty.empty'] = pricesConfig.followUp.sheep.value
  decisionMatrix['followUp.beef.no.empty.empty'] = pricesConfig.followUp.beef.value.negative
  decisionMatrix['followUp.dairy.no.empty.empty'] = pricesConfig.followUp.dairy.value.negative
  decisionMatrix['followUp.beef.yes.empty.empty'] = 'Missing piHuntAllAnimals parameter'
  decisionMatrix['followUp.dairy.yes.empty.empty'] = 'Missing piHuntAllAnimals parameter'
  decisionMatrix['followUp.beef.yes.empty.yes'] = pricesConfig.followUp.beef.value.positive
  decisionMatrix['followUp.dairy.yes.empty.yes'] = pricesConfig.followUp.dairy.value.positive
  decisionMatrix['followUp.beef.yes.yes.empty'] = 'Missing piHuntAllAnimals parameter'
  decisionMatrix['followUp.dairy.yes.yes.empty'] = 'Missing piHuntAllAnimals parameter'
  decisionMatrix['followUp.beef.yes.no.empty'] = pricesConfig.followUp.beef.value.negative
  decisionMatrix['followUp.dairy.yes.no.empty'] = pricesConfig.followUp.dairy.value.negative
  decisionMatrix['followUp.beef.yes.yes.no'] = pricesConfig.followUp.beef.value.negative
  decisionMatrix['followUp.dairy.yes.yes.no'] = pricesConfig.followUp.dairy.value.negative
  decisionMatrix['followUp.beef.yes.yes.yes'] = pricesConfig.followUp.beef.value.positive
  decisionMatrix['followUp.dairy.yes.yes.yes'] = pricesConfig.followUp.dairy.value.positive

  return decisionMatrix
}

const getAmount = (payload, pricesConfig) => {
  try {
    if (!payload) {
      throw new Error('Missing payload')
    }
    const decisionMatrix = getDecisionMatrix(pricesConfig)

    const claimType = payload.type === review ? 'review' : payload.type === endemics ? 'followUp' : 'empty'
    const livestockType = payload.data?.typeOfLivestock ? payload.data.typeOfLivestock : 'empty'
    const piHunt = payload.data?.piHunt ? payload.data.piHunt : 'empty'
    const piHuntRecommended = payload.data?.piHuntRecommended ? payload.data.piHuntRecommended : 'empty'
    const piHuntAllAnimals = payload.data?.piHuntAllAnimals ? payload.data.piHuntAllAnimals : 'empty'

    const amount = decisionMatrix[`${claimType}.${livestockType}.${piHunt}.${piHuntRecommended}.${piHuntAllAnimals}`]

    if (typeof amount !== 'number') {
      throw new Error(amount)
    }

    return amount
  } catch (e) {
    console.error(`unable to calculate amount : ${e.message} - payload : ${JSON.stringify(payload)}`)
    return '[Error: Unable to calculate amount]'
  }
}

module.exports = {
  getAmount
}
