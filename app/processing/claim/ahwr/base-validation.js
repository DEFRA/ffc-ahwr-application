import joi from 'joi'
import { claimType, livestockTypes, speciesNumbers } from '../../../constants/index.js'
import { isMultipleHerdsUserJourney } from '../../../lib/context-helper.js'
import { herdSchema } from '../../../routes/api/schema/herd.schema.js'
import { getBeefValidation } from './beef-validation.js'
import { getDairyValidation } from './dairy-validation.js'
import { getPigsValidation } from './pigs-validation.js'
import { getSheepValidation } from './sheep-validation.js'

const getDataModel = (multiHerds, specificValidationsForClaimType) => joi.object({
  amount: joi.string().optional(),
  typeOfLivestock: joi.string().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep).required(),
  dateOfVisit: joi.date().required(),
  speciesNumbers: joi.string().valid(speciesNumbers.yes, speciesNumbers.no).required(),
  vetsName: joi.string().required(),
  vetRCVSNumber: joi.string().required(),
  ...specificValidationsForClaimType,
  ...(multiHerds && herdSchema)
})

const getClaimModel = (multiHerds, specificValidationsForClaimType) => joi.object({
  applicationReference: joi.string().required(),
  reference: joi.string().required(),
  type: joi.string().valid(claimType.review, claimType.endemics).required(),
  createdBy: joi.string().required(),
  data: getDataModel(multiHerds, specificValidationsForClaimType)
})

export const validateAhwrClaim = (claimData, applicationFlags) => {
  const multiHerds = isMultipleHerdsUserJourney(claimData.data.dateOfVisit, applicationFlags)

  const specificValidationsForClaimType = speciesSpecificValidations.get(claimData.data.typeOfLivestock)(claimData)

  return getClaimModel(multiHerds, specificValidationsForClaimType).validate(claimData, { abortEarly: false })
}

const speciesSpecificValidations = new Map([
  [livestockTypes.beef, getBeefValidation],
  [livestockTypes.dairy, getDairyValidation],
  [livestockTypes.pigs, getPigsValidation],
  [livestockTypes.sheep, getSheepValidation]
])
