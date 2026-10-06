export const accounts = {
  admin: { email: process.env.E2E_ADMIN_EMAIL || 'demo@propsphere.local', password: process.env.E2E_ADMIN_PASSWORD || 'Phase1Demo!' },
  buyer: { email: process.env.E2E_BUYER_EMAIL || 'buyer@propsphere.local', password: process.env.E2E_BUYER_PASSWORD || 'Phase1Demo!' },
}

export const seededProperties = {
  featured: { slug: 'sunlit-apartment-f-11', city: 'Islamabad', purpose: 'SALE', bedrooms: 3 },
  rental: { slug: 'modern-flat-dha-lahore', city: 'Lahore', purpose: 'RENT', bedrooms: 2 },
}

export const demoPassword = 'Phase1Demo!'
