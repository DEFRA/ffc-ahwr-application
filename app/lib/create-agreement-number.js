const { endemics } = require('../config')
const createReference = require('./create-reference')
const generatePreTextForClaim = require('./generate-pre-text-for-claim')

const journeyPreText = (journey, data) => {
  return journey === 'apply' ? 'IAHW' : generatePreTextForClaim(data.type, data.typeOfLivestock)
}

const replacePrefix = (reference, prefix) => {
  return reference.split('-').map((part, index) => index === 0 ? prefix : part).join('-')
}

module.exports = (journey, data) => {
  const { id } = data || {}
  const prefix = journeyPreText(journey, data)
  return endemics.enabled ? replacePrefix(createReference(id), prefix) : createReference(id)
}
