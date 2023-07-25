const validateSubmitClaim = require('../../../../../app/messaging/schema/submit-claim-schema')
const unset = require('lodash.unset')

describe('Submit Claim Schema Tests', () => {
  test('Should Return True When All Fields Are Populated', () => {
    const event = {
      reference: 'AHWR-1234-5678',
      data: {
        confirmCheckDetails: 'yes',
        whichReview: 'sheep',
        eligibleSpecies: 'yes',
        reference: 'ABC123',
        declaration: 'true',
        offerStatus: 'accepted',
        visitDate: '2023-07-21T00:00:00.000Z',
        vetName: 'Mr Vet',
        urnResult: '134242',
        vetRcvs: '1234234',
        detailsCorrect: 'yes',
        dateOfClaim: '2023-07-22T00:00:00.000Z',
        dateOfTesting: '2023-07-21T00:00:00.000Z',
        organisation: {
          farmerName: 'Mr Farmer',
          name: 'Mr Farmers Farm',
          sbi: '555555555',
          crn: '1111122222',
          cph: '55/555/5555',
          address: 'Address line 1, Addres line 2, Town, AB12 34C',
          email: 'testemail@test.com',
          isTest: 'false'
        }
      }
    }

    const result = validateSubmitClaim(event)
    expect(result).toBeTruthy()
  })

  test.each([
    { desc: 'Should Return False When Required Reference Field Is Missing', fieldName: 'reference' },
    { desc: 'Should Return False When Required ConfirmCheckDetails Field Is Missing', fieldName: 'data.confirmCheckDetails' },
    { desc: 'Should Return False When Required WhichReview Field Is Missing', fieldName: 'data.whichReview' },
    { desc: 'Should Return False When Required EligibleSpecies Field Is Missing', fieldName: 'data.eligibleSpecies' },
    { desc: 'Should Return False When Required Data Reference Field Is Missing', fieldName: 'data.reference' },
    { desc: 'Should Return False When Required Declaration Field Is Missing', fieldName: 'data.declaration' },
    { desc: 'Should Return False When Required OfferStatus Field Is Missing', fieldName: 'data.offerStatus' },
    { desc: 'Should Return False When Required VisitDate Field Is Missing', fieldName: 'data.visitDate' },
    { desc: 'Should Return False When Required VetName Field Is Missing', fieldName: 'data.vetName' },
    { desc: 'Should Return False When Required URNResult Field Is Missing', fieldName: 'data.urnResult' },
    { desc: 'Should Return False When Required VetRcvs Field Is Missing', fieldName: 'data.vetRcvs' },
    { desc: 'Should Return False When Required DetailsCorrect Field Is Missing', fieldName: 'data.detailsCorrect' },
    { desc: 'Should Return False When Required Organisation Name Field Is Missing', fieldName: 'data.organisation.name' },
    { desc: 'Should Return False When Required Organisation Address Field Is Missing', fieldName: 'data.organisation.address' },
    { desc: 'Should Return False When Required Organisation Email Field Is Missing', fieldName: 'data.organisation.email' }
  ])('$desc', async ({ fieldName }) => {
    const event = {
      reference: 'AHWR-1234-5678',
      data: {
        confirmCheckDetails: 'yes',
        whichReview: 'sheep',
        eligibleSpecies: 'yes',
        reference: 'ABC123',
        declaration: 'true',
        offerStatus: 'accepted',
        visitDate: '2023-07-21T00:00:00.000Z',
        vetName: 'Mr Vet',
        urnResult: '134242',
        vetRcvs: '1234234',
        detailsCorrect: 'yes',
        dateOfClaim: '2023-07-22T00:00:00.000Z',
        dateOfTesting: '2023-07-21T00:00:00.000Z',
        organisation: {
          farmerName: 'Mr Farmer',
          name: 'Mr Farmers Farm',
          sbi: '555555555',
          crn: '1111122222',
          cph: '55/555/5555',
          address: 'Address line 1, Addres line 2, Town, AB12 34C',
          email: 'testemail@test.com',
          isTest: 'false'
        }
      }
    }
    unset(event, fieldName)

    const result = validateSubmitClaim(event)
    expect(result).toBeFalsy()
  })

  test.each([
    { desc: 'Should Return True When Optional DateOfClaim Field Is Missing', fieldName: 'data.dateOfClaim' },
    { desc: 'Should Return True When Optional DateOFTesting Field Is Missing', fieldName: 'data.dateOfTesting' },
    { desc: 'Should Return True When Optional CRN Field Is Missing', fieldName: 'data.organisation.crn' },
    { desc: 'Should Return True When Optional CPH Field Is Missing', fieldName: 'data.organisation.cph' },
    { desc: 'Should Return True When Optional IsTest Field Is Missing', fieldName: 'data.organisation.isTest' }
  ])('$desc', async ({ fieldName }) => {
    const event = {
      reference: 'AHWR-1234-5678',
      data: {
        confirmCheckDetails: 'yes',
        whichReview: 'sheep',
        eligibleSpecies: 'yes',
        reference: 'ABC123',
        declaration: 'true',
        offerStatus: 'accepted',
        visitDate: '2023-07-21T00:00:00.000Z',
        vetName: 'Mr Vet',
        urnResult: '134242',
        vetRcvs: '1234234',
        detailsCorrect: 'yes',
        dateOfClaim: '2023-07-22T00:00:00.000Z',
        dateOfTesting: '2023-07-21T00:00:00.000Z',
        organisation: {
          farmerName: 'Mr Farmer',
          name: 'Mr Farmers Farm',
          sbi: '555555555',
          crn: '1111122222',
          cph: '55/555/5555',
          address: 'Address line 1, Addres line 2, Town, AB12 34C',
          email: 'testemail@test.com',
          isTest: 'false'
        }
      }
    }
    unset(event, fieldName)

    const result = validateSubmitClaim(event)
    expect(result).toBeTruthy()
  })
})
