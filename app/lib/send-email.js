const notifyClient = require('./notify-client')
const { notify: { templateIdVetApplicationComplete, templateIdFarmerApplicationClaim, templateIdFarmerApplicationComplete } } = require('../config')
const { serviceUri } = require('../config')

module.exports.sendFarmerConfirmationEmail = async (email, name, reference) => {
  let success = true
  try {
    await notifyClient.sendEmail(
      templateIdFarmerApplicationComplete,
      email,
      { personalisation: { name, reference }, reference }
    )
  } catch (e) {
    success = false
    console.error('Error occurred during sending email', e.response.data)
  }
  return success
}

module.exports.sendVetConfirmationEmail = async (vetEmail, reference) => {
  let success = true
  try {
    await notifyClient.sendEmail(
      templateIdVetApplicationComplete,
      vetEmail,
      { personalisation: { reference }, reference }
    )
  } catch (e) {
    success = false
    console.error('Error occurred during sending email', e.response.data)
  }
  return success
}

module.exports.sendFarmerClaimInvitationEmail = async (vetEmail, reference) => {
  let success = true
  try {
    await notifyClient.sendEmail(
      templateIdFarmerApplicationClaim,
      vetEmail,
      { personalisation: { reference, claimStartUrl: `${serviceUri}/farmer-claim` }, reference }
    )
  } catch (e) {
    success = false
    console.error('Error occurred during sending email', e.response.data)
  }
  return success
}
