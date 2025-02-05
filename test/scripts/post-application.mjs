import { fakerEN_GB as faker } from '@faker-js/faker'
import { reference } from './lib/reference.mjs'
import { post } from './lib/post.mjs'

const { company, internet, location, number, person, string } = faker

const createApplication = () => {
  const firstName = person.firstName()
  const lastName = person.lastName()
  const orgName = company.name()

  return {
    confirmCheckDetails: 'true',
    reference: reference('IAHW'),
    declaration: 'true',
    offerStatus: 'accepted',
    type: 'EE',
    organisation: {
      farmerName: `${firstName} ${lastName}`,
      name: orgName,
      crn: string.numeric({ length: 10 }),
      frn: string.numeric({ length: 10 }),
      sbi: number.int({ min: 105000000, max: 210000000 }).toString(),
      address: `${location.city()}, ${location.zipCode()}, United Kingdom`,
      email: internet.email({
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase()
      }),
      orgEmail: internet.email({
        firstName: person.firstName().toLowerCase(),
        lastName: person.lastName().toLowerCase(),
        provider: `${orgName.replace(/\W/g, '').toLowerCase()}.${internet.domainSuffix()}`
      }),
      userType: 'newUser'
    }
  }
}

const postApplication = async () => {
  const application = createApplication()
  console.log(application)
  post('application/processor', application)
}

postApplication()
