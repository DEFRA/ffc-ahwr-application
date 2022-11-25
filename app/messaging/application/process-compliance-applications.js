const { v4: uuid } = require('uuid')
const { get, updateByReference } = require('../../repositories/application-repository')
const statusIds = require('../../constants/status')
const sendMessage = require('../send-message')
const { submitPaymentRequestMsgType, submitRequestQueue } = require('../../config')

const processComplianceApplications = async (applicaitons) => {
  try {
    const applicationsPromise = []
    applicaitons.forEach((application) => {
      applicationsPromise.push(processApplication(application.reference, application.status))
    })

    await Promise.all(applicationsPromise)
    console.log('applications status successfully updated')
  } catch (error) {
    console.error(`failed to update applications status for ${JSON.stringify(applicaitons)}`, error)
  }
}

const processApplication = async (reference, status) => {
  const application = await get(reference)
  if (!application) {
    console.log(`application with reference ${reference} not found`)
    return
  }

  if (application.dataValues.statusId === status) {
    console.log(`application with reference ${reference} has same status`)
    return
  }

  let claimed = false
  let statusId = statusIds.rejected

  if (application.dataValues.statusId === statusIds.readyToPay) {
    claimed = true
    statusId = statusIds.readyToPay
    await sendMessage(
      {
        reference,
        sbi: application.dataValues.data.organisation.sbi,
        whichReview: application.dataValues.data.whichReview
      }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId: uuid() })
  }

  await updateByReference({ reference, claimed, statusId, updatedBy: 'admin' })
}

module.exports = processComplianceApplications
