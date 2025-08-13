import { validateAhwrClaim } from './ahwr/base-validation.js'
import { AHWR_SCHEME } from 'ffc-ahwr-common-library'

export const validateClaim = (scheme, claimData, applicationFlags) => {
  // forward on to scheme
  if (scheme === AHWR_SCHEME) {
    return validateAhwrClaim(claimData, applicationFlags)
  }

  throw new Error(`Unsupported scheme - ${scheme} : cannot validate claim`)
}
