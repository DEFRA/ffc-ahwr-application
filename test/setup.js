import { config } from 'dotenv'
process.env.AZURE_STORAGE_CONNECTION_STRING = 'dumyConnectionString'
process.env.AZURE_STORAGE_ACCOUNT_NAME = 'dumyStorageAccount'
process.env.CLAIM_COMPLIANCE_CHECK_RATIO = 2
config()
