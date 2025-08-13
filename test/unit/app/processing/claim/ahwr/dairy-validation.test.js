import { validateAhwrClaim } from '../../../../../../app/processing/claim/ahwr/base-validation.js'
import {
  claimType,
  livestockTypes,
  PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
} from '../../../../../../app/constants/index.js'

describe('Dairy Validation Tests', () => {
  const applicationFlags = []

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

  describe('validate dairy review claims', () => {
    const validDairyReviewClaim = {
      data: {
        typeOfLivestock: livestockTypes.dairy,
        dateOfVisit: new Date(),
        speciesNumbers: 'yes',
        vetsName: 'Test Vet',
        vetRCVSNumber: '123456',
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

    it('should return true for valid dairy claim', () => {
      const { error, value } = validateAhwrClaim(validDairyReviewClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid dairy claim with invalid value for animals tested', () => {
      const claim = deepClone(validDairyReviewClaim)
      claim.data.testResults = 'unclear'

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.testResults" must be one of [positive, negative]')
    })

    it('should return false for invalid dairy claim missing required elements', () => {
      const claim = deepClone(validDairyReviewClaim)
      delete claim.data.testResults
      delete claim.data.laboratoryURN

      const { error } = validateAhwrClaim(claim, applicationFlags)
      expect(error.message).toEqual('"data.laboratoryURN" is required. "data.testResults" is required')
    })
  })

  describe('validate dairy follow up claims', () => {
    const dayBeforePiHunt = new Date(PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE)
    dayBeforePiHunt.setDate(dayBeforePiHunt.getDate() - 1)

    const validDairyFollowUpClaim = {
      data: {
        typeOfLivestock: livestockTypes.dairy,
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

    it('should return true for valid dairy follow up claim - pre Optional Pi hunt', () => {
      const { error, value } = validateAhwrClaim(validDairyFollowUpClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid dairy follow up claim - pre Optional Pi hunt, negative review', () => {
      const prePiHuntClaim = deepClone(validDairyFollowUpClaim)
      prePiHuntClaim.data.reviewTestResults = 'negative'
      delete prePiHuntClaim.data.piHunt
      delete prePiHuntClaim.data.laboratoryURN
      delete prePiHuntClaim.data.testResults
      delete prePiHuntClaim.data.dateOfTesting

      const { error, value } = validateAhwrClaim(prePiHuntClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid dairy follow up claim - post Optional Pi hunt', () => {
      const postPiHuntClaim = deepClone(validDairyFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.piHuntAllAnimals = 'yes'

      const { error, value } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return true for valid dairy follow up claim - post Optional Pi hunt. Negative review, no pi hunt ', () => {
      const postPiHuntClaim = deepClone(validDairyFollowUpClaim)
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

    it('should return true for valid dairy follow up claim - post Optional Pi hunt. Negative review, pi hunt recommended, not all animals ', () => {
      const postPiHuntClaim = deepClone(validDairyFollowUpClaim)
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

    it('should return true for valid dairy follow up claim - post Optional Pi hunt. Negative review, pi hunt recommended, all animals ', () => {
      const postPiHuntClaim = deepClone(validDairyFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.reviewTestResults = 'negative'
      postPiHuntClaim.data.piHunt = 'yes'
      postPiHuntClaim.data.piHuntRecommended = 'yes'
      postPiHuntClaim.data.piHuntAllAnimals = 'yes'

      const { error, value } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(value).toBeDefined()
      expect(error).toBeUndefined()
    })

    it('should return false for invalid dairy follow up with positive review and not all animals included', () => {
      const postPiHuntClaim = deepClone(validDairyFollowUpClaim)
      postPiHuntClaim.data.dateOfVisit = PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
      postPiHuntClaim.data.piHunt = 'yes'
      postPiHuntClaim.data.piHuntAllAnimals = 'no'
      delete postPiHuntClaim.data.dateOfTesting
      delete postPiHuntClaim.data.laboratoryURN
      delete postPiHuntClaim.data.testResults

      const { error } = validateAhwrClaim(postPiHuntClaim, applicationFlags)
      expect(error.message).toEqual('"data.piHuntAllAnimals" must be [yes]')
    })

    it('should return false for invalid dairy follow up with positive review and no pi hunt carried out', () => {
      const postPiHuntClaim = deepClone(validDairyFollowUpClaim)
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
