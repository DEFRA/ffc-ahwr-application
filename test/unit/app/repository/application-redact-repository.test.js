import { Sequelize } from 'sequelize'
import { buildData } from '../../../../app/data/index.js'
import { getFailedApplicationRedact, createApplicationRedact, updateApplicationRedact, generateRandomUniqueSBI } from '../../../../app/repositories/application-redact-repository.js'

jest.mock('../../../../app/data/index.js', () => {
  const mockFindAll = jest.fn()
  const mockCreate = jest.fn()
  const mockUpdate = jest.fn()
  const mockFindOne = jest.fn()

  return {
    buildData: {
      models: {
        application_redact: {
          findAll: mockFindAll,
          create: mockCreate,
          update: mockUpdate,
          findOne: mockFindOne
        }
      }
    }
  }
})

const { models } = buildData

describe('application-redact-repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFailedApplicationRedact', () => {
    it('should return failed application redacts for a given date', async () => {
      const mockData = [{ id: 1, requestedDate: '2025-08-05', success: 'N' }]
      models.application_redact.findAll.mockResolvedValue(mockData)

      const result = await getFailedApplicationRedact('2025-08-05')

      expect(models.application_redact.findAll).toHaveBeenCalledWith({
        where: { requestedDate: '2025-08-05', success: 'N' }
      })
      expect(result).toEqual(mockData)
    })
  })

  describe('createApplicationRedact', () => {
    it('should create a new application redact', async () => {
      const data = { requestedDate: '2025-08-05', success: 'Y' }
      const mockCreateResult = { id: 2, ...data }
      models.application_redact.create.mockResolvedValue(mockCreateResult)

      const result = await createApplicationRedact(data)

      expect(models.application_redact.create).toHaveBeenCalledWith(data)
      expect(result).toEqual(mockCreateResult)
    })
  })

  describe('updateApplicationRedact', () => {
    it('should update an application redact by id and return updated rows', async () => {
      const mockId = 3
      const mockData = { retryCount: 2, status: [], success: 'N' }
      const mockUpdatedRecord = { id: mockId, ...mockData }
      const mockResponse = [1, [mockUpdatedRecord]]

      models.application_redact.update.mockResolvedValue(mockResponse)

      const result = await updateApplicationRedact(mockId, mockData.retryCount, mockData.status, mockData.success)

      expect(models.application_redact.update).toHaveBeenCalledWith(
        {
          retryCount: mockData.retryCount,
          status: mockData.status,
          success: mockData.success
        },
        { where: { id: mockId }, returning: true }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should update an application redact with redactedSbi and return updated rows', async () => {
      const mockId = 3
      const mockData = { retryCount: 2, status: [], success: 'N' }
      const mockUpdatedRecord = { id: mockId, ...mockData }
      const mockResponse = [1, [mockUpdatedRecord]]

      models.application_redact.update.mockResolvedValue(mockResponse)

      const result = await updateApplicationRedact(mockId, mockData.retryCount, mockData.status, mockData.success, '10583957', {})

      expect(models.application_redact.update).toHaveBeenCalledWith(
        {
          retryCount: mockData.retryCount,
          status: mockData.status,
          success: mockData.success,
          data: Sequelize.literal(
            'jsonb_set("data", \'{sbi}\', \'"10583957"\')'
          )
        },
        { where: { id: mockId }, returning: true }
      )
      expect(result).toEqual(mockResponse)
    })
  })
})

describe('generateRandomUniqueSBI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should generate a random unique SBI on first attempt when it does not already exist', async () => {
    models.application_redact.findOne.mockResolvedValueOnce(null)

    const result = await generateRandomUniqueSBI()

    expect(models.application_redact.findOne).toHaveBeenCalledTimes(1)
    expect(models.application_redact.findOne).toHaveBeenCalledWith({
      where: {
        redactedSbi: expect.any(String)
      }
    })
    expect(result.length).toEqual(10)
  })

  it('should generate a random unique SBI on second attempt when first attempt already exists', async () => {
    models.application_redact.findOne.mockResolvedValueOnce({
      id: 1,
      sbi: 123
    })
    models.application_redact.findOne.mockResolvedValueOnce(null)

    const result = await generateRandomUniqueSBI()

    expect(models.application_redact.findOne).toHaveBeenCalledTimes(2)
    expect(result.length).toEqual(10)
  })
})
