const applicationChangedState = (applicationRecord) => {
  let originalState = null
  let newState = null

  if (!applicationRecord || !applicationRecord.dataValues) {
    return { originalState, newState }
  }

  originalState = {}
  newState = {}

  const attributes = Object.keys(applicationRecord.dataValues)
  const unwantedFields = [
    'id',
    'createdBy',
    'updatedBy',
    'reference',
    'createdAt',
    'updatedAt'
  ]
  unwantedFields.forEach(unwantedField => {
    attributes.splice(attributes.indexOf(unwantedField), 1)
  })

  attributes.forEach(field => {
    if (applicationRecord.changed(field) && applicationRecord[field] !== applicationRecord.previous(field)) {
      originalState[field] = applicationRecord.previous(field)
      newState[field] = applicationRecord[field]
    }
  })

  if (Object.keys(originalState).length === 0) {
    originalState = null
  }

  if (Object.keys(newState).length === 0) {
    newState = null
  }

  return { originalState, newState }
}

module.exports = applicationChangedState
