import { raiseHerdEvent } from '../event-publisher/index.js'

export const emitHerdMIEvents = async ({ sbi, herdData, herdIdSelected, herdGotUpdated, claimReference, applicationReference }) => {
  const { id: herdId, version: herdVersion, herdName, species: herdSpecies, cph: herdCph, herdReasons } = herdData

  if (herdVersion === 1 && herdIdSelected !== herdId) {
    await raiseHerdEvent({ sbi, message: 'Herd temporary ID became herdId', type: 'herd-tempIdHerdId', data: { tempHerdId: herdIdSelected, herdId } })
  }

  if (herdGotUpdated) {
    await raiseHerdEvent({
      sbi,
      message: 'New herd version created',
      type: 'herd-versionCreated',
      data: {
        herdId,
        herdVersion,
        herdName,
        herdSpecies,
        herdCph,
        herdReasonManagementNeeds: herdReasons.includes('separateManagementNeeds'),
        herdReasonUniqueHealth: herdReasons.includes('uniqueHealthNeeds'),
        herdReasonDifferentBreed: herdReasons.includes('differentBreed'),
        herdReasonOtherPurpose: herdReasons.includes('differentPurpose'),
        herdReasonKeptSeparate: herdReasons.includes('keptSeparate'),
        herdReasonOnlyHerd: herdReasons.includes('onlyHerd'),
        herdReasonOther: herdReasons.includes('other')
      }
    })
  }

  await raiseHerdEvent({
    sbi,
    message: 'Herd associated with claim',
    type: 'claim-herdAssociated',
    data: {
      herdId,
      herdVersion,
      reference: claimReference,
      applicationReference
    }
  })
}
