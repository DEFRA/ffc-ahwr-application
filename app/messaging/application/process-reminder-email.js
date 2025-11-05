import { v4 as uuid } from 'uuid'
import { config } from '../../config/index.js'
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
      await saveLastReminderSent(application, logger)
    } catch (error) {
      logger.error(error, 'Failed to processed reminders request')
      throw error
    }
  }
  logger.info('Successfully processed reminders request')
}

const getApplicationsDueReminderEmail = async (requestedDate, logger) => {
  const { threeMonths, sixMonths, nineMonths } = reminders.notClaimed

  // applicationsWithoutClaimAfterNineMonths
  const nineMonthReminderWindowStart = new Date(requestedDate)
  nineMonthReminderWindowStart.setUTCMonth(nineMonthReminderWindowStart.getMonth() - 9)
  const notClaimedNineMonths = await getRemindersToSend(nineMonths, nineMonthReminderWindowStart, undefined, [], logger)

  // applicationsWithoutClaimAfterSixMonths
  const sixMonthReminderWindowStart = new Date(requestedDate)
  sixMonthReminderWindowStart.setUTCMonth(sixMonthReminderWindowStart.getMonth() - 6)
  const sixMonthReminderWindowEnd = new Date(requestedDate)
  sixMonthReminderWindowEnd.setUTCMonth(sixMonthReminderWindowEnd.getMonth() - 9)
  const notClaimedSixMonths = await getRemindersToSend(sixMonths, sixMonthReminderWindowStart, sixMonthReminderWindowEnd, [nineMonths], logger)

  // applicationsWithoutClaimAfterThreeMonths
  const threeMonthReminderWindowStart = new Date(requestedDate)
  threeMonthReminderWindowStart.setUTCMonth(threeMonthReminderWindowStart.getMonth() - 3)
  const threeMonthReminderWindowEnd = new Date(requestedDate)
  threeMonthReminderWindowEnd.setUTCMonth(threeMonthReminderWindowEnd.getMonth() - 6)
  const notClaimedThreeMonths = await getRemindersToSend(threeMonths, threeMonthReminderWindowStart, threeMonthReminderWindowEnd, [sixMonths, nineMonths], logger)

  // transform and promote to next reminder if within one week
  const remindersNotClaimed = [...notClaimedNineMonths, ...notClaimedSixMonths, ...notClaimedThreeMonths]
    .map((reminder) => { return { ...reminder.dataValues } })
    // TODO BH 1334 promote to next reminder if within one week
    // TODO BH 1334 deduplicate any email and orgEmails that are the same

  return [...remindersNotClaimed]
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

const saveLastReminderSent = async ({ reference, reminderType }, logger) => {
  await updateReminders(reference, reminderType, logger)
}
