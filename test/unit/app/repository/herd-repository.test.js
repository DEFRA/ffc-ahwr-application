import { createHerd, getHerdById, getHerdsByAppRefAndLivestock, updateIsCurrentHerd } from '../../../../app/repositories/herd-repository'
import { buildData } from '../../../../app/data/index.js'
import { QueryTypes } from 'sequelize'

const { models, sequelize } = buildData

jest.mock('../../../../app/data/index.js', () => {
  return {
    buildData: {
      models: {
        herd: {
          create: jest.fn(),
          findOne: jest.fn(),
          update: jest.fn()
        }
      },
      sequelize: {
        query: jest.fn()
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

      const result = await updateIsCurrentHerd(1, false)

      expect(buildData.models.herd.update).toHaveBeenCalledWith(
        { isCurrent: false },
        { where: { id: 1 } }
      )
      expect(result).toEqual([1])
    })
  })

  describe('getHerdsByAppRefAndLivestock', () => {
    it('should query herds with correct parameters and return results', async () => {
      const mockResult = [
        {
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          createdAt: '2024-02-14T09:59:46.756Z',
          applicationReference: 'AHWR-0AD3-3322',
          version: 1,
          herdName: 'Sample herd one',
          cph: '43231',
          herdReasons: ['differentBreed', 'separateManagementNeeds'],
          createdBy: 'admin'
        },
        {
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          createdAt: '2024-02-14T09:59:46.756Z',
          applicationReference: 'AHWR-0AD3-3322',
          version: 1,
          herdName: 'Sample herd two',
          cph: '12321',
          herdReasons: ['separateManagementNeeds'],
          createdBy: 'admin'
        }
      ]
      sequelize.query.mockResolvedValueOnce(mockResult)

      const result = await getHerdsByAppRefAndLivestock('AHWR-0AD3-3322', 'sheep')

      expect(sequelize.query).toHaveBeenCalledWith(
        `SELECT DISTINCT h.*
     FROM herd h
     LEFT JOIN claim c ON c.data->>'herdId' = h.id::text
     WHERE h."applicationReference" = :applicationReference
     AND c.data->>'typeOfLivestock' = :typeOfLivestock`,
        {
          replacements: {
            applicationReference: 'AHWR-0AD3-3322',
            typeOfLivestock: 'sheep'
          },
          type: QueryTypes.SELECT,
          model: models.herd,
          mapToModel: true
        }
      )
      expect(result).toEqual(mockResult)
    })
  })
})
