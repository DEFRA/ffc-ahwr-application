import { getNotifyConfig } from '../../../../app/config/notify'

describe('Notify Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('Should pass validation for all fields populated, including defaults', async () => {
    delete process.env.NOTIFY_TEMPLATE_ID_FARMER_ENDEMICS_REVIEW_COMPLETE
    delete process.env.NOTIFY_TEMPLATE_ID_FARMER_ENDEMICS_FOLLOWUP_COMPLETE

    expect(getNotifyConfig()).toBeDefined()
  })

  test('env variables override defaults for template Ids', async () => {
    const uuid1 = 'adfca9ea-9046-4990-8617-df82f095a192'
    const uuid2 = '8e1109b7-d1cb-4768-911d-5b8d2ff195d0'
    process.env.NOTIFY_TEMPLATE_ID_FARMER_ENDEMICS_REVIEW_COMPLETE = uuid1
    process.env.NOTIFY_TEMPLATE_ID_FARMER_ENDEMICS_FOLLOWUP_COMPLETE = uuid2

    const { templateIdFarmerEndemicsReviewComplete, templateIdFarmerEndemicsFollowupComplete } = getNotifyConfig()
    expect(templateIdFarmerEndemicsReviewComplete).toBe(uuid1)
    expect(templateIdFarmerEndemicsFollowupComplete).toBe(uuid2)
  })

  test('Invalid env var throws error', () => {
    process.env.CARBON_COPY_EMAIL_ADDRESS = 1
    expect(() => getNotifyConfig()).toThrow('Notify config is invalid. "carbonCopyEmailAddress" must be a string')
  })
})
