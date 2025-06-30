import { emitHerdMIEvents } from '../../../../app/lib/emit-herd-MI-events'
import { randomUUID } from 'node:crypto'
import { raiseHerdEvent } from '../../../../app/event-publisher'

jest.mock('../../../../app/event-publisher')

describe('emitHerdMIEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('it always sends the herd associated with claim event', async () => {
    const sbi = 111222
    const herdData = { id: 'this-is-the-herd-id', version: 2 }
    const tempHerdId = randomUUID()
    const herdGotUpdated = false
    const claimReference = 'REBC-AA11-33FF'
    const applicationReference = 'IAHW-EE33-44JJ'

    await emitHerdMIEvents({ sbi, herdData, tempHerdId, herdGotUpdated, claimReference, applicationReference })

    expect(raiseHerdEvent).toHaveBeenCalledWith({
      data: {
        applicationReference,
        herdId: herdData.id,
        herdVersion: herdData.version,
        reference: claimReference
      },
      message: 'Herd associated with claim',
      sbi,
      type: 'claim-herdAssociated'
    })
  })

  test('it sends the herd associated with claim event as well as the temporary ID event if the herd version is 1', async () => {
    const sbi = 111222
    const herdData = { id: 'this-is-the-herd-id', version: 1 }
    const herdIdSelected = randomUUID()
    const herdGotUpdated = false
    const claimReference = 'REBC-AA11-33FF'
    const applicationReference = 'IAHW-EE33-44JJ'

    await emitHerdMIEvents({ sbi, herdData, herdIdSelected, herdGotUpdated, claimReference, applicationReference })

    expect(raiseHerdEvent).toHaveBeenCalledTimes(2)
    expect(raiseHerdEvent).toHaveBeenCalledWith({
      data: {
        applicationReference,
        herdId: herdData.id,
        herdVersion: herdData.version,
        reference: claimReference
      },
      message: 'Herd associated with claim',
      sbi,
      type: 'claim-herdAssociated'
    })
    expect(raiseHerdEvent).toHaveBeenCalledWith({
      data: {
        herdId: herdData.id,
        tempHerdId: herdIdSelected
      },
      message: 'Herd temporary ID became herdId',
      sbi,
      type: 'herd-tempIdHerdId'
    })
  })

  test('it does not send the temporary ID event if the herd version is 1, but the herdId selected is the same as the herdId returned in the herdData', async () => {
    const sbi = 111222
    const herdData = { id: 'this-is-the-herd-id', version: 1 }
    const herdIdSelected = 'this-is-the-herd-id'
    const herdGotUpdated = false
    const claimReference = 'REBC-AA11-33FF'
    const applicationReference = 'IAHW-EE33-44JJ'

    await emitHerdMIEvents({ sbi, herdData, herdIdSelected, herdGotUpdated, claimReference, applicationReference })

    expect(raiseHerdEvent).toHaveBeenCalledTimes(1)
    expect(raiseHerdEvent).toHaveBeenCalledWith({
      data: {
        applicationReference,
        herdId: herdData.id,
        herdVersion: herdData.version,
        reference: claimReference
      },
      message: 'Herd associated with claim',
      sbi,
      type: 'claim-herdAssociated'
    })
  })

  test('it sends the herd associated with claim event as well as the herd updated event if the herdUpdated param is true', async () => {
    const sbi = 111222
    const herdData = {
      id: 'this-is-the-herd-id',
      version: 2,
      herdReasons: ['uniqueHealthNeeds'],
      herdName: 'Fattening herd',
      species: 'beef',
      cph: '22/333/2222'
    }
    const tempHerdId = randomUUID()
    const herdGotUpdated = true
    const claimReference = 'REBC-AA11-33FF'
    const applicationReference = 'IAHW-EE33-44JJ'

    await emitHerdMIEvents({ sbi, herdData, tempHerdId, herdGotUpdated, claimReference, applicationReference })

    expect(raiseHerdEvent).toHaveBeenCalledTimes(2)
    expect(raiseHerdEvent).toHaveBeenCalledWith({
      data: {
        applicationReference,
        herdId: herdData.id,
        herdVersion: herdData.version,
        reference: claimReference
      },
      message: 'Herd associated with claim',
      sbi,
      type: 'claim-herdAssociated'
    })
    expect(raiseHerdEvent).toHaveBeenCalledWith({
      data: {
        herdId: herdData.id,
        herdVersion: herdData.version,
        herdName: herdData.herdName,
        herdSpecies: herdData.species,
        herdCph: herdData.cph,
        herdReasonManagementNeeds: false,
        herdReasonUniqueHealth: true,
        herdReasonDifferentBreed: false,
        herdReasonOtherPurpose: false,
        herdReasonKeptSeparate: false,
        herdReasonOnlyHerd: false,
        herdReasonOther: false
      },
      message: 'New herd version created',
      sbi,
      type: 'herd-versionCreated'
    })
  })
})
