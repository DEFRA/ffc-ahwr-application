import { v4 as uuid } from 'uuid'
import { config } from '../../config/index.js'
import { sendMessage } from '../../messaging/send-message.js'
import { getRemindersToSend, updateReminders } from '../../repositories/application-repository.js'

const { messageGeneratorMsgReminderType, messageGeneratorQueue } = config

// START copied from common-lib@3.0.2
const getNextNotClaimedReminderToSend = (previousReminderSent) => {
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
const reminders = Object.freeze({
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
      await saveLastReminderSent(application)
    } catch (error) {
      logger.error({ error }, 'Failed to processed reminders request')
      throw error
    }
  }
  logger.info('Successfully processed reminders request')
}

const getApplicationsDueReminderEmail = async (requestedDate, logger) => {
  const { notClaimed } = reminders

  // TODO BH 1334 implement get apps
  // applicationsWithoutClaimAfterNineMonths
  const notClaimedNineMonths = []
  // applicationsWithoutClaimAfterSixMonths
  const notClaimedSixMonths = await getRemindersToSend(requestedDate, notClaimed.threeMonths)
  // applicationsWithoutClaimAfterThreeMonths
  const notClaimedThreeMonths = []

  // order added to set matters, used to only send latest reminder due for each type
  const remindersNotClaimed = [...new Set([...notClaimedNineMonths, ...notClaimedSixMonths, ...notClaimedThreeMonths])]
    .map((r) => {
      const lastReminder = r.reminders?.split('|').pop()
      const nextReminder = getNextNotClaimedReminderToSend(lastReminder)
      return { ...r, reminderType: nextReminder, reminders: nextReminder }
    })
    // TODO BH 1334 promote to next reminder if within one week

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

const saveLastReminderSent = async ({ reference, reminders }) => {
  updateReminders(reference, reminders)
}
