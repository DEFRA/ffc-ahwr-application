import { buildData } from '../../../../app/data'
import { createFlag, deleteFlag, getAllFlags, getFlagByAppRef, getFlagsForApplication } from '../../../../app/repositories/flag-repository'

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

    expect(models.flag.update).toHaveBeenCalledWith({ deletedAt: expect.any(Date), deletedBy: undefined }, { where: { id: flagId } })
  })

  test('getAllFlags', async () => {
    await getAllFlags()

    expect(models.flag.findAll).toHaveBeenCalledWith({ where: { deletedAt: null, deletedBy: null } })
  })
})
