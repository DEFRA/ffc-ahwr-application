import { config } from 'dotenv'

config()

jest.mock('../app/config/storage', () => ({
  storageAccount: 'mockStorageAccount'
}))
