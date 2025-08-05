import { buildData } from '../../../../app/data/index.js'
import { getFailedApplicationRedact, createApplicationRedact, updateApplicationRedact } from '../../../../app/repositories/application-redact-repository.js'

jest.mock('../../../../app/data/index.js', () => {
  const mockFindAll = jest.fn()
  const mockCreate = jest.fn()
  const mockUpdate = jest.fn()

  return {
    buildData: {
      models: {
        application_redact: {
          findAll: mockFindAll,
          create: mockCreate,
          update: mockUpdate
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
      const mockData = { retryCount: 2, status: 'COMPLETED', success: 'Y' }
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
  })
})
