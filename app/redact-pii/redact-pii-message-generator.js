import { config } from '../config/index.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'
import wreck from '@hapi/wreck'

const { messageGeneratorApiUri } = config

export const redactPII = async (agreementsToRedact, redactProgress, logger) => {
  const endpoint = `${messageGeneratorApiUri}/redact/pii`
  const agreementsToRedactPayload = agreementsToRedact.map(({ reference }) => { return { reference } })
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact: agreementsToRedactPayload } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}
