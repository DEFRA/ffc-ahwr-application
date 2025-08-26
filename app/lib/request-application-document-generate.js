import { config } from '../config/index.js'
import { sendMessage } from '../messaging/send-message.js'

const { applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue } = config

export const requestApplicationDocumentGenerateAndEmail = async (emailParams) => {
  const { reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData: { orgName, orgEmail, crn } } = emailParams
  const message = { crn, reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgName, ...(orgEmail && { orgEmail }) }

  return sendMessage(message, applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue)
}
