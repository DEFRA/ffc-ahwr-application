import { validateAhwrClaim } from '../../../../../../app/processing/claim/ahwr/base-validation.js'
import {
  claimType,
  livestockTypes,
  PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
} from '../../../../../../app/constants/index.js'

describe('Beef Validation Tests', () => {
  const applicationFlags = []

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

  describe('validate beef review claims', () => {
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

    it('should return true for valid beef claim', () => {
      const { error, value } = validateAhwrClaim(validBeefReviewClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid beef claim with insufficient animals tested', () => {
      const claim = deepClone(validBeefReviewClaim)
      claim.data.numberAnimalsTested = 4

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.numberAnimalsTested" must be greater than or equal to 5')
    })

    it('should return false for invalid beef claim missing required elements', () => {
      const claim = deepClone(validBeefReviewClaim)
      delete claim.data.testResults
      delete claim.data.laboratoryURN

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.laboratoryURN" is required. "data.testResults" is required')
    })
  })

  describe('validate beef follow up claims', () => {
    const dayBeforePiHunt = new Date(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE)
    dayBeforePiHunt.setDate(dayBeforePiHunt.getDate() - 1)

    const validBeefFollowUpClaim = {
      data: {
        typeOfLivestock: livestockTypes.beef,
        dateOfVisit: dayBeforePiHunt,
        speciesNumbers: 'yes',
        vetsName: 'Test Vet',
        vetRCVSNumber: '123456',
        dateOfTesting: dayBeforePiHunt,
        laboratoryURN: 'LAB123',
        vetVisitsReviewTestResults: 'positive',
        reviewTestResults: 'positive',
        testResults: 'positive',
        piHunt: 'yes',
        biosecurity: 'yes'
      },
      type: claimType.endemics,
      reference: 'REF123',
      applicationReference: 'APP123',
      createdBy: 'somebody'
    }

    it('should return true for valid beef follow up claim - pre Optional Pi hunt', () => {
      const { error, value } = validateAhwrClaim(validBeefFollowUpClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid beef follow up claim - post Optional Pi hunt', () => {
      const postPiHuntClaim = deepClone(validBeefFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.piHuntAllAnimals = 'yes'
      delete postPiHuntClaim.data.dateOfTesting
      delete postPiHuntClaim.data.laboratoryURN
      delete postPiHuntClaim.data.testResults

      const { error, value } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid beef follow up claim - post Optional Pi hunt. Negative review, no pi hunt ', () => {
      const postPiHuntClaim = deepClone(validBeefFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.reviewTestResults = 'negative'
      postPiHuntClaim.data.piHunt = 'no'
      delete postPiHuntClaim.data.dateOfTesting
      delete postPiHuntClaim.data.laboratoryURN
      delete postPiHuntClaim.data.testResults

      const { error, value } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid beef follow up claim - post Optional Pi hunt. Negative review, pi hunt recommended, not all animals ', () => {
      const postPiHuntClaim = deepClone(validBeefFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.reviewTestResults = 'negative'
      postPiHuntClaim.data.piHunt = 'yes'
      postPiHuntClaim.data.piHuntRecommended = 'yes'
      postPiHuntClaim.data.piHuntAllAnimals = 'no'
      delete postPiHuntClaim.data.dateOfTesting
      delete postPiHuntClaim.data.laboratoryURN
      delete postPiHuntClaim.data.testResults

      const { error, value } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid beef follow up claim - post Optional Pi hunt. Negative review, pi hunt recommended, all animals ', () => {
      const postPiHuntClaim = deepClone(validBeefFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.reviewTestResults = 'negative'
      postPiHuntClaim.data.piHunt = 'yes'
      postPiHuntClaim.data.piHuntRecommended = 'yes'
      postPiHuntClaim.data.piHuntAllAnimals = 'yes'

      const { error, value } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid beef follow up with positive review and not all animals included', () => {
      const postPiHuntClaim = deepClone(validBeefFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.piHunt = 'yes'
      postPiHuntClaim.data.piHuntAllAnimals = 'no'
      delete postPiHuntClaim.data.dateOfTesting
      delete postPiHuntClaim.data.laboratoryURN
      delete postPiHuntClaim.data.testResults

      const { error } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(error.message).toEqual('"data.piHuntAllAnimals" must be [yes]')
    })

    it('should return false for invalid beef follow up with positive review and no pi hunt carried out', () => {
      const postPiHuntClaim = deepClone(validBeefFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.piHunt = 'no'
      delete postPiHuntClaim.data.dateOfTesting
      delete postPiHuntClaim.data.laboratoryURN
      delete postPiHuntClaim.data.testResults

      const { error } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(error.message).toEqual('"data.piHunt" must be [yes]')
    })
  })
})
