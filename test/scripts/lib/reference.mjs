import { fakerEN_GB as faker } from '@faker-js/faker'

const { string } = faker

const reference = (prefix) => {
  const options = {
    length: 4,
    casing: 'upper'
  }

  return `${prefix}-${string.alphanumeric(options)}-${string.alphanumeric(options)}`
}

export { reference }
