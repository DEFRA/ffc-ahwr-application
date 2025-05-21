import { createHerd, getHerdById, getHerdsByAppRefAndSpecies, updateIsCurrentHerd } from '../../../../app/repositories/herd-repository'
import { buildData } from '../../../../app/data/index.js'

const { models } = buildData

jest.mock('../../../../app/data/index.js', () => {
  return {
    buildData: {
      models: {
        herd: {
          create: jest.fn(),
          findOne: jest.fn(),
          findAll: jest.fn(),
          update: jest.fn()
        }
      }
    }
  }
})

describe('herdService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createHerd', () => {
    it('should create a new herd', async () => {
      models.herd.create.mockResolvedValueOnce({
        dataValues: {
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          createdAt: '2024-02-14T09:59:46.756Z',
          applicationReference: 'AHWR-0AD3-3322',
          version: 1,
          herdName: 'Sample herd one',
          cph: '43231',
          herdReasons: ['differentBreed', 'separateManagementNeeds'],
          createdBy: 'admin'
        }
      })

      const result = await createHerd({
        version: 1,
        applicationReference: 'AHWR-0AD3-3322',
        herdName: 'Sample herd one',
        cph: '43231',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin'
      })

      expect(buildData.models.herd.create).toHaveBeenCalledWith({
        version: 1,
        applicationReference: 'AHWR-0AD3-3322',
        herdName: 'Sample herd one',
        cph: '43231',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin'
      })
      expect(result).toEqual({
        dataValues: {
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          createdAt: '2024-02-14T09:59:46.756Z',
          applicationReference: 'AHWR-0AD3-3322',
          version: 1,
          herdName: 'Sample herd one',
          cph: '43231',
          herdReasons: ['differentBreed', 'separateManagementNeeds'],
          createdBy: 'admin'
        }
      })
    })
  })

  describe('getHerdById', () => {
    it('should return a herd by id', async () => {
      models.herd.findOne.mockResolvedValueOnce({
        dataValues: {
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          createdAt: '2024-02-14T09:59:46.756Z',
          applicationReference: 'AHWR-0AD3-3322',
          version: 1,
          herdName: 'Sample herd one',
          cph: '43200',
          herdReasons: ['separateManagementNeeds'],
          createdBy: 'admin'
        }
      })

      const result = await getHerdById(1)

      expect(buildData.models.herd.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
      expect(result).toEqual({
        dataValues: {
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          createdAt: '2024-02-14T09:59:46.756Z',
          applicationReference: 'AHWR-0AD3-3322',
          version: 1,
          herdName: 'Sample herd one',
          cph: '43200',
          herdReasons: ['separateManagementNeeds'],
          createdBy: 'admin'
        }
      })
    })
  })

  describe('updateIsCurrentHerd', () => {
    it('should update isCurrent field of a herd', async () => {
      models.herd.update.mockResolvedValue([1])

      const result = await updateIsCurrentHerd(1, false, 2)

      expect(buildData.models.herd.update).toHaveBeenCalledWith(
        { isCurrent: false },
        { where: { id: 1, version: 2 } }
      )
      expect(result).toEqual([1])
    })
  })

  describe('getHerdsByAppRefAndSpecies', () => {
    it('should query herds with correct parameters and return results', async () => {
      const mockResult = [
        {
          dataValues: {
            id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
            createdAt: '2024-02-14T09:59:46.756Z',
            applicationReference: 'AHWR-0AD3-3322',
            version: 1,
            herdName: 'Sample herd one',
            cph: '43200',
            herdReasons: ['separateManagementNeeds'],
            createdBy: 'admin'
          }
        },
        {
          dataValues: {
            id: '1a2d4a26-6a25-4f5b-882e-e18587ba9f4b',
            createdAt: '2024-02-14T09:59:46.756Z',
            applicationReference: 'AHWR-0AD3-3322',
            version: 1,
            herdName: 'Sample herd two',
            cph: '12321',
            herdReasons: ['separateManagementNeeds'],
            createdBy: 'admin'
          }
        }
      ]
      models.herd.findAll.mockResolvedValueOnce(mockResult)

      const result = await getHerdsByAppRefAndSpecies('AHWR-0AD3-3322', 'sheep')

      expect(buildData.models.herd.findAll).toHaveBeenCalledWith({ where: { applicationReference: 'AHWR-0AD3-3322', species: 'sheep', isCurrent: true } })
      expect(result).toEqual(mockResult)
    })
  })
})
