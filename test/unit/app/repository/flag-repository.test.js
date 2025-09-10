import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { buildData } from '../../../../app/data'
import { createFlag, deleteFlag, getAllFlags, getFlagByAppRef, getFlagsForApplication, getFlagsForApplicationIncludingDeleted, redactPII, createFlagForRedactPII } from '../../../../app/repositories/flag-repository'

const { models } = buildData

models.flag.create = jest.fn()
models.flag.findOne = jest.fn()
models.flag.findAll = jest.fn().mockResolvedValue([{
  dataValues: {
    applicationReference: 'IAHW-U6ZE-5R5E',
    sbi: '123456789',
    note: 'Flag this please',
    createdBy: 'Rob',
    createdAt: '2025-04-09T11:59:54.075Z',
    appliesToMh: false,
    deletedAt: null,
    deletedBy: null
  }
}])
models.flag.update = jest.fn()

describe('Flag Repository tests', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('createFlag', async () => {
    const flag = {
      applicationReference: 'IAHW-U6ZE-5R5E',
      sbi: '123456789',
      note: 'Flag this please',
      createdBy: 'Rob',
      createdAt: '2025-04-09T11:59:54.075Z',
      appliesToMh: false,
      deletedAt: null,
      deletedBy: null
    }

    await createFlag(flag)

    expect(models.flag.create).toHaveBeenCalledWith(flag)
  })

  test('getFlagByAppRef', async () => {
    const appRef = 'IAHW-U6ZE-5R5E'

    await getFlagByAppRef(appRef, true)

    expect(models.flag.findOne).toHaveBeenCalledWith({ where: { applicationReference: appRef, deletedAt: null, deletedBy: null, appliesToMh: true } })
  })

  test('getFlagsForApplication', async () => {
    const appRef = 'IAHW-U6ZE-5R5E'

    const result = await getFlagsForApplication(appRef)

    expect(models.flag.findAll).toHaveBeenCalledWith({ where: { applicationReference: appRef, deletedAt: null, deletedBy: null } })
    expect(result).toEqual([{
      applicationReference: 'IAHW-U6ZE-5R5E',
      sbi: '123456789',
      note: 'Flag this please',
      createdBy: 'Rob',
      createdAt: '2025-04-09T11:59:54.075Z',
      appliesToMh: false,
      deletedAt: null,
      deletedBy: null
    }])
  })

  test('deleteFlag', async () => {
    const flagId = 'abc123'

    await deleteFlag(flagId)

    expect(models.flag.update).toHaveBeenCalledWith({ deletedAt: expect.any(Date), deletedBy: undefined }, { where: { id: flagId }, returning: true })
  })

  test('getAllFlags', async () => {
    await getAllFlags()

    expect(models.flag.findAll).toHaveBeenCalledWith(
      {
        where: { deletedAt: null, deletedBy: null },
        include: [
          {
            model: models.application_redact,
            as: 'applicationRedacts',
            attributes: ['success'],
            where: {
              success: 'Y'
            },
            required: false
          }
        ]
      }
    )
  })

  test('getFlagsForApplicationIncludingDeleted', async () => {
    await getFlagsForApplicationIncludingDeleted('IAHW-1234-ABCD')

    expect(models.flag.findAll).toHaveBeenCalledWith({ where: { applicationReference: 'IAHW-1234-ABCD' } })
  })

  test('redactPII, should redact flag PII', async () => {
    await redactPII('IAHW-FAK3-FAK3')

    expect(buildData.models.flag.update).toHaveBeenCalledWith({
      note: `${REDACT_PII_VALUES.REDACTED_NOTE}`,
      updatedBy: 'admin',
      updatedAt: expect.any(Number)
    },
    {
      where: {
        applicationReference: 'IAHW-FAK3-FAK3',
        note: expect.any(Object)
      }
    })
  })

  test('createFlagForRedactPII, should only create flag when no appliesToMh=false flag', async () => {
    models.flag.findOne = jest.fn().mockResolvedValueOnce({})
    const data = {
      applicationReference: 'IAHW-FAK3-FAK3',
      sbi: '12345678',
      note: 'Application PII redacted',
      createdBy: 'admin',
      appliesToMh: false
    }

    await createFlagForRedactPII(data)

    expect(models.flag.findOne).toHaveBeenCalledWith({
      where: { applicationReference: data.applicationReference, deletedAt: null, deletedBy: null, appliesToMh: false }
    })
    expect(models.flag.create).toHaveBeenCalledWith(data)
  })

  test('createFlagForRedactPII, should delete existing flag and create a new one when there is appliesToMh=false flag', async () => {
    models.flag.findOne = jest.fn().mockResolvedValueOnce({
      id: 'fake-id-1',
      applicationReference: 'IAHW-FAK3-FAK3',
      sbi: '12345678',
      note: 'Fake existing flag to be deleted',
      createdBy: 'admin',
      appliesToMh: false
    })
    const data = {
      applicationReference: 'IAHW-FAK3-FAK3',
      sbi: '12345678',
      note: 'Application PII redacted',
      createdBy: 'admin',
      appliesToMh: false
    }

    await createFlagForRedactPII(data)

    expect(models.flag.findOne).toHaveBeenCalledWith({
      where: { applicationReference: data.applicationReference, deletedAt: null, deletedBy: null, appliesToMh: false }
    })
    expect(models.flag.update).toHaveBeenCalledWith(
      { deletedAt: expect.any(Date), deletedBy: 'admin', deletedNote: 'Deleted to allow \'Redact PII\' flag to be added, only one flag with appliesToMh=false allowed.' },
      { where: { id: 'fake-id-1' }, returning: true }
    )
    expect(models.flag.create).toHaveBeenCalledWith(data)
  })
})
