const { v4: uuid } = require('uuid')
const { get, updateByReference } = require('../../repositories/application-repository')
const { getPendingApplications, update } = require('../../repositories/compliance-application-repository')
const statusIds = require('../../constants/status')
const sendMessage = require('../send-message')
const { submitPaymentRequestMsgType, submitRequestQueue } = require('../../config')

const processComplianceApplications = async () => {
  try {
    const complianceApplicaitons = await getPendingApplications()
    const applicationsPromise = []

    if (!complianceApplicaitons) {
      console.log('No compliance applications to process')
      return
    }

    complianceApplicaitons.forEach((application) => {
      console.log(application)
      applicationsPromise.push(processApplication(application.applicationReference, application.statusId, application.id))
    })

    await Promise.all(applicationsPromise)
    console.log('applications status successfully updated')
  } catch (error) {
    console.error('failed to update applications status', error)
  }
}

const processApplication = async (reference, statusId, id) => {
  const application = await get(reference)
  if (!application) {
    console.log(`application with reference ${reference} not found`)
    return
  }

  if (application.dataValues.statusId === statusId) {
    console.log(`application with reference ${reference} has same status`)
    return
  }

  let claimed = false

  if (statusId === statusIds.readyToPay) {
    claimed = true
    await sendMessage(
      {
        reference,
        sbi: application.dataValues.data.organisation.sbi,
        whichReview: application.dataValues.data.whichReview
      }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId: uuid() }
    )
  }

  await updateByReference({ reference, claimed, statusId, updatedBy: 'admin' })
  await update({ processed: true }, id)
  console.log(`application with reference ${reference} successfully updated`)
}

module.exports = processComplianceApplications
