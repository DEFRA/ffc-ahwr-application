const validateSubmitClaim = require('../../../../../app/messaging/schema/submit-claim-schema')

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
    {
      desc: 'Should Return False When Required Reference Field is Empty',
      reference: '',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required ConfirmCheckDetails Field is Empty',
      reference: '1',
      confirmCheckDetails: '',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required WhichReview Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required EligibleSpecies Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required Data Reference Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required Declaration Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required OfferStatus Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required VisitDate Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required Vet Name Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required URNResult Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required VetRcvs Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required DetailsCorrect Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '',
      name: '1',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required Name Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '',
      address: '1',
      email: '1'
    },
    {
      desc: 'Should Return False When Required Address Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '',
      email: '1'
    },
    {
      desc: 'Should Return False When Required Email Field is Empty',
      reference: '1',
      confirmCheckDetails: '1',
      whichReview: '1',
      eligibleSpecies: '1',
      dataReference: '1',
      declaration: '1',
      offerStatus: '1',
      visitDate: '1',
      vetName: '1',
      urnResult: '1',
      vetRcvs: '1',
      detailsCorrect: '1',
      name: '1',
      address: '1',
      email: ''
    }
  ])('$desc', async ({
    reference, confirmCheckDetails, whichReview, eligibleSpecies, dataReference, declaration, offerStatus, visitDate, vetName, urnResult,
    vetRcvs, detailsCorrect, name, address, email
  }) => {
    const event = {
      reference,
      data: {
        confirmCheckDetails,
        whichReview,
        eligibleSpecies,
        reference: dataReference,
        declaration,
        offerStatus,
        visitDate,
        vetName,
        urnResult,
        vetRcvs,
        detailsCorrect,
        dateOfClaim: '2023-07-22T00:00:00.000Z',
        dateOfTesting: '2023-07-21T00:00:00.000Z',
        organisation: {
          farmerName: 'Mr Farmer',
          name,
          sbi: '555555555',
          crn: '1111122222',
          cph: '55/555/5555',
          address,
          email,
          isTest: 'false'
        }
      }
    }

    const result = validateSubmitClaim(event)
    expect(result).toBeFalsy()
  })

  test.each([
    { desc: 'Should Return True When Optional DateOfClaim Field is Empty', dateOfClaim: '', dateOfTesting: '1', crn: '1', cph: '1', isTest: '1' },
    { desc: 'Should Return True When Optional DateOFTesting Field is Empty', dateOfClaim: '1', dateOfTesting: '', crn: '1', cph: '1', isTest: '1' },
    { desc: 'Should Return True When Optional CRN Field is Empty', dateOfClaim: '1', dateOfTesting: '1', crn: '', cph: '1', isTest: '1' },
    { desc: 'Should Return True When Optional CPH Field is Empty', dateOfClaim: '1', dateOfTesting: '1', crn: '1', cph: '', isTest: '1' },
    { desc: 'Should Return True When Optional IsTest Field is Empty', dateOfClaim: '1', dateOfTesting: '1', crn: '1', cph: '1', isTest: '' }
  ])('$desc', async ({ dateOfClaim, dateOfTesting, crn, cph, isTest }) => {
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
        dateOfClaim,
        dateOfTesting,
        organisation: {
          farmerName: 'Mr Farmer',
          name: 'Mr Farmers Farm',
          sbi: '555555555',
          crn,
          cph,
          address: 'Address line 1, Addres line 2, Town, AB12 34C',
          email: 'testemail@test.com',
          isTest
        }
      }
    }

    const result = validateSubmitClaim(event)
    expect(result).toBeFalsy()
  })
})
