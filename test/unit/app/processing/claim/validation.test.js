import { validateClaim } from '../../../../../app/processing/claim/validation.js'
import { validateAhwrClaim } from '../../../../../app/processing/claim/ahwr/base-validation.js'
import { AHWR_SCHEME } from 'ffc-ahwr-common-library'

jest.mock('../../../../../app/processing/claim/ahwr/base-validation.js')

describe('claim validation', () => {
  it('should validate AHWR claim calling through to Ahwr validation, returning result', () => {
    validateAhwrClaim.mockReturnValueOnce({})

    const claimData = {
      vetsName: 'John Doe',
      dateOfVisit: '2023-10-01',
      vetRCVSNumber: '123456'
    }
    const applicationFlags = []

    const result = validateClaim(AHWR_SCHEME, claimData, applicationFlags)

    expect(result).toEqual({})
    expect(validateAhwrClaim).toHaveBeenCalledWith(claimData, applicationFlags)
  })

  it('should validate AHWR claim calling through to Ahwr validation, returning error', () => {
    validateAhwrClaim.mockReturnValueOnce({ error: 'Validation error' })

    const claimData = {
      vetsName: 'John Doe',
      dateOfVisit: '2023-10-01',
      vetRCVSNumber: '123456'
    }
    const applicationFlags = [{ flag: 'someFlag' }]

    const result = validateClaim(AHWR_SCHEME, claimData, applicationFlags)

    expect(result).toEqual({ error: 'Validation error' })
    expect(validateAhwrClaim).toHaveBeenCalledWith(claimData, applicationFlags)
  })

  it('should throw error for unsupported scheme', () => {
    expect(() => {
      validateClaim('UNKNOWN_SCHEME', {}, [])
    }).toThrow('Unsupported scheme - UNKNOWN_SCHEME : cannot validate claim')
  })
})
