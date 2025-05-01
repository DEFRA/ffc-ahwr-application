import Joi from 'joi'
import { config } from '../../../config/index.js'
import {
  speciesNumbers,
  biosecurity,
  minimumNumberOfAnimalsTested,
  piHunt,
  piHuntRecommended,
  piHuntAllAnimals,
  minimumNumberOfOralFluidSamples,
  testResults as testResultsConstant,
  livestockTypes,
  claimType
} from '../../../constants/index.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../../lib/context-helper.js'

const isReview = (payload) => payload.type === claimType.review
const isFollowUp = (payload) => payload.type === claimType.endemics
const isPigs = (payload) => payload.data.typeOfLivestock === livestockTypes.pigs
const isBeef = (payload) => payload.data.typeOfLivestock === livestockTypes.beef
const isDairy = (payload) => payload.data.typeOfLivestock === livestockTypes.dairy
const isSheep = (payload) => payload.data.typeOfLivestock === livestockTypes.sheep
const isPositiveReviewTestResult = (payload) => payload.data.reviewTestResults === testResultsConstant.positive
const isPiHuntYes = (payload) => payload.data.piHunt === piHunt.yes
const isPiHuntRecommendedYes = (payload) => payload.data.piHuntRecommended === piHuntRecommended.yes

const getTestResultsValidation = (payload) => (pigsTestResults(payload) || sheepTestResults(payload) || beefDairyTestResults(payload))
const pigsTestResults = (payload) => isPigs(payload) && Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required()
const sheepTestResults = (payload) => (isSheep(payload) && isFollowUp(payload)) && Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.string() }))) })).required()
const beefDairyTestResults = (payload) => (isBeef(payload) || isDairy(payload)) && Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required()

const getNumberAnimalsTestedValidation = (payload) => {
  const threshold = minimumNumberOfAnimalsTested[payload.data.typeOfLivestock][payload.type]
  return (isPigs(payload) && isFollowUp(payload)) ? Joi.number().valid(threshold) : Joi.number().min(threshold).required()
}

const getBiosecurityValidation = (payload) => pigsBiosecurity(payload) || beefDairyBiosecurity(payload)
const beefDairyBiosecurity = (payload) => (isBeef || isDairy) && isFollowUp(payload) && Joi.string().valid(biosecurity.yes, biosecurity.no).required()
const pigsBiosecurity = (payload) => (isPigs(payload) && isFollowUp(payload)) && Joi.alternatives().try(Joi.string().valid(biosecurity.no), Joi.object({ biosecurity: Joi.string().valid(biosecurity.yes), assessmentPercentage: Joi.string().pattern(/^(?!0$)(100|\d{1,2})$/) })).required()

const piHuntModel = (payload, laboratoryURN, testResults) => {
  const validations = {}

  if (isPositiveReviewTestResult(payload)) {
    validations.piHunt = Joi.string().valid(piHunt.yes, piHunt.no).required()
    Object.assign(validations, laboratoryURN)
    Object.assign(validations, testResults)
  }

  return validations
}

const optionalPiHuntModel = (payload, laboratoryURN, testResults, dateOfTesting) => {
  const validations = {}

  if (isPositiveReviewTestResult(payload)) {
    validations.piHunt = Joi.string().valid(piHunt.yes).required()
  } else {
    validations.piHunt = Joi.string().valid(piHunt.yes, piHunt.no).required()
  }

  if (isPiHuntYes(payload)) {
    if (isPositiveReviewTestResult(payload)) {
      validations.piHuntAllAnimals = Joi.string().valid(piHuntAllAnimals.yes).required()
    } else {
      validations.piHuntRecommended = Joi.string().valid(piHuntRecommended.yes, piHuntRecommended.no).required()

      if (isPiHuntRecommendedYes(payload)) {
        validations.piHuntAllAnimals = Joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).required()
      }
    }

    if (payload.data.piHuntRecommended !== piHuntRecommended.no && payload.data.piHuntAllAnimals === piHuntAllAnimals.yes) {
      Object.assign(validations, laboratoryURN)
      Object.assign(validations, testResults)
      Object.assign(validations, dateOfTesting)
    }
  }

  return validations
}

const newHerd = Joi.object({
  herdId: Joi.string().required(),
  herdVersion: Joi.number().required(),
  herdName: Joi.string().required(),
  cph: Joi.string().required(),
  herdReasons: Joi.array().required()
})
const updateHerd = Joi.object({
  herdId: Joi.string().required(),
  herdVersion: Joi.number().required(),
  cph: Joi.string().required(),
  herdReasons: Joi.array().required()
})

export const isClaimDataValid = (payload) => {
  const dateOfTesting = { dateOfTesting: Joi.date().required() }
  const laboratoryURN = { laboratoryURN: Joi.string().required() }
  const numberAnimalsTested = { numberAnimalsTested: getNumberAnimalsTestedValidation(payload) }
  const testResults = { testResults: getTestResultsValidation(payload) }
  const numberOfOralFluidSamples = { numberOfOralFluidSamples: Joi.number().min(minimumNumberOfOralFluidSamples).required() }
  const vetVisitsReviewTestResults = { vetVisitsReviewTestResults: Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).optional() }
  const reviewTestResults = { reviewTestResults: Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required() }
  const piHunt = piHuntModel(payload, laboratoryURN, testResults)
  const herdVaccinationStatus = { herdVaccinationStatus: Joi.string().valid('vaccinated', 'notVaccinated').required() }
  const numberOfSamplesTested = { numberOfSamplesTested: Joi.number().valid(6, 30).required() }
  const diseaseStatus = { diseaseStatus: Joi.string().valid('1', '2', '3', '4').required() }
  const biosecurity = { biosecurity: getBiosecurityValidation(payload) }
  const sheepEndemicsPackage = { sheepEndemicsPackage: Joi.string().required() }
  const optionalPiHunt = optionalPiHuntModel(payload, laboratoryURN, testResults, dateOfTesting)

  const beefFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...(!isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && isPositiveReviewTestResult(payload) && dateOfTesting), ...(!isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && piHunt), ...(isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && optionalPiHunt), ...biosecurity }
  const dairyFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...(!isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && isPositiveReviewTestResult(payload) && dateOfTesting), ...(!isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && piHunt), ...(isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && optionalPiHunt), ...biosecurity }
  const pigFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...dateOfTesting, ...numberAnimalsTested, ...herdVaccinationStatus, ...laboratoryURN, ...numberOfSamplesTested, ...diseaseStatus, ...biosecurity }
  const sheepFollowUpValidations = { ...dateOfTesting, ...numberAnimalsTested, ...sheepEndemicsPackage, ...testResults }

  const getReviewValidations = () => {
    const base = { ...dateOfTesting, ...laboratoryURN }
    if (isBeef(payload)) { return { ...base, ...numberAnimalsTested, ...testResults } }
    if (isDairy(payload)) { return { ...base, ...testResults } }
    if (isPigs(payload)) { return { ...base, ...numberAnimalsTested, ...numberOfOralFluidSamples, ...testResults } }
    if (isSheep(payload)) { return { ...base, ...numberAnimalsTested } }
    return base
  }

  const dataModel = Joi.object({
    amount: Joi.string().optional(),
    typeOfLivestock: Joi.string().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep).required(),
    dateOfVisit: Joi.date().required(),
    speciesNumbers: Joi.string().valid(speciesNumbers.yes, speciesNumbers.no).required(),
    vetsName: Joi.string().required(),
    vetRCVSNumber: Joi.string().required(),
    ...(isReview(payload) ? getReviewValidations() : {}),
    ...((isFollowUp(payload) && isBeef(payload)) && beefFollowUpValidations),
    ...((isFollowUp(payload) && isDairy(payload)) && dairyFollowUpValidations),
    ...((isFollowUp(payload) && isPigs(payload)) && pigFollowUpValidations),
    ...((isFollowUp(payload) && isSheep(payload)) && sheepFollowUpValidations),
    ...(config.multiHerds.enabled && { herd: Joi.alternatives().try(updateHerd, newHerd).required() })
  })

  const claimModel = Joi.object({
    applicationReference: Joi.string().required(),
    reference: Joi.string().required(),
    type: Joi.string().valid(claimType.review, claimType.endemics).required(),
    createdBy: Joi.string().required(),
    data: dataModel
  })

  return claimModel.validate(payload)
}
