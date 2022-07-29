const applicationChangedState = (applicationRecord) => {
  const attributes = Object.keys(applicationRecord.dataValues)
  const originalState = {}
  const newState = {}

  attributes.forEach(field => {
    if (applicationRecord.changed(field) && applicationRecord.previous(field) !== undefined) {
      originalState[field] = applicationRecord.previous(field)
      newState[field] = applicationRecord[field]
    }
  })

  return { originalState, newState }
}

module.exports = applicationChangedState
