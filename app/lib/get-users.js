const downloadBlob = require('./download-blob')
const { storage: { usersContainer, usersFile } } = require('../config')

/**
 * Gets all the users stored as a blob (in json format)
 *
 * @returns {object[]} json parsed list of user objects
*/
const getUsersBlob = async () => {
  const contents = await downloadBlob(usersContainer, usersFile) ?? '[]'
  return JSON.parse(contents)
}

/**
 * Determines whether any of the provided strings in the stringsToCompare list
 * matches any part of the string in the stringToSearch
 *
 * @param {string} stringToSearch the string to search in
 * @param {string[]} stringsToCompare list of strings to be partially matched
 * in stringToSearch
 * @returns {boolean} true if there is partial match, false otherwise
*/
const partialMatch = (stringToSearch, stringsToCompare) =>
  stringsToCompare.some(str => typeof str === 'string' &&
    stringToSearch?.toLowerCase().includes(str?.toLowerCase()))

/**
 * Determines whether any of the provided strings in the stringsToCompare list
 * exactly matches the string being searched
 *
 * @param {string} stringToSearch the string being searched
 * @param {string[]} stringsToCompare list of strings to see if they match stringToSearch
 * @returns {boolean} true if there is an exact match, false otherwise
*/
const exactMatch = (stringToSearch, stringsToCompare) =>
  stringsToCompare.some(str => stringToSearch === str)

/**
 * Returns a list of user based on the fields in args. If args
 * object is empty (no search params are provided) then
 * all the users are returned
 *
 * @param {object} args all the search parameters
 * @param {string} args.farmerName searches users with a partial match in their farmerName field
 * @param {string} args.name searches users with a partial match in their name field
 * @param {number} args.sbi searches users with the exact sbi match
 * @param {string} args.cph searches users with the exact cph match
 * @param {string} args.text a string that is matched against farmerName, name, cph and sbi
 * @returns {Object[]} all users that match the fields in args and all available users
 * if no fields are provided.
 */
const getUsers = async (args) => {
  const users = await getUsersBlob()
  if (!Object.keys(args).length) return users

  return users.filter(user => partialMatch(user.farmerName, [args.farmerName, args.text]) ||
    partialMatch(user.name, [args.name, args.text]) ||
    exactMatch(user.sbi, [args.sbi?.toString(), args.text?.toString()]) ||
    exactMatch(user.cph, [args.cph, args.text])
  )
}

module.exports = {
  getUsers
}
