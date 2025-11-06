import { v4 as uuid } from 'uuid'
import { randomUUID } from 'node:crypto'
import { config } from '../../config/index.js'
import { PublishEvent } from 'ffc-ahwr-common-library'
import { sendMessage } from '../../messaging/send-message.js'
import { getRemindersToSend, updateReminders } from '../../repositories/application-repository.js'

const { messageGeneratorMsgReminderType, messageGeneratorQueue } = config

// START copied from common-lib@3.0.2
export const getNextNotClaimedReminderToSend = (previousReminderSent) => {
  return getNextReminderToSend(reminders.notClaimed, previousReminderSent)
}
const getNextReminderToSend = (type, previousReminderSent) => {
  if (type === reminders.notClaimed) {
    const { threeMonths, sixMonths, nineMonths } = reminders.notClaimed
    switch (previousReminderSent) {
      case threeMonths:
        return sixMonths
      case sixMonths:
        return nineMonths
      case nineMonths:
        return undefined
      default:
        return threeMonths
    }
  }
  throw new TypeError(`The type provided is not recognised, type:${type}`)
}
export const reminders = Object.freeze({
  notClaimed: Object.freeze({
    threeMonths: 'notClaimed_threeMonths',
    sixMonths: 'notClaimed_sixMonths',
    nineMonths: 'notClaimed_nineMonths'
  })
})
// END copied from common-lib@3.0.2

export const processReminderEmailRequest = async (message, logger) => {
  const { requestedDate } = message.body

  logger.setBindings({ requestedDate })
  logger.info('Processing reminders request started..')

  const applicationsDueReminder = await getApplicationsDueReminderEmail(requestedDate, logger)

  if (applicationsDueReminder.length === 0) {
    logger.info('No new applications due reminders')
    return
  }

  for (const application of applicationsDueReminder) {
    const payload = constructMessage(application)
    try {
      await sendToMessageGenerator(payload)
      await sendApplicationSessionEvent(application)
      await saveLastReminderSent(application, logger)
    } catch (error) {
      logger.error(error, 'Failed to processed reminders request')
      throw error
    }
  }
  logger.info('Successfully processed reminders request')
}

const getApplicationsDueReminderEmail = async (requestedDate, logger) => {
  const notClaimedNineMonths = await getApplicationsWithoutClaimAfterNineMonths(requestedDate, logger)
  const notClaimedSixMonths = await getApplicationsWithoutClaimAfterSixMonths(requestedDate, logger)
  const notClaimedThreeMonths = await getApplicationsWithoutClaimAfterThreeMonths(requestedDate, logger)

  const remindersNotClaimed = [...notClaimedNineMonths, ...notClaimedSixMonths, ...notClaimedThreeMonths]
    .map(unwrapDatabaseQueryDataValues)
    .map(removeOrgEmailIfSameAddressAsEmail) // prevents send two email to same address
    // TODO BH 1334 promote to next reminder if within one week

  return [...remindersNotClaimed]
}

const getApplicationsWithoutClaimAfterNineMonths = async (requestedDate, logger) => {
  const { nineMonths } = reminders.notClaimed
  const NINE_MONTHS = 9

  const nineMonthReminderWindowStart = new Date(requestedDate)
  nineMonthReminderWindowStart.setUTCMonth(nineMonthReminderWindowStart.getMonth() - NINE_MONTHS)

  return await getRemindersToSend(nineMonths, nineMonthReminderWindowStart, undefined, [], logger)
}

const getApplicationsWithoutClaimAfterSixMonths = async (requestedDate, logger) => {
  const { sixMonths, nineMonths } = reminders.notClaimed
  const SIX_MONTHS = 6; const NINE_MONTHS = 9

  const sixMonthReminderWindowStart = new Date(requestedDate)
  sixMonthReminderWindowStart.setUTCMonth(sixMonthReminderWindowStart.getMonth() - SIX_MONTHS)
  const sixMonthReminderWindowEnd = new Date(requestedDate)
  sixMonthReminderWindowEnd.setUTCMonth(sixMonthReminderWindowEnd.getMonth() - NINE_MONTHS)

  return await getRemindersToSend(sixMonths, sixMonthReminderWindowStart, sixMonthReminderWindowEnd, [nineMonths], logger)
}

const getApplicationsWithoutClaimAfterThreeMonths = async (requestedDate, logger) => {
  const { threeMonths, sixMonths, nineMonths } = reminders.notClaimed
  const THREE_MONTHS = 3; const SIX_MONTHS = 6

  const threeMonthReminderWindowStart = new Date(requestedDate)
  threeMonthReminderWindowStart.setUTCMonth(threeMonthReminderWindowStart.getMonth() - THREE_MONTHS)
  const threeMonthReminderWindowEnd = new Date(requestedDate)
  threeMonthReminderWindowEnd.setUTCMonth(threeMonthReminderWindowEnd.getMonth() - SIX_MONTHS)

  return await getRemindersToSend(threeMonths, threeMonthReminderWindowStart, threeMonthReminderWindowEnd, [sixMonths, nineMonths], logger)
}

const unwrapDatabaseQueryDataValues = (reminder) => { return { ...reminder.dataValues } }

const removeOrgEmailIfSameAddressAsEmail = (reminder) => {
  if (reminder.email === reminder.orgEmail) {
    delete reminder.orgEmail
  }
  return reminder
}

const constructMessage = ({ reminderType, reference, crn, sbi, email, orgEmail }) => {
  return {
    reminderType,
    agreementReference: reference,
    crn,
    sbi,
    emailAddresses: [email, orgEmail].filter(Boolean) // strip out any undefined
  }
}

const sendToMessageGenerator = async (reminder) => {
  await sendMessage(
    reminder,
    messageGeneratorMsgReminderType,
    messageGeneratorQueue,
    { sessionId: uuid() }
  )
}

const sendApplicationSessionEvent = async ({ sbi, reference, reminderType }) => {
  const eventPublisher = new PublishEvent(config.eventQueue)
  const data = { applicationReference: reference, reminderType }

  const event = {
    name: 'send-session-event',
    properties: {
      id: randomUUID(),
      sbi,
      cph: 'n/a',
      checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
      status: 'success',
      action: {
        type: 'application-reminders',
        message: 'Application reminder sent',
        data,
        raisedBy: 'admin',
        raisedOn: new Date().toISOString()
      }
    }
  }

  await eventPublisher.sendEvent(event)
}

const saveLastReminderSent = async ({ reference, reminderType, reminders }, logger) => {
  await updateReminders(reference, reminderType, reminders, logger)
}
