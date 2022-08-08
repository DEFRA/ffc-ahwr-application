const { storage: { usersContainer, usersFile } } = require('../../../../app/config')
const downloadBlob = require('../../../../app/lib/download-blob')
const { getUsers } = require('../../../../app/lib/get-users')

jest.mock('../../../../app/lib/download-blob')

const jsonData = [
  {
    farmerName: '__FARMER_1__',
    name: '__NAME_1__',
    sbi: '__SBI_1__',
    cph: '__CPH_1__',
    address: '__ADDRESS_1__',
    email: 'TEST_EMAIL_1@aol.com'
  },
  {
    farmerName: '__farmer_2__',
    name: '__name_2__',
    sbi: '__SBI_2__',
    cph: '__CPH_2__',
    address: '__ADDRESS_2__',
    email: 'TEST_EMAIL_2@aol.com'
  },
  {
    farmerName: '__Farmer_3__',
    name: '__Name_3__',
    sbi: '__SBI_3__',
    cph: '__CPH_3__',
    address: '__ADDRESS_3__',
    email: 'TEST_EMAIL_3@aol.com'
  }
]

const testData = JSON.stringify(jsonData)

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
    { sbi: '__SBI__' },
    { cph: '__CPH__' },
    { text: '__TEXT__' }
  ])('returns empty list when there are no matches for any fields provided on its own', async (args) => {
    expect(await getUsers(args)).toEqual([])
  })

  test.each([
    { args: { farmerName: '__FARMER_1__' }, expectedResult: jsonData[0] },
    { args: { name: '__NAME_2__' }, expectedResult: jsonData[1] },
    { args: { sbi: '__SBI_3__' }, expectedResult: jsonData[2] },
    { args: { cph: '__CPH_3__' }, expectedResult: jsonData[2] }
  ])('returns correct and exact matches for any fields provided on its own', async ({ args, expectedResult }) => {
    const users = await getUsers(args)
    expect(users.length).toEqual(1)
    expect(users[0]).toEqual(expectedResult)
  })

  test.each([
    { args: { farmerName: '__farmer_1' }, expectedResult: jsonData[0] },
    { args: { name: '__NAME_2' }, expectedResult: jsonData[1] }
  ])('performs a case insensitive partial search and returns the correct data', async ({ args, expectedResult }) => {
    const users = await getUsers(args)
    expect(users.length).toEqual(1)
    expect(users[0]).toEqual(expectedResult)
  })

  test.each([
    { sbi: 'SBI_3__' },
    { cph: 'CPH_2__' }
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
    expect(users.find(x => x.farmerName.toLowerCase().includes(payload.farmerName.toLowerCase()))).toEqual(jsonData[0])
    expect(users.find(x => x.name.toLowerCase().includes(payload.name.toLowerCase()))).toEqual(jsonData[1])
  })

  test.each([
    { text: '__FARMER_1__', expectedResult: jsonData[0] },
    { text: '__NAME_2__', expectedResult: jsonData[1] },
    { text: '__SBI_3__', expectedResult: jsonData[2] },
    { text: '__CPH_3__', expectedResult: jsonData[2] }
  ])('text search is performed on farmerName, name, sbi and cph', async ({ text, expectedResult }) => {
    const users = await getUsers({ text })
    expect(users[0]).toEqual(expectedResult)
  })

  test('Empty payload returns all the users', async () => {
    const users = await getUsers({})
    expect(users).toEqual(jsonData)
  })
})
