import {
  claimType,
  livestockTypes,
  minimumNumberOfAnimalsTested
} from '../../../constants/index.js'
import joi from 'joi'

const minimumAnimalsTestedForReview = minimumNumberOfAnimalsTested[livestockTypes.sheep][claimType.review]
const minimumAnimalsTestedForFollowUp = minimumNumberOfAnimalsTested[livestockTypes.sheep][claimType.endemics]

const dateOfTesting = { dateOfTesting: joi.date().required() }
const laboratoryURN = { laboratoryURN: joi.string().required() }
const getNumberAnimalsTested = (minNumber) => ({ numberAnimalsTested: joi.number().min(minNumber).required() })
const sheepEndemicsPackage = { sheepEndemicsPackage: joi.string().required() }
const testResults = {
  testResults: joi.array().items(joi.object({
    diseaseType: joi.string(),
    result: joi.alternatives().try(joi.string(), joi.array().items(joi.object({
      diseaseType: joi.string(),
      result: joi.string()
    })))
  })).required() // note allows an empty array
}

export function getSheepValidation (claimData) {
  if (claimData.type === claimType.review) {
    return {
      ...dateOfTesting,
      ...laboratoryURN,
      ...getNumberAnimalsTested(minimumAnimalsTestedForReview)
    }
  } else {
    return {
      ...dateOfTesting,
      ...getNumberAnimalsTested(minimumAnimalsTestedForFollowUp),
      ...sheepEndemicsPackage,
      ...testResults
    }
  }
}
