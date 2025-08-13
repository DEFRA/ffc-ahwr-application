import { validateAhwrClaim } from '../../../../../../app/processing/claim/ahwr/base-validation.js'
import {
  claimType,
  livestockTypes
} from '../../../../../../app/constants/index.js'
import { config } from '../../../../../../app/config/index.js'

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

    it('should return true for valid pigs claim', () => {
      const { error, value } = validateAhwrClaim(validPigsReviewClaim, applicationFlags)
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
      delete claim.data.numberOfOralFluidSamples
      delete claim.data.testResults

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.numberOfOralFluidSamples" is required. "data.testResults" is required')
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

    it('should return true for valid pigs follow up claim - pig updates disabled', () => {
      config.pigUpdates.enabled = false
      const { error, value } = validateAhwrClaim(validPigsFollowUpClaimPreUpdate, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid pigs follow up claim - pig updates enabled, PCR positive', () => {
      config.pigUpdates.enabled = true
      const { error, value } = validateAhwrClaim(validPigsFollowupClaimPostUpdate, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid pigs follow up claim - pig updates enabled, PCR negative', () => {
      config.pigUpdates.enabled = true
      const claim = deepClone(validPigsFollowupClaimPostUpdate)
      claim.data.pigsPcrTestResult = 'negative'
      claim.data.biosecurity = 'no'
      delete claim.data.pigsGeneticSequencing

      const { error, value } = validateAhwrClaim(claim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid pigs follow up claim - pig updates enabled, Elisa positive', () => {
      config.pigUpdates.enabled = true
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
