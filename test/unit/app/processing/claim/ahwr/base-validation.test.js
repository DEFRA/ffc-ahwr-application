import { validateAhwrClaim } from '../../../../../../app/processing/claim/ahwr/base-validation.js'
import {
  claimType,
  livestockTypes, MULTIPLE_HERDS_RELEASE_DATE
} from '../../../../../../app/constants/index.js'

describe('Base Validation Tests', () => {
  const applicationFlags = []

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

  describe('validate review claims', () => {
    const validBeefReviewClaim = {
      data: {
        typeOfLivestock: livestockTypes.beef,
        dateOfVisit: new Date(),
        speciesNumbers: 'yes',
        vetsName: 'Test Vet',
        vetRCVSNumber: '123456',
        numberAnimalsTested: 5,
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

    it('should return true for valid beef claim with new herd', () => {
      const { error, value } = validateAhwrClaim(validBeefReviewClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid beef claim with updated herd', () => {
      const claim = deepClone(validBeefReviewClaim)
      claim.data.herd = {
        herdId: 'herd-1',
        herdVersion: 2,
        cph: '12/345/6789',
        herdReasons: ['keptSeparate']
      }
      const { error, value } = validateAhwrClaim(claim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid beef claim without herd', () => {
      const claim = deepClone(validBeefReviewClaim)
      delete claim.data.herd

      const preMhDate = new Date(MULTIPLE_HERDS_RELEASE_DATE)
      preMhDate.setDate(preMhDate.getDate() - 1)
      claim.data.dateOfVisit = preMhDate

      const { error, value } = validateAhwrClaim(claim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid beef claim missing required elements', () => {
      const claim = deepClone(validBeefReviewClaim)
      delete claim.data.vetsName
      delete claim.data.vetRCVSNumber

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.vetsName" is required. "data.vetRCVSNumber" is required')
    })
  })
})
