const applicationChangedState = (applicationRecord) => {
  const attributes = Object.keys(applicationRecord.dataValues)
  const unwantedFields = [
    'createdBy',
    'updatedBy',
    'reference',
    'updatedAt'
  ]
  unwantedFields.forEach(unwantedField => {
    attributes.splice(attributes.indexOf(unwantedField), 1)
  })

  let originalState = {}
  let newState = {}

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
