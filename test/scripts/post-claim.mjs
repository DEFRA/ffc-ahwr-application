import { fakerEN_GB as faker } from '@faker-js/faker'
import { reference } from './lib/reference.mjs'
import { sheepEndemicsPackages } from './lib/sheep-tests.mjs'
import { post } from './lib/post.mjs'

const { helpers, number, person, string } = faker

const review = 'R'
const followup = 'E'

const createClaim = (applicationReference, species, claimType) => {
  const typeOfLivestock = species ?? helpers.arrayElement(['beef', 'dairy', 'pigs', 'sheep'])
  const type = claimType ?? helpers.arrayElement([review, followup])
  const reviewTestResults = helpers.arrayElement(['positive', 'negative'])

  const optional = {}

  if (type === review && ['beef', 'dairy'].includes(typeOfLivestock)) {
    optional.laboratoryURN = string.ulid()
    optional.dateOfTesting = new Date().toISOString()
  }

  if (type === followup && ['beef', 'dairy'].includes(typeOfLivestock)) {
    optional.reviewTestResults = helpers.arrayElement(['positive', 'negative'])

    if (optional.reviewTestResults === 'positive') {
      optional.piHunt = 'yes'
    } else {
      optional.piHunt = helpers.arrayElement(['yes', 'no'])
    }

    if (optional.piHunt === 'yes' && optional.reviewTestResults === 'positive') {
      optional.piHuntAllAnimals = 'yes'
    }

    if (optional.piHunt === 'yes' && optional.reviewTestResults === 'negative') {
      optional.piHuntRecommended = helpers.arrayElement(['yes', 'no'])
    }

    if (optional.piHuntRecommended === 'yes') {
      optional.piHuntAllAnimals = helpers.arrayElement(['yes', 'no'])
    }

    if (optional.piHuntRecommended !== 'no' && optional.piHuntAllAnimals === 'yes') {
      optional.laboratoryURN = string.ulid()
      optional.testResults = helpers.arrayElement(['positive', 'negative'])
      optional.dateOfTesting = new Date().toISOString()
    }

    optional.biosecurity = 'yes'
  }

  if (type === review && ['beef', 'dairy', 'pigs'].includes(typeOfLivestock)) {
    optional.testResults = helpers.arrayElement(['positive', 'negative'])
  }

  if (typeOfLivestock === 'pigs') {
    optional.laboratoryURN = string.ulid()
  }

  if (['pigs', 'sheep'].includes(typeOfLivestock)) {
    optional.dateOfTesting = new Date().toISOString()
  }

  if (type === review && typeOfLivestock === 'pigs') {
    optional.numberOfOralFluidSamples = '30'
  }

  if (type === followup && typeOfLivestock === 'pigs') {
    optional.reviewTestResults = reviewTestResults
    optional.biosecurity = {
      biosecurity: 'yes',
      assessmentPercentage: number.int({ min: 0, max: 100 }).toString()
    }
    optional.diseaseStatus = helpers.arrayElement(['1', '2', '3', '4'])
    optional.herdVaccinationStatus = helpers.arrayElement(['vaccinated', 'notVaccinated'])
    optional.numberAnimalsTested = '30'
    optional.numberOfSamplesTested = '30'
  }

  if (type === review && typeOfLivestock === 'sheep') {
    optional.laboratoryURN = string.ulid()
  }

  if (type === followup && typeOfLivestock === 'sheep') {
    const sheepEndemicsPackage = helpers.arrayElement(Object.keys(sheepEndemicsPackages))
    optional.sheepEndemicsPackage = sheepEndemicsPackage

    const possibleTests = sheepEndemicsPackages[sheepEndemicsPackage]
    const sheepTests = helpers.arrayElements(Object.keys(possibleTests))

    const testResults = sheepTests.map((diseaseType) => ({
      diseaseType,
      result: helpers.arrayElement(possibleTests[diseaseType])
    }))
    optional.testResults = testResults
    optional.numberAnimalsTested = number.int({ min: 30, max: 300 }).toString()
  }

  if (type === review && ['beef', 'pigs', 'sheep'].includes(typeOfLivestock)) {
    optional.numberAnimalsTested = number.int({ min: 30, max: 300 }).toString()
  }

  return {
    applicationReference,
    reference: reference('TEMP-CLAIM'),
    type,
    createdBy: 'admin',
    data: {
      typeOfLivestock,
      dateOfVisit: new Date().toISOString(),
      speciesNumbers: 'yes',
      vetsName: `${person.firstName()} ${person.lastName()}`,
      vetRCVSNumber: `${string.numeric({ length: 6 })}${string.fromCharacters('0123456789X', 1)}`,
      ...optional
    }
  }
}

const postClaim = async () => {
  const [applicationReference, species, claimType] = process.argv.slice(2)
  const claim = createClaim(applicationReference, species, claimType)
  console.log(claim)
  post('claim', claim)
}

postClaim()
