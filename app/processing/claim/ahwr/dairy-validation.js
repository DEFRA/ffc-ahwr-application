import { getBeefValidation } from './beef-validation.js'
import { claimType, testResults as testResultsConstant } from '../../../constants/index.js'
import joi from 'joi'

const dateOfTesting = { dateOfTesting: joi.date().required() }
const laboratoryURN = { laboratoryURN: joi.string().required() }
const testResults = { testResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required() }

export function getDairyValidation (claimData) {
  if (claimData.type === claimType.review) {
    return {
      ...dateOfTesting,
      ...laboratoryURN,
      ...testResults
    }
  }

  // Currently dairy FU validation is exactly the same as beef, so we will delegate. If they ever need to diverge, then this file can be extended.
  return getBeefValidation(claimData)
}
