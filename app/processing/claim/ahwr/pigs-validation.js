import {
  biosecurity,
  claimType,
  livestockTypes,
  minimumNumberOfAnimalsTested, minimumNumberOfOralFluidSamples,
  testResults as testResultsConstant
} from '../../../constants/index.js'
import joi from 'joi'
import { PIG_GENETIC_SEQUENCING_VALUES } from 'ffc-ahwr-common-library'

const POSITIVE_SAMPLE_REQ = 6
const NEGATIVE_SAMPLE_REQ = 30

const minimumAnimalsTestedForReview = minimumNumberOfAnimalsTested[livestockTypes.pigs][claimType.review]
const exactAnimalsTestedForFollowUp = minimumNumberOfAnimalsTested[livestockTypes.pigs][claimType.endemics]

const dateOfTesting = { dateOfTesting: joi.date().required() }
const laboratoryURN = { laboratoryURN: joi.string().required() }
const getMinNumberAnimalsTested = (minNumber) => ({ numberAnimalsTested: joi.number().min(minNumber).required() })
const getExactNumberAnimalsTested = (threshold) => ({ numberAnimalsTested: joi.number().valid(threshold).required() }) // this was not required previously. Should be?
const numberOfOralFluidSamples = { numberOfOralFluidSamples: joi.number().min(minimumNumberOfOralFluidSamples).required() }
const testResults = { testResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required() }

const vetVisitsReviewTestResults = { vetVisitsReviewTestResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).optional() }
const reviewTestResults = { reviewTestResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required() }
const herdVaccinationStatus = { herdVaccinationStatus: joi.string().valid('vaccinated', 'notVaccinated').required() }
const numberOfSamplesTested = { numberOfSamplesTested: joi.number().valid(POSITIVE_SAMPLE_REQ, NEGATIVE_SAMPLE_REQ).required() }

const pigsFollowUpTest = { pigsFollowUpTest: joi.string().valid('pcr', 'elisa').required() }
const pigsPcrTestResult = { pigsPcrTestResult: joi.string().when('pigsFollowUpTest', { is: 'pcr', then: joi.string().valid('positive', 'negative').required() }) }
const pigsElisaTestResult = { pigsElisaTestResult: joi.string().when('pigsFollowUpTest', { is: 'elisa', then: joi.string().valid('positive', 'negative').required() }) }
const pigsGeneticSequencing = { pigsGeneticSequencing: joi.string().when('pigsPcrTestResult', { is: 'positive', then: joi.valid(...PIG_GENETIC_SEQUENCING_VALUES.map(x => x.value)).required() }) }

const biosecurityData = { biosecurity: joi.alternatives().try(joi.string().valid(biosecurity.no), joi.object({ biosecurity: joi.string().valid(biosecurity.yes), assessmentPercentage: joi.string().pattern(/^(?!0$)(100|\d{1,2})$/) })).required() }

const getPigDiseaseData = () => {
  return {
    ...pigsFollowUpTest,
    ...pigsPcrTestResult,
    ...pigsElisaTestResult,
    ...pigsGeneticSequencing
  }
}
export function getPigsValidation (claimData) {
  if (claimData.type === claimType.review) {
    return {
      ...dateOfTesting,
      ...laboratoryURN,
      ...getMinNumberAnimalsTested(minimumAnimalsTestedForReview),
      ...numberOfOralFluidSamples,
      ...testResults
    }
  }

  return {
    ...vetVisitsReviewTestResults,
    ...reviewTestResults,
    ...dateOfTesting,
    ...getExactNumberAnimalsTested(exactAnimalsTestedForFollowUp),
    ...herdVaccinationStatus,
    ...laboratoryURN,
    ...numberOfSamplesTested,
    ...getPigDiseaseData(),
    ...biosecurityData
  }
}
