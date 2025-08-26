import { TYPE_OF_LIVESTOCK } from 'ffc-ahwr-common-library'
import { isMultipleHerdsUserJourney } from '../../../../../../app/lib/context-helper.js'
import {
  generateEventsAndComms,
  saveClaimAndRelatedData
} from '../../../../../../app/processing/claim/ahwr/processor.js'
import { getAmount } from '../../../../../../app/lib/getAmount.js'
import appInsights from 'applicationinsights'
import { sendMessage } from '../../../../../../app/messaging/send-message.js'
import { emitHerdMIEvents } from '../../../../../../app/lib/emit-herd-MI-events.js'
import {
  addHerdToClaimData,
  getByApplicationReference,
  setClaim
} from '../../../../../../app/repositories/claim-repository.js'
import { buildData } from '../../../../../../app/data/index.js'
import { generateClaimStatus } from '../../../../../../app/lib/requires-compliance-check.js'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../../../../../app/repositories/herd-repository.js'

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../../app/lib/context-helper.js')
jest.mock('../../../../../../app/lib/getAmount.js')
jest.mock('../../../../../../app/lib/requires-compliance-check.js')
jest.mock('../../../../../../app/messaging/send-message.js')
jest.mock('../../../../../../app/lib/emit-herd-MI-events.js')
jest.mock('../../../../../../app/repositories/claim-repository.js')
jest.mock('../../../../../../app/repositories/herd-repository.js')

const mockLogger = { info: jest.fn() }

describe('AHWR Claim Processor Tests', () => {
  const application = {
    reference: 'IAHW-0F5D-4A26',
    data: {
      organisation: {
        email: 'test@test-unit.com',
        farmerName: 'farmerName',
        name: 'orgName',
        orgEmail: 'test@test-unit.org',
        sbi: '106705779',
        crn: '1234567890'
      }
    },
    createdBy: 'admin'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  describe('saveClaimAndRelatedData', () => {
    const sbi = '1234567890'
    const dateOfVisit = new Date()
    const flags = []
    const inputHerd = {
      herdName: 'Beefers',
      herdVersion: 1,
      cph: '12/345/6789',
      herdReasons: ['onlyHerd'],
      herdSame: 'no'
    }

    const claimData = {
      incoming: {
        data: {
          applicationReference: 'APP123',
          typeOfLivestock: TYPE_OF_LIVESTOCK.BEEF,
          dateOfVisit,
          laboratoryURN: 'ABC12333',
          vetsName: 'Geoff',
          vetRCVSNumber: '1234567',
          herd: inputHerd
        },
        type: 'R',
        reference: 'TEMP-1234-5678',
        applicationReference: 'IAHW-4321-5678',
        createdBy: 'Aaron'
      },
      claimReference: 'REBC-1234-5678'
    }

    beforeEach(() => {
      getAmount.mockResolvedValueOnce(200)
      isMultipleHerdsUserJourney.mockReturnValueOnce(true)
      generateClaimStatus.mockResolvedValueOnce(11)
      // For these tests we don;t care what the DB returns for the claim, just that we return whatever it does return
      setClaim.mockResolvedValueOnce({
        dummy: 'dummyDbValue'
      })
      jest.spyOn(buildData.sequelize, 'transaction').mockImplementation(async (callback) => {
        return await callback()
      })
    })

    it('should save multi-herd claim with brand new herd to the database and return claim info', async () => {
      const flags = [{ id: '1' }]
      createHerd.mockResolvedValueOnce({
        dataValues: {
          ...inputHerd,
          version: 1,
          id: 'herd1'
        }
      })
      getByApplicationReference.mockResolvedValueOnce([{ id: 'oldclaim1' }])

      const {
        claim,
        herdGotUpdated,
        herdData,
        isMultiHerdsClaim
      } = await saveClaimAndRelatedData(sbi, claimData, flags, mockLogger)
      expect(claim).toEqual({
        dummy: 'dummyDbValue'
      })
      expect(herdGotUpdated).toBeTruthy()
      expect(herdData).toEqual({
        ...inputHerd,
        version: 1,
        id: 'herd1'
      })
      expect(isMultiHerdsClaim).toBe(true)
      expect(setClaim).toHaveBeenCalledWith({
        applicationReference: 'IAHW-4321-5678',
        data: {
          amount: 200,
          applicationReference: 'APP123',
          claimType: 'R',
          dateOfVisit,
          laboratoryURN: 'ABC12333',
          typeOfLivestock: 'beef',
          vetRCVSNumber: '1234567',
          vetsName: 'Geoff',
          herdAssociatedAt: expect.any(String),
          herdId: 'herd1',
          herdVersion: 1
        },
        reference: 'REBC-1234-5678',
        sbi: '1234567890',
        statusId: 11,
        type: 'R',
        createdBy: 'Aaron'
      })

      expect(isMultipleHerdsUserJourney).toHaveBeenCalledWith(dateOfVisit, flags)
      expect(getByApplicationReference).toHaveBeenCalledWith('IAHW-4321-5678', 'beef')
      expect(generateClaimStatus).toHaveBeenCalledWith(dateOfVisit, 'herd1', [{ id: 'oldclaim1' }], mockLogger)
    })

    it('should save multi-herd claim with brand new herd and associate with past claims with no herd', async () => {
      const inputHerdWithSame = {
        ...inputHerd,
        herdSame: 'yes'
      }
      const claimDataToUse = {
        ...claimData,
        incoming: {
          ...claimData.incoming,
          data: {
            ...claimData.incoming.data,
            herd: inputHerdWithSame
          }
        }
      }

      createHerd.mockResolvedValueOnce({
        dataValues: {
          ...inputHerd,
          version: 1,
          id: 'herd1'
        }
      })
      getByApplicationReference.mockResolvedValueOnce([
        { reference: 'oldclaim1', data: {} },
        { reference: 'oldclaim2', data: {} },
        { reference: 'oldclaim3', data: { herdId: 'herd2' } }
      ])

      const { herdGotUpdated } = await saveClaimAndRelatedData(sbi, claimDataToUse, flags, mockLogger)

      expect(herdGotUpdated).toBeTruthy()
      expect(setClaim).toHaveBeenCalledWith({
        applicationReference: 'IAHW-4321-5678',
        data: {
          amount: 200,
          applicationReference: 'APP123',
          claimType: 'R',
          dateOfVisit,
          laboratoryURN: 'ABC12333',
          typeOfLivestock: 'beef',
          vetRCVSNumber: '1234567',
          vetsName: 'Geoff',
          herdAssociatedAt: expect.any(String),
          herdId: 'herd1',
          herdVersion: 1
        },
        reference: 'REBC-1234-5678',
        sbi: '1234567890',
        statusId: 11,
        type: 'R',
        createdBy: 'Aaron'
      })

      expect(addHerdToClaimData).toHaveBeenCalledTimes(2)
      expect(addHerdToClaimData).toHaveBeenCalledWith({
        applicationReference: 'IAHW-4321-5678',
        claimRef: 'oldclaim1',
        createdBy: 'Aaron',
        herdClaimData: {
          herdAssociatedAt: expect.any(String),
          herdId: 'herd1',
          herdName: 'Beefers',
          herdVersion: 1
        },
        sbi: '1234567890'
      })
      expect(addHerdToClaimData).toHaveBeenCalledWith({
        applicationReference: 'IAHW-4321-5678',
        claimRef: 'oldclaim2',
        createdBy: 'Aaron',
        herdClaimData: {
          herdAssociatedAt: expect.any(String),
          herdId: 'herd1',
          herdName: 'Beefers',
          herdVersion: 1
        },
        sbi: '1234567890'
      })
    })

    it('should save multi-herd claim with updated herd to the database and return claim info', async () => {
      const updatedInputHerd = {
        herdId: 'herd1',
        herdVersion: 2,
        cph: '12/345/9999',
        herdReasons: ['differentBreed', 'differentPurpose'],
        herdSame: 'no'
      }

      const claimDataToUse = {
        ...claimData,
        incoming: {
          ...claimData.incoming,
          data: {
            ...claimData.incoming.data,
            herd: updatedInputHerd
          }
        }
      }

      getHerdById.mockResolvedValueOnce({
        dataValues: {
          id: 'herd1',
          createdAt: '2024-02-14T09:59:46.756Z',
          applicationReference: 'IAHW-4321-5678',
          species: 'beef',
          version: 1,
          herdName: 'Sample herd one',
          cph: '12/345/8888',
          herdReasons: ['differentBreed'],
          isCurrent: true,
          createdBy: 'admin'
        }
      })
      createHerd.mockResolvedValueOnce({
        dataValues: {
          ...updatedInputHerd,
          herdName: 'Sample herd one',
          species: 'beef',
          version: 2,
          id: 'herd1'
        }
      })

      const {
        herdGotUpdated,
        herdData,
        isMultiHerdsClaim
      } = await saveClaimAndRelatedData(sbi, claimDataToUse, flags, mockLogger)

      expect(herdGotUpdated).toBeTruthy()
      expect(herdData).toEqual({
        ...updatedInputHerd,
        herdName: 'Sample herd one',
        species: 'beef',
        version: 2,
        id: 'herd1'
      })
      expect(isMultiHerdsClaim).toBe(true)

      expect(setClaim).toHaveBeenCalledWith({
        applicationReference: 'IAHW-4321-5678',
        data: {
          amount: 200,
          applicationReference: 'APP123',
          claimType: 'R',
          dateOfVisit,
          laboratoryURN: 'ABC12333',
          typeOfLivestock: 'beef',
          vetRCVSNumber: '1234567',
          vetsName: 'Geoff',
          herdAssociatedAt: expect.any(String),
          herdId: 'herd1',
          herdVersion: 2
        },
        reference: 'REBC-1234-5678',
        sbi: '1234567890',
        statusId: 11,
        type: 'R',
        createdBy: 'Aaron'
      })

      expect(createHerd).toHaveBeenCalledWith({
        applicationReference: 'IAHW-4321-5678',
        cph: '12/345/9999',
        createdBy: 'Aaron',
        herdName: 'Sample herd one',
        herdReasons: ['differentBreed', 'differentPurpose'],
        id: 'herd1',
        species: 'beef',
        version: 2
      })

      expect(updateIsCurrentHerd).toHaveBeenCalledWith('herd1', false, 1)
    })

    it('should save multi-herd claim with reused, unchanged herd to the database and return claim info', async () => {
      const unchangingHerd = {
        herdId: 'herd1',
        herdVersion: 2,
        cph: '12/345/8888',
        herdReasons: ['differentBreed'],
        herdSame: 'no'
      }
      const claimDataToUse = {
        ...claimData,
        incoming: {
          ...claimData.incoming,
          data: {
            ...claimData.incoming.data,
            herd: unchangingHerd
          }
        }
      }

      const databaseHerd = {
        id: 'herd1',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'IAHW-4321-5678',
        species: 'beef',
        version: 1,
        herdName: 'Sample herd one',
        cph: '12/345/8888',
        herdReasons: ['differentBreed'],
        isCurrent: true,
        createdBy: 'admin'
      }
      getHerdById.mockResolvedValueOnce({
        dataValues: {
          ...databaseHerd
        }
      })

      const {
        herdGotUpdated,
        herdData,
        isMultiHerdsClaim
      } = await saveClaimAndRelatedData(sbi, claimDataToUse, flags, mockLogger)

      expect(herdGotUpdated).toBeFalsy()
      expect(herdData).toEqual(databaseHerd)
      expect(isMultiHerdsClaim).toBe(true)

      expect(setClaim).toHaveBeenCalledWith({
        applicationReference: 'IAHW-4321-5678',
        data: {
          amount: 200,
          applicationReference: 'APP123',
          claimType: 'R',
          dateOfVisit,
          laboratoryURN: 'ABC12333',
          typeOfLivestock: 'beef',
          vetRCVSNumber: '1234567',
          vetsName: 'Geoff',
          herdAssociatedAt: expect.any(String),
          herdId: 'herd1',
          herdVersion: 1
        },
        reference: 'REBC-1234-5678',
        sbi: '1234567890',
        statusId: 11,
        type: 'R',
        createdBy: 'Aaron'
      })

      expect(createHerd).toHaveBeenCalledTimes(0)
      expect(updateIsCurrentHerd).toHaveBeenCalledTimes(0)
    })

    it('should save non multi-herd claim to the database and return claim info', async () => {
      isMultipleHerdsUserJourney.mockRestore()
      isMultipleHerdsUserJourney.mockReturnValueOnce(false)

      const claimData = {
        incoming: {
          data: {
            applicationReference: 'APP123',
            typeOfLivestock: TYPE_OF_LIVESTOCK.BEEF,
            dateOfVisit,
            laboratoryURN: 'ABC12333',
            vetsName: 'Geoff',
            vetRCVSNumber: '1234567'
          },
          type: 'R',
          reference: 'TEMP-1234-5678',
          applicationReference: 'IAHW-4321-5678'
        },
        claimReference: 'REBC-1234-5678'
      }

      const {
        herdGotUpdated,
        herdData,
        isMultiHerdsClaim
      } = await saveClaimAndRelatedData(sbi, claimData, flags, mockLogger)

      expect(herdGotUpdated).toBeUndefined()
      expect(herdData).toEqual({})
      expect(isMultiHerdsClaim).toBe(false)
      expect(setClaim).toHaveBeenCalledWith({
        applicationReference: 'IAHW-4321-5678',
        data: {
          amount: 200,
          applicationReference: 'APP123',
          claimType: 'R',
          dateOfVisit,
          laboratoryURN: 'ABC12333',
          typeOfLivestock: 'beef',
          vetRCVSNumber: '1234567',
          vetsName: 'Geoff'
        },
        reference: 'REBC-1234-5678',
        sbi: '1234567890',
        statusId: 11,
        type: 'R'
      })
    })

    it('error is thrown when trying to update a herd that is not found', async () => {
      const versionTwoHerd = {
        ...inputHerd,
        herdVersion: 2
      }
      const claimDataToUse = {
        ...claimData,
        incoming: {
          ...claimData.incoming,
          data: {
            ...claimData.incoming.data,
            herd: versionTwoHerd
          }
        }
      }

      getHerdById.mockResolvedValueOnce(undefined)

      expect(saveClaimAndRelatedData(sbi, claimDataToUse, flags, mockLogger)).rejects.toThrow('Herd not found')

      expect(createHerd).toHaveBeenCalledTimes(0)
      expect(setClaim).toHaveBeenCalledTimes(0)
    })

    it('error is thrown when trying to update a herd that is not current', async () => {
      const versionTwoHerd = {
        ...inputHerd,
        herdVersion: 2
      }
      const claimDataToUse = {
        ...claimData,
        incoming: {
          ...claimData.incoming,
          data: {
            ...claimData.incoming.data,
            herd: versionTwoHerd
          }
        }
      }

      getHerdById.mockResolvedValueOnce({ dataValues: { isCurrent: false } })

      expect(saveClaimAndRelatedData(sbi, claimDataToUse, flags, mockLogger)).rejects.toThrow('Attempting to update an older version of a herd')

      expect(createHerd).toHaveBeenCalledTimes(0)
      expect(setClaim).toHaveBeenCalledTimes(0)
    })

    it('error is thrown when trying to update a herd at same version as current', async () => {
      const versionTwoHerd = {
        ...inputHerd,
        herdVersion: 2
      }
      const claimDataToUse = {
        ...claimData,
        incoming: {
          ...claimData.incoming,
          data: {
            ...claimData.incoming.data,
            herd: versionTwoHerd
          }
        }
      }

      getHerdById.mockResolvedValueOnce({ dataValues: { isCurrent: true, version: 2 } })

      expect(saveClaimAndRelatedData(sbi, claimDataToUse, flags, mockLogger)).rejects.toThrow('Attempting to update a herd with the same version')

      expect(createHerd).toHaveBeenCalledTimes(0)
      expect(setClaim).toHaveBeenCalledTimes(0)
    })
  })

  describe('generateEventsAndComms', () => {
    function expectAppInsightsEventRaised (data, reference, statusId, sbi) {
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
        name: 'process-claim',
        properties: {
          data,
          reference,
          status: statusId,
          sbi,
          scheme: 'new-world'
        }
      })
    }

    it('should emit herd events and emit status change message as expected for multi-herd claim (herd)', async () => {
      const herdData = {
        id: '1234567890',
        version: 1,
        herdName: 'Beefers',
        herdReasons: ['onlyHerd'],
        cph: '12/345/6789',
        species: TYPE_OF_LIVESTOCK.BEEF,
        applicationReference: 'IAHW-0F5D-4A26',
        createdBy: 'admin'
      }
      const claim = {
        reference: 'FUBC-ABCS-1287',
        applicationReference: 'IAHW-0F5D-4A26',
        data: {
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          reviewTestResults: 'positive',
          typeOfLivestock: TYPE_OF_LIVESTOCK.BEEF,
          amount: 100,
          herdId: '1234567890',
          herdVersion: 1,
          herdAssociatedAt: '2024-01-22T00:00:00.000Z',
          piHunt: 'yes',
          piHuntAllAnimals: 'yes',
          piHuntRecommended: 'yes'
        },
        statusId: 11,
        type: 'E'
      }

      await generateEventsAndComms(true, claim, application, herdData, true, '1234567890')

      expect(emitHerdMIEvents).toHaveBeenCalledWith({
        applicationReference: 'IAHW-0F5D-4A26',
        claimReference: 'FUBC-ABCS-1287',
        herdData: {
          applicationReference: 'IAHW-0F5D-4A26',
          cph: '12/345/6789',
          createdBy: 'admin',
          herdName: 'Beefers',
          herdReasons: ['onlyHerd'],
          id: '1234567890',
          species: 'beef',
          version: 1
        },
        herdGotUpdated: true,
        herdIdSelected: '1234567890',
        sbi: '106705779'
      })

      expectAppInsightsEventRaised({
        applicationReference: 'IAHW-0F5D-4A26',
        typeOfLivestock: 'beef',
        dateOfVisit: '2024-01-22T00:00:00.000Z',
        claimType: 'E',
        piHunt: 'yes'
      }, 'FUBC-ABCS-1287', 11, '106705779')

      expect(sendMessage).toHaveBeenCalledWith({
        agreementReference: 'IAHW-0F5D-4A26',
        claimReference: 'FUBC-ABCS-1287',
        claimStatus: 11,
        claimType: 'E',
        claimAmount: 100,
        crn: '1234567890',
        dateTime: expect.any(Date),
        herdName: 'Beefers',
        piHuntAllAnimals: 'yes',
        piHuntRecommended: 'yes',
        reviewTestResults: 'positive',
        sbi: '106705779',
        typeOfLivestock: 'beef'
      },
      'uk.gov.ffc.ahwr.claim.status.update',
      expect.anything(),
      { sessionId: expect.any(String) })
    })

    it('should emit herd events and emit status change message as expected for multi-herd claim (flock)', async () => {
      const herdData = {
        id: '1234567890',
        version: 1,
        herdName: 'Sheepies',
        herdReasons: ['onlyHerd'],
        cph: '12/345/6789',
        species: TYPE_OF_LIVESTOCK.SHEEP,
        applicationReference: 'IAHW-0F5D-4A26',
        createdBy: 'admin'
      }
      const claim = {
        reference: 'FUSH-ABCS-1287',
        applicationReference: 'IAHW-0F5D-4A26',
        data: {
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          reviewTestResults: 'positive',
          typeOfLivestock: TYPE_OF_LIVESTOCK.SHEEP,
          amount: 100,
          herdId: '1234567890',
          herdVersion: 1,
          herdAssociatedAt: '2024-01-22T00:00:00.000Z'
        },
        statusId: 11,
        type: 'E'
      }

      await generateEventsAndComms(true, claim, application, herdData, true, '1234567890a')

      expect(emitHerdMIEvents).toHaveBeenCalledWith({
        applicationReference: 'IAHW-0F5D-4A26',
        claimReference: 'FUSH-ABCS-1287',
        herdData: {
          applicationReference: 'IAHW-0F5D-4A26',
          cph: '12/345/6789',
          createdBy: 'admin',
          herdName: 'Sheepies',
          herdReasons: ['onlyHerd'],
          id: '1234567890',
          species: 'sheep',
          version: 1
        },
        herdGotUpdated: true,
        herdIdSelected: '1234567890a',
        sbi: '106705779'
      })

      expectAppInsightsEventRaised({
        applicationReference: 'IAHW-0F5D-4A26',
        typeOfLivestock: 'sheep',
        dateOfVisit: '2024-01-22T00:00:00.000Z',
        claimType: 'E',
        piHunt: undefined
      }, 'FUSH-ABCS-1287', 11, '106705779')

      expect(sendMessage).toHaveBeenCalledWith({
        agreementReference: 'IAHW-0F5D-4A26',
        claimReference: 'FUSH-ABCS-1287',
        claimStatus: 11,
        claimType: 'E',
        claimAmount: 100,
        crn: '1234567890',
        dateTime: expect.any(Date),
        herdName: 'Sheepies',
        piHuntAllAnimals: undefined,
        piHuntRecommended: undefined,
        reviewTestResults: 'positive',
        sbi: '106705779',
        typeOfLivestock: 'sheep'
      },
      'uk.gov.ffc.ahwr.claim.status.update',
      expect.anything(),
      { sessionId: expect.any(String) })
    })

    it('should emit status change message as expected for non multi-herd claim', async () => {
      const claim = {
        reference: 'REDC-ABCS-1287',
        applicationReference: 'IAHW-0F5D-4A26',
        data: {
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfLivestock: TYPE_OF_LIVESTOCK.DAIRY,
          amount: 100
        },
        statusId: 11,
        type: 'R'
      }

      await generateEventsAndComms(false, claim, application, {}, undefined, undefined)

      expectAppInsightsEventRaised({
        applicationReference: 'IAHW-0F5D-4A26',
        typeOfLivestock: 'dairy',
        dateOfVisit: '2024-01-22T00:00:00.000Z',
        claimType: 'R',
        piHunt: undefined
      }, 'REDC-ABCS-1287', 11, '106705779')

      expect(sendMessage).toHaveBeenCalledWith({
        agreementReference: 'IAHW-0F5D-4A26',
        claimReference: 'REDC-ABCS-1287',
        claimStatus: 11,
        claimType: 'R',
        claimAmount: 100,
        crn: '1234567890',
        dateTime: expect.any(Date),
        herdName: 'Unnamed herd',
        piHuntAllAnimals: undefined,
        piHuntRecommended: undefined,
        reviewTestResults: undefined,
        sbi: '106705779',
        typeOfLivestock: 'dairy'
      },
      'uk.gov.ffc.ahwr.claim.status.update',
      expect.anything(),
      { sessionId: expect.any(String) })
    })
  })
})
