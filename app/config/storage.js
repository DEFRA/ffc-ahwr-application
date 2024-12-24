import Joi from 'joi'

const schema = Joi.object({
  connectionString: Joi.string().required(),
  usersContainer: Joi.string().default('users'),
  usersFile: Joi.string().default('users.json'),
  endemicsSettingsContainer: Joi.string().default('endemics-settings'),
  endemicsPricesFile: Joi.string().default('endemics-prices-config.json'),
  storageAccount: Joi.string().required(),
  useConnectionString: Joi.bool().default(true)
})

const unvalidatedConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
  endemicsSettingsContainer: process.env.AZURE_STORAGE_ENDEMICS_SETTINGS_CONTAINER,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME
}

const { error } = schema.validate(unvalidatedConfig, {
  abortEarly: false
})

if (error) {
  throw new Error(`The blob storage config is invalid. ${error.message}`)
}

export const storageConfig = unvalidatedConfig
