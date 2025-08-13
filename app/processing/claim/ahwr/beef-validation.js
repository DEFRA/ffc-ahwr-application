import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../../lib/context-helper.js'
import {
  biosecurity,
  claimType,
  livestockTypes,
  minimumNumberOfAnimalsTested, piHunt, piHuntAllAnimals, piHuntRecommended,
  testResults as testResultsConstant
} from '../../../constants/index.js'
import joi from 'joi'

const minimumAnimalsTestedForReview = minimumNumberOfAnimalsTested[livestockTypes.beef][claimType.review]

const dateOfTesting = { dateOfTesting: joi.date().required() }
const laboratoryURN = { laboratoryURN: joi.string().required() }
const getNumberAnimalsTested = (minNumber) => ({ numberAnimalsTested: joi.number().min(minNumber).required() })
const testResults = { testResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required() }

const vetVisitsReviewTestResults = { vetVisitsReviewTestResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).optional() }
const reviewTestResults = { reviewTestResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required() }
const biosecurityData = { biosecurity: joi.string().valid(biosecurity.yes, biosecurity.no).required() }

const piHuntModel = (isPositiveReviewTestResult) => {
  const validations = {}

  if (isPositiveReviewTestResult) {
    validations.piHunt = joi.string().valid(piHunt.yes, piHunt.no).required()
    Object.assign(validations, laboratoryURN)
    Object.assign(validations, testResults)
  }

  return validations
}

const optionalPiHuntModel = (isPositiveReviewTestResult, piHuntYes, piHuntRecommendedYes, piHuntAllAnimalsYes) => {
  const validations = {}

  if (isPositiveReviewTestResult) {
    validations.piHunt = joi.string().valid(piHunt.yes).required()
  } else {
    validations.piHunt = joi.string().valid(piHunt.yes, piHunt.no).required()
  }

  if (piHuntYes) {
    if (isPositiveReviewTestResult) {
      validations.piHuntAllAnimals = joi.string().valid(piHuntAllAnimals.yes).required()
    } else {
      validations.piHuntRecommended = joi.string().valid(piHuntRecommended.yes, piHuntRecommended.no).required()

      if (piHuntRecommendedYes) {
        validations.piHuntAllAnimals = joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).required()
      }
    }

    if (piHuntRecommendedYes && piHuntAllAnimalsYes) {
      Object.assign(validations, laboratoryURN)
      Object.assign(validations, testResults)
      Object.assign(validations, dateOfTesting)
    }
  }

  return validations
}

export function getBeefValidation (claimData) {
  if (claimData.type === claimType.review) {
    return {
      ...dateOfTesting,
      ...laboratoryURN,
      ...getNumberAnimalsTested(minimumAnimalsTestedForReview),
      ...testResults
    }
  }

  const visitDateAfterPIHuntAndDairyGoLive = isVisitDateAfterPIHuntAndDairyGoLive(claimData.data.dateOfVisit)
  const isPositiveReviewTestResult = claimData.data.reviewTestResults === testResultsConstant.positive
  const piHuntYes = claimData.data.piHunt === piHunt.yes
  const piHuntRecommendedYes = claimData.data.piHuntRecommended === piHuntRecommended.yes
  const piHuntAllAnimalsYes = claimData.data.piHuntAllAnimals === piHuntAllAnimals.yes
  return {
    ...vetVisitsReviewTestResults,
    ...reviewTestResults,
    ...(!visitDateAfterPIHuntAndDairyGoLive && isPositiveReviewTestResult && dateOfTesting),
    ...(!visitDateAfterPIHuntAndDairyGoLive && piHuntModel(isPositiveReviewTestResult)),
    ...(visitDateAfterPIHuntAndDairyGoLive && optionalPiHuntModel(isPositiveReviewTestResult, piHuntYes, piHuntRecommendedYes, piHuntAllAnimalsYes)),
    ...biosecurityData
  }
}
