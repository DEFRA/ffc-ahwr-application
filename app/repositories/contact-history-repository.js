const { models } = require('../data')

/**
 * Get contact history by application reference number
 * @param {string} applicationReference
 * @returns contact history object.
 */
async function getAllByApplicationReference (applicationReference) {
  const result = await models.contact_history.findAll({
    where: {
      applicationReference: applicationReference.toUpperCase()
    },
    order: [['createdAt', 'DESC']]
  })
  return result.sort((a, b) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? a : b
  )
}

/**
 *
 * @param {*} data
 * @returns
 */
async function set (data) {
  const result = await models.contact_history.create(data)
  return result
}

module.exports = {
  set,
  getAllByApplicationReference
}
