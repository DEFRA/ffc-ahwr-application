import { validateAhwrClaim } from '../../../../../../app/processing/claim/ahwr/base-validation.js'
import { TYPES_OF_SAMPLE_TAKEN } from '../../../../../../app/processing/claim/ahwr/pigs-validation.js'
import {
  claimType,
  livestockTypes
} from '../../../../../../app/constants/index.js'

describe('Pigs Validation Tests', () => {
  const applicationFlags = []

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

  describe('validate pigs review claims', () => {
    const validPigsReviewClaim = {
      data: {
        typeOfLivestock: livestockTypes.pigs,
        dateOfVisit: new Date(),
        speciesNumbers: 'yes',
        vetsName: 'Test Vet',
        vetRCVSNumber: '123456',
        numberAnimalsTested: 30,
        numberOfOralFluidSamples: 5,
        dateOfTesting: new Date(),
        laboratoryURN: 'LAB123',
        testResults: 'positive',
        herd: {
          herdId: 'herd-1',
          herdVersion: 1,
          herdName: 'herd 1',
          cph: '12/345/6789',
          herdReasons: ['onlyHerd'],
          herdSame: 'yes'
        }
      },
      type: claimType.review,
      reference: 'REF123',
      applicationReference: 'APP123',
      createdBy: 'somebody'
    }

    it(`should return true for valid pigs claim with ${TYPES_OF_SAMPLE_TAKEN.oralFluid} samples`, () => {
      const { error, value } = validateAhwrClaim(validPigsReviewClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it(`should return true for valid pigs claim with ${TYPES_OF_SAMPLE_TAKEN.blood} samples`, () => {
      const claim = deepClone(validPigsReviewClaim)
      claim.data.typeOfSamplesTaken = TYPES_OF_SAMPLE_TAKEN.blood
      delete claim.data.numberOfOralFluidSamples
      claim.data.numberOfBloodSamples = 30

      const { error, value } = validateAhwrClaim(claim, applicationFlags)

      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid pigs claim with insufficient animals tested', () => {
      const claim = deepClone(validPigsReviewClaim)
      claim.data.numberAnimalsTested = 29
      claim.data.numberOfOralFluidSamples = 4

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.numberAnimalsTested" must be greater than or equal to 30. "data.numberOfOralFluidSamples" must be greater than or equal to 5')
    })

    it('should return false for invalid pigs claim missing required elements', () => {
      const claim = deepClone(validPigsReviewClaim)
      delete claim.data.testResults

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.testResults" is required')
    })

    it('should return false for invalid pigs claim when no value for typeOfSamplesTaken and numberOfOralFluidSamples not provided', () => {
      const claim = deepClone(validPigsReviewClaim)
      delete claim.data.numberOfOralFluidSamples

      const { error } = validateAhwrClaim(claim, applicationFlags)

      expect(error.message).toEqual('"data.numberOfOralFluidSamples" is required')
    })

    it(`should return false for invalid pigs claim when typeOfSamplesTaken is ${TYPES_OF_SAMPLE_TAKEN.oralFluid} and numberOfOralFluidSamples not provided`, () => {
      const claim = deepClone(validPigsReviewClaim)
      claim.data.typeOfSamplesTaken = TYPES_OF_SAMPLE_TAKEN.oralFluid
      delete claim.data.numberOfOralFluidSamples

      const { error } = validateAhwrClaim(claim, applicationFlags)

      expect(error.message).toEqual('"data.numberOfOralFluidSamples" is required')
    })

    it(`should return false for invalid pigs claim when typeOfSamplesTaken is ${TYPES_OF_SAMPLE_TAKEN.blood} and numberOfBloodSamples not provided`, () => {
      const claim = deepClone(validPigsReviewClaim)
      claim.data.typeOfSamplesTaken = TYPES_OF_SAMPLE_TAKEN.blood
      delete claim.data.numberOfOralFluidSamples
      delete claim.data.numberOfBloodSamples // not in validPigsReviewClaim but want to be explicit

      const { error } = validateAhwrClaim(claim, applicationFlags)

      expect(error.message).toEqual('"data.numberOfBloodSamples" is required')
    })

    it(`should return false for invalid pigs claim when typeOfSamplesTaken is ${TYPES_OF_SAMPLE_TAKEN.blood} and contains both numberOfBloodSamples and numberOfOralFluidSamples`, () => {
      const claim = deepClone(validPigsReviewClaim)
      claim.data.typeOfSamplesTaken = TYPES_OF_SAMPLE_TAKEN.blood
      claim.data.numberOfOralFluidSamples = 5
      claim.data.numberOfBloodSamples = 30

      const { error } = validateAhwrClaim(claim, applicationFlags)

      expect(error.message).toEqual('"data.numberOfOralFluidSamples" is not allowed')
    })

    it(`should return false for invalid pigs claim when typeOfSamplesTaken is ${TYPES_OF_SAMPLE_TAKEN.oralFluid} and contains both numberOfBloodSamples and numberOfOralFluidSamples`, () => {
      const claim = deepClone(validPigsReviewClaim)
      claim.data.typeOfSamplesTaken = TYPES_OF_SAMPLE_TAKEN.oralFluid
      claim.data.numberOfOralFluidSamples = 5
      claim.data.numberOfBloodSamples = 30

      const { error } = validateAhwrClaim(claim, applicationFlags)

      expect(error.message).toEqual('"data.numberOfBloodSamples" is not allowed')
    })
  })

  describe('validate pigs follow up claims', () => {
    const validPigsFollowUpClaimPreUpdate = {
      data: {
        typeOfLivestock: livestockTypes.pigs,
        dateOfVisit: new Date(),
        speciesNumbers: 'yes',
        vetsName: 'Test Vet',
        vetRCVSNumber: '123456',
        dateOfTesting: new Date(),
        laboratoryURN: 'LAB123',
        numberAnimalsTested: 30,
        numberOfSamplesTested: 30,
        reviewTestResults: 'positive',
        diseaseStatus: '2',
        herdVaccinationStatus: 'vaccinated',
        biosecurity: {
          biosecurity: 'yes',
          assessmentPercentage: '12'
        },
        herd: {
          herdId: 'herd-1',
          herdVersion: 1,
          herdName: 'herd 1',
          cph: '12/345/6789',
          herdReasons: ['onlyHerd'],
          herdSame: 'yes'
        }
      },
      type: claimType.endemics,
      reference: 'REF123',
      applicationReference: 'APP123',
      createdBy: 'somebody'
    }

    const validPigsFollowupClaimPostUpdate = deepClone(validPigsFollowUpClaimPreUpdate)
    validPigsFollowupClaimPostUpdate.data.pigsFollowUpTest = 'pcr'
    validPigsFollowupClaimPostUpdate.data.pigsPcrTestResult = 'positive'
    validPigsFollowupClaimPostUpdate.data.pigsGeneticSequencing = 'mlv'
    delete validPigsFollowupClaimPostUpdate.data.diseaseStatus

    it('should return true for valid pigs follow up claim - PCR positive', () => {
      const { error, value } = validateAhwrClaim(validPigsFollowupClaimPostUpdate, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid pigs follow up claim - PCR negative', () => {
      const claim = deepClone(validPigsFollowupClaimPostUpdate)
      claim.data.pigsPcrTestResult = 'negative'
      claim.data.biosecurity = 'no'
      delete claim.data.pigsGeneticSequencing

      const { error, value } = validateAhwrClaim(claim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid pigs follow up claim - Elisa positive', () => {
      const claim = deepClone(validPigsFollowupClaimPostUpdate)
      claim.data.pigsFollowUpTest = 'elisa'
      claim.data.pigsElisaTestResult = 'positive'
      delete claim.data.pigsPcrTestResult
      delete claim.data.pigsGeneticSequencing

      const { error, value } = validateAhwrClaim(claim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid pigs follow up with invalid disease status options', () => {
      const claim = deepClone(validPigsFollowupClaimPostUpdate)
      delete claim.data.pigsGeneticSequencing

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.pigsGeneticSequencing" is required')
    })
  })
})
