import { faker } from '@faker-js/faker'
import { env } from '../config/env.js'

faker.seed(env.testSeed)

export function newContact() {
  return { name: faker.person.fullName(), email: faker.internet.email().toLowerCase(), message: faker.lorem.sentence() }
}

export function newOrganization() {
  return { name: faker.person.fullName(), email: `qa+${faker.string.alphanumeric(8).toLowerCase()}@example.test`, organization: `${faker.company.name()} QA` }
}

export function newProperty() {
  return {
    title: `${faker.location.street()} QA listing`,
    city: faker.helpers.arrayElement(['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Faisalabad', 'Multan', 'Quetta']),
    community: `${faker.location.street()} ${faker.number.int({ min: 1, max: 99 })}`,
    price: faker.number.int({ min: 15_000_000, max: 90_000_000 }),
    areaSqft: faker.number.int({ min: 650, max: 5_000 }),
    description: faker.lorem.sentences(2),
  }
}

export function newSearchFilters() {
  const minPrice = faker.number.int({ min: 1_000_000, max: 30_000_000 })
  return {
    minPrice,
    maxPrice: minPrice + faker.number.int({ min: 10_000_000, max: 40_000_000 }),
    minAreaSqft: faker.number.int({ min: 500, max: 1_500 }),
  }
}
