import { validateAhwrClaim } from '../../../../../../app/processing/claim/ahwr/base-validation.js'
import {
  claimType,
  livestockTypes
} from '../../../../../../app/constants/index.js'

describe('Sheep Validation Tests', () => {
  const applicationFlags = []

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

  describe('validate sheep review claims', () => {
    const validSheepReviewClaim = {
      data: {
        typeOfLivestock: livestockTypes.sheep,
        dateOfVisit: new Date(),
        speciesNumbers: 'yes',
        vetsName: 'Test Vet',
        vetRCVSNumber: '123456',
        numberAnimalsTested: 10,
        dateOfTesting: new Date(),
        laboratoryURN: 'LAB123',
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

    it('should return true for valid sheep claim', () => {
      const { error, value } = validateAhwrClaim(validSheepReviewClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid sheep claim with insufficient animals tested', () => {
      const claim = deepClone(validSheepReviewClaim)
      claim.data.numberAnimalsTested = 0

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.numberAnimalsTested" must be greater than or equal to 1')
    })

    it('should return false for invalid sheep claim missing required elements', () => {
      const claim = deepClone(validSheepReviewClaim)
      delete claim.data.laboratoryURN

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.laboratoryURN" is required')
    })
  })

  describe('validate sheep follow up claims', () => {
    const validSheepFollowUpClaim = {
      data: {
        typeOfLivestock: livestockTypes.sheep,
        dateOfVisit: new Date(),
        speciesNumbers: 'yes',
        vetsName: 'Test Vet',
        vetRCVSNumber: '123456',
        dateOfTesting: new Date(),
        numberAnimalsTested: 10,
        testResults: [
          {
            diseaseType: 'bad wool',
            result: 'definitive'
          },
          {
            diseaseType: 'ticks',
            result: [{
              diseaseType: 'nasty stuff',
              result: 'bad'
            }]
          }],
        sheepEndemicsPackage: 'sheepDiseases',
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

    it('should return true for valid sheep follow up claim - multi test results', () => {
      const { error, value } = validateAhwrClaim(validSheepFollowUpClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid sheep follow up with no test results', () => {
      const postPiHuntClaim = deepClone(validSheepFollowUpClaim)
      delete postPiHuntClaim.data.testResults

      const { error } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(error.message).toEqual('"data.testResults" is required')
    })
  })
})
