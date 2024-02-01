const { models } = require('../data')

/**
 * Get claim by reference number
 * @param {string} reference
 * @returns claim object with status.
 */
async function getByReference (reference) {
  return models.claim.findOne({
    where: { reference: reference.toUpperCase() },
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ]
  })
}

/**
 * Get claims by applicationReference number
 * @param {string} applicationReference
 * @returns an array of claims object with their statuses.
 */
async function getByApplicationReference (applicationReference) {
  const result = await models.claim.findAll({
    where: { applicationReference: applicationReference.toUpperCase() },
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ],
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
  const result = await models.claim.create(data)

  return result
}

module.exports = {
  set,
  getByReference,
  getByApplicationReference
}
