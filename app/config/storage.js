const Joi = require('joi')

// Define config schema
const schema = Joi.object({
  connectionString: Joi.string().required(),
  usersContainer: Joi.string().default('users'),
  usersFile: Joi.string().default('users.json'),
  endemicsSettingsContainer: Joi.string().default('endemics-settings'),
  endemicsPricesFile: Joi.string().default('endemics-prices-config.json'),
  storageAccount: Joi.string().required(),
  useConnectionString: Joi.bool().default(true)
})

// Build config
const config = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
  endemicsSettingsContainer: process.env.AZURE_STORAGE_ENDEMICS_SETTINGS_CONTAINER,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The blob storage config is invalid. ${result.error.message}`)
}

module.exports = result.value
