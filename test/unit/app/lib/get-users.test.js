const { storage: { usersContainer, usersFile } } = require('../../../../app/config')
const downloadBlob = require('../../../../app/lib/download-blob')
const { getUsers } = require('../../../../app/lib/get-users')
const userData = require('../../../data/users')

jest.mock('../../../../app/lib/download-blob')

const testData = JSON.stringify(userData)

describe('getUsers', () => {
  beforeEach(() => {
    downloadBlob.mockResolvedValue(testData)
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  test('makes request to download users blob', async () => {
    await getUsers({})

    expect(downloadBlob).toHaveBeenCalledTimes(1)
    expect(downloadBlob).toHaveBeenCalledWith(usersContainer, usersFile)
  })

  test.each([
    { fileContent: null },
    { fileContent: undefined }
  ])('return empty users list when blob content is null or undefined', async ({ fileContent }) => {
    downloadBlob.mockResolvedValue(fileContent)
    const res = await getUsers({})
    expect(res).toEqual([])
  })

  test.each([
    { farmerName: '__FAMER_NAME__' },
    { name: '__NAME__' },
    { sbi: 123456789 },
    { cph: '12/345/6789' },
    { text: '__TEXT__' }
  ])('returns empty list when there are no matches for any fields provided on its own', async (args) => {
    const res = await getUsers(args)
    expect(res).toEqual([])
  })

  test.each([
    { args: { farmerName: '__FARMER_1__' }, expectedResult: userData[0] },
    { args: { name: '__NAME_2__' }, expectedResult: userData[1] },
    { args: { sbi: 556667777 }, expectedResult: userData[2] },
    { args: { cph: '11/123/4567' }, expectedResult: userData[2] }
  ])('returns correct and exact matches for any fields provided on its own', async ({ args, expectedResult }) => {
    const users = await getUsers(args)
    expect(users.length).toEqual(1)
    expect(users[0]).toEqual(expectedResult)
  })

  test.each([
    { args: { farmerName: '__farmer_1' }, expectedResult: userData[0] },
    { args: { name: '__NAME_2' }, expectedResult: userData[1] }
  ])('performs a case insensitive partial search and returns the correct data', async ({ args, expectedResult }) => {
    const users = await getUsers(args)
    expect(users.length).toEqual(1)
    expect(users[0]).toEqual(expectedResult)
  })

  test.each([
    { sbi: 55666777 },
    { cph: '22/333/444' }
  ])('partial searches are not supported on sbi and cph', async (args) => {
    const users = await getUsers(args)
    expect(users.length).toEqual(0)
  })

  test('getUsers perform a composite search', async () => {
    const payload = {
      farmerName: '__FARMER_1__',
      name: '__NAME_2__'
    }

    const users = await getUsers(payload)

    expect(users.length).toEqual(2)
    expect(users.find(x => x.farmerName.toLowerCase().includes(payload.farmerName.toLowerCase()))).toEqual(userData[0])
    expect(users.find(x => x.name.toLowerCase().includes(payload.name.toLowerCase()))).toEqual(userData[1])
  })

  test.each([
    { text: '__FARMER_1__', expectedResult: userData[0] },
    { text: '__NAME_2__', expectedResult: userData[1] },
    { text: '556667777', expectedResult: userData[2] },
    { text: '11/123/4567', expectedResult: userData[2] }
  ])('text search is performed on farmerName, name, sbi and cph', async ({ text, expectedResult }) => {
    const users = await getUsers({ text })
    expect(users[0]).toEqual(expectedResult)
  })

  test('Empty payload returns all the users', async () => {
    const users = await getUsers({})
    expect(users).toEqual(userData)
  })
})
