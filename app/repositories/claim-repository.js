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

/**
 *
 * @param {*} data
 * @returns
 */
async function updateByReference (data) {
  const result = await models.claim.update(data, {
    where: {
      reference: data.reference
    },
    returning: true
  })

  return result
}

/**
 * Get all claims that have been claimed
 * @param {*} claimStatusIds an array of status IDs which indicate that an claim has been claimed
 * @returns a list of claims
 */
async function getAllClaimedClaims (claimStatusIds) {
  return models.claim.count({
    where: {
      statusId: claimStatusIds // shorthand for IN operator
    }
  })
}

module.exports = {
  set,
  getByReference,
  updateByReference,
  getAllClaimedClaims,
  getByApplicationReference
}
