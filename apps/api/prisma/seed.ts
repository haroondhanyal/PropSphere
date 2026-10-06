import { PrismaClient, PropertyPurpose, PropertyType, Role, ListingStatus, LeadStage, ViewingMode, ViewingStatus, OfferStatus, ApplicationStatus, LeaseStatus, InvoiceStatus, PaymentMethod, UnitStatus, MaintenanceStatus, Priority } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const db = new PrismaClient()
const homes = [
  { slug: 'sunlit-apartment-f-11', title: 'Sunlit apartment with a garden view', city: 'Islamabad', community: 'F-11', purpose: PropertyPurpose.SALE, type: PropertyType.APARTMENT, price: 28500000, bedrooms: 3, bathrooms: 3, areaSqft: 1850, imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85', description: 'A bright, generous home with thoughtfully planned living spaces, a calm garden outlook, and everyday essentials nearby.' },
  { slug: 'family-home-bahria-town', title: 'A family home on a quiet street', city: 'Islamabad', community: 'Bahria Town', purpose: PropertyPurpose.SALE, type: PropertyType.HOUSE, price: 54000000, bedrooms: 5, bathrooms: 5, areaSqft: 4200, imageUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85', description: 'Room to grow in a well-kept family home with a welcoming entrance, bright interiors, and a peaceful neighborhood feel.' },
  { slug: 'modern-flat-dha-lahore', title: 'Modern city apartment, ready to move in', city: 'Lahore', community: 'DHA Phase 6', purpose: PropertyPurpose.RENT, type: PropertyType.APARTMENT, price: 185000, bedrooms: 2, bathrooms: 2, areaSqft: 1450, imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85', description: 'An easy-to-maintain city apartment with a balanced layout, warm natural light, and shops and cafes a short drive away.' },
  { slug: 'contemporary-villa-karachi', title: 'Contemporary villa with room to unwind', city: 'Karachi', community: 'DHA Phase 8', purpose: PropertyPurpose.SALE, type: PropertyType.VILLA, price: 89000000, bedrooms: 4, bathrooms: 5, areaSqft: 5100, imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85', description: 'A refined villa with flexible spaces for hosting, quiet evenings, and comfortable everyday living.' },
  { slug: 'bahria-studio-rawalpindi', title: 'Light-filled studio near the park', city: 'Rawalpindi', community: 'Bahria Town', purpose: PropertyPurpose.RENT, type: PropertyType.STUDIO, price: 95000, bedrooms: 1, bathrooms: 1, areaSqft: 720, imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85', description: 'A smart studio with an open plan, a tidy kitchen, and a leafy park close by.' },
  { slug: 'gulberg-penthouse-lahore', title: 'A calm penthouse above the city', city: 'Lahore', community: 'Gulberg', purpose: PropertyPurpose.SALE, type: PropertyType.PENTHOUSE, price: 76000000, bedrooms: 4, bathrooms: 4, areaSqft: 3600, imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85', description: 'A generous top-floor residence with long city views, gracious rooms, and an inviting terrace.' },
]

const cities = [
  { city: 'Islamabad', areas: ['F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-11', 'DHA Phase 2', 'Bahria Enclave'] },
  { city: 'Rawalpindi', areas: ['Bahria Town', 'DHA Phase 1', 'Satellite Town', 'Saddar', 'Chaklala', 'PWD'] },
  { city: 'Lahore', areas: ['DHA Phase 6', 'Gulberg III', 'Bahria Town', 'Johar Town', 'Model Town', 'Raiwind Road'] },
  { city: 'Karachi', areas: ['DHA Phase 6', 'Clifton', 'Gulshan-e-Iqbal', 'PECHS', 'Scheme 33', 'Shahrah-e-Faisal'] },
  { city: 'Peshawar', areas: ['Hayatabad', 'University Town', 'Regi Model Town', 'DHA Peshawar'] },
  { city: 'Faisalabad', areas: ['D Ground', 'Kohinoor City', 'Canal Road', 'Wapda City'] },
  { city: 'Multan', areas: ['Bosan Road', 'DHA Multan', 'Cantt', 'Model Town'] },
  { city: 'Quetta', areas: ['Jinnah Town', 'Samungli Road', 'Airport Road', 'Cantt'] },
  { city: 'Hyderabad', areas: ['Latifabad', 'Qasimabad', 'Auto Bhan Road', 'Citizen Colony'] },
  { city: 'Sialkot', areas: ['Cantt', 'Defence Road', 'Paris Road', 'Citi Housing'] },
]
const photo = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`
const demoPhotos = {
  home: [photo(8134821), photo(10610731), photo(9976121), photo(4846304), photo(11296222), photo(6764827), photo(7534563), photo(19889118)],
  commercial: [photo(32456063), photo(7078014), photo(8556704)],
  industrial: [photo(8556704), photo(17937093), photo(15177112)],
}
const supplementalHomes = Array.from({ length: 142 }, (_, index) => {
  const place = cities[index % cities.length]
  const community = place.areas[Math.floor(index / cities.length) % place.areas.length]
  const kind = index % 10 < 7 ? 'residential' : index % 10 < 9 ? 'commercial' : 'industrial'
  const residentialTypes = [PropertyType.APARTMENT, PropertyType.HOUSE, PropertyType.VILLA, PropertyType.PENTHOUSE, PropertyType.STUDIO]
  const commercialTypes = [PropertyType.OFFICE, PropertyType.SHOP, PropertyType.COMMERCIAL]
  const industrialTypes = [PropertyType.WAREHOUSE, PropertyType.FACTORY]
  const type = kind === 'residential'
    ? residentialTypes[index % residentialTypes.length]
    : kind === 'commercial' ? commercialTypes[Math.floor(index / 10) % commercialTypes.length] : industrialTypes[Math.floor(index / 10) % industrialTypes.length]
  const purpose = index % 3 === 0 ? PropertyPurpose.RENT : PropertyPurpose.SALE
  const industrial = kind === 'industrial'
  const commercial = kind === 'commercial'
  const bedrooms = industrial || commercial ? 0 : 1 + (index % 5)
  const areaSqft = industrial ? 6000 + (index % 9) * 1250 : commercial ? 900 + (index % 8) * 425 : 650 + (index % 12) * 175
  const base = industrial ? 65000000 : commercial ? 24000000 : 9500000
  const multiplier = [0.72, 0.9, 1, 1.15, 1.35][index % 5]
  const price = Math.round((purpose === PropertyPurpose.RENT ? base / 260 : base) * multiplier / 1000) * 1000
  const typeLabel = type.toLowerCase().replaceAll('_', ' ')
  const purposeLabel = purpose === PropertyPurpose.SALE ? 'for sale' : 'for rent'
  const imagePool = industrial ? demoPhotos.industrial : commercial ? demoPhotos.commercial : demoPhotos.home
  const title = `${bedrooms ? `${bedrooms}-bedroom ` : ''}${typeLabel} ${purposeLabel} in ${community}`
  return {
    slug: `sample-${place.city.toLowerCase()}-${community.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-${String(index + 1).padStart(3, '0')}`,
    title,
    city: place.city,
    community,
    purpose,
    type,
    price,
    bedrooms,
    bathrooms: bedrooms ? Math.max(1, Math.ceil(bedrooms / 2)) : 1,
    areaSqft,
    imageUrl: imagePool[index % imagePool.length],
    description: `Illustrative PropSphere sample listing for a ${typeLabel} in ${community}, ${place.city}. Price, availability and property details are demo data and should be verified before any real estate decision.`,
  }
})

async function main() {
  const organization = await db.organization.upsert({ where: { slug: 'propsphere-demo' }, update: {}, create: { name: 'PropSphere Demo Realty', slug: 'propsphere-demo' } })
  const passwordHash = await bcrypt.hash('Phase1Demo!', 12)
  const people = [
    { name: 'PropSphere Admin', email: 'demo@propsphere.local', role: Role.ADMIN },
    { name: 'Omar Siddiqui', email: 'manager@propsphere.local', role: Role.SALES_MANAGER },
    { name: 'Ayesha Khan', email: 'agent@propsphere.local', role: Role.AGENT },
    { name: 'Hamza Raza', email: 'sales2@propsphere.local', role: Role.AGENT },
    { name: 'Sana Iqbal', email: 'sales3@propsphere.local', role: Role.AGENT },
    { name: 'Bilal Shah', email: 'sales4@propsphere.local', role: Role.AGENT },
    { name: 'Maha Tariq', email: 'sales5@propsphere.local', role: Role.AGENT },
    { name: 'Hassan Ali', email: 'owner@propsphere.local', role: Role.OWNER },
    { name: 'Mariam Noor', email: 'tenant@propsphere.local', role: Role.TENANT },
    { name: 'Zain Ahmed', email: 'buyer@propsphere.local', role: Role.BUYER },
    { name: 'Northside Service Team', email: 'vendor@propsphere.local', role: Role.VENDOR },
  ] as const
  const users = new Map<string, { id: string; name: string; email: string }>()
  for (const person of people) {
    const user = await db.user.upsert({ where: { email: person.email }, update: { passwordHash, name: person.name, role: person.role }, create: { organizationId: organization.id, ...person, passwordHash } })
    users.set(person.email, user)
    await db.organizationMembership.upsert({ where: { userId_organizationId: { userId: user.id, organizationId: organization.id } }, update: { role: person.role }, create: { userId: user.id, organizationId: organization.id, role: person.role } })
  }
  const admin = users.get('demo@propsphere.local')!
  const agent = users.get('agent@propsphere.local')!
  const owner = users.get('owner@propsphere.local')!
  const tenant = users.get('tenant@propsphere.local')!
  const buyer = users.get('buyer@propsphere.local')!

  const agents = ['agent@propsphere.local', 'sales2@propsphere.local', 'sales3@propsphere.local', 'sales4@propsphere.local', 'sales5@propsphere.local'].map((email) => users.get(email)!)
  const listingCatalog = [...homes, ...supplementalHomes]
  for (const [index, home] of listingCatalog.entries()) {
    const pool = home.type === PropertyType.WAREHOUSE || home.type === PropertyType.FACTORY ? demoPhotos.industrial : ([PropertyType.OFFICE, PropertyType.SHOP, PropertyType.COMMERCIAL] as string[]).includes(home.type) ? demoPhotos.commercial : demoPhotos.home
    const galleryUrls = [0, 1, 2].map((offset) => pool[(index + offset) % pool.length])
    await db.property.upsert({ where: { slug: home.slug }, update: { title: home.title, price: home.price, imageUrl: galleryUrls[0], galleryUrls, city: home.city, community: home.community, purpose: home.purpose, type: home.type, bedrooms: home.bedrooms, bathrooms: home.bathrooms, areaSqft: home.areaSqft, description: home.description, isDemo: true, verified: false }, create: { ...home, imageUrl: galleryUrls[0], galleryUrls, organizationId: organization.id, createdById: agents[index % agents.length].id, verified: false, isDemo: true, status: ListingStatus.PUBLISHED } })
  }
  const rentalPhotos = [photo(6764827), photo(11296222), photo(7534563)]
  const rental = await db.property.upsert({ where: { slug: 'garden-apartment-islamabad' }, update: { price: 210000, isDemo: true, verified: false, imageUrl: rentalPhotos[0], galleryUrls: rentalPhotos }, create: { organizationId: organization.id, createdById: owner.id, slug: 'garden-apartment-islamabad', title: 'Garden apartment in a quiet Islamabad block', description: 'Sample rental for the PropSphere product demo. Details and availability are illustrative.', city: 'Islamabad', community: 'F-10', purpose: PropertyPurpose.RENT, type: PropertyType.APARTMENT, price: 210000, bedrooms: 3, bathrooms: 2, areaSqft: 1680, imageUrl: rentalPhotos[0], galleryUrls: rentalPhotos, isDemo: true, verified: false, status: ListingStatus.PUBLISHED } })
  const applicationPhotos = [photo(19889118), photo(8134821), photo(10610731)]
  const applicationProperty = await db.property.upsert({ where: { slug: 'family-apartment-i8-islamabad' }, update: { price: 195000, isDemo: true, verified: false, imageUrl: applicationPhotos[0], galleryUrls: applicationPhotos }, create: { organizationId: organization.id, createdById: owner.id, slug: 'family-apartment-i8-islamabad', title: 'Family apartment close to the I-8 market', description: 'Sample rental for the PropSphere product demo. Details and availability are illustrative.', city: 'Islamabad', community: 'I-8', purpose: PropertyPurpose.RENT, type: PropertyType.APARTMENT, price: 195000, bedrooms: 3, bathrooms: 2, areaSqft: 1540, imageUrl: applicationPhotos[0], galleryUrls: applicationPhotos, isDemo: true, verified: false, status: ListingStatus.PUBLISHED } })
  await db.property.upsert({ where: { slug: 'submitted-house-blue-area' }, update: { isDemo: true }, create: { organizationId: organization.id, createdById: admin.id, slug: 'submitted-house-blue-area', title: 'Newly renovated home near Blue Area', description: 'Illustrative listing submitted for the PropSphere review workflow.', city: 'Islamabad', community: 'G-6', purpose: PropertyPurpose.SALE, type: PropertyType.HOUSE, price: 46500000, bedrooms: 4, bathrooms: 4, areaSqft: 3100, imageUrl: photo(8134821), isDemo: true, status: ListingStatus.PENDING_REVIEW } })

  const sale = await db.property.findUniqueOrThrow({ where: { slug: homes[0].slug } })
  const inquiry = await db.inquiry.findFirst({ where: { senderId: buyer.id, propertyId: sale.id } })
  if (!inquiry) {
    await db.inquiry.create({ data: { organizationId: organization.id, propertyId: sale.id, senderId: buyer.id, message: 'Could you share the available viewing times this weekend?' } })
    await db.lead.create({ data: { organizationId: organization.id, propertyId: sale.id, customerId: buyer.id, assignedToId: agent.id, name: buyer.name, email: buyer.email, budget: 32000000, preferredCity: 'Islamabad', stage: LeadStage.CONTACTED, notes: 'Asked about a weekend viewing.' } })
  }
  const seededInquiry = await db.inquiry.findFirst({ where: { senderId: buyer.id, propertyId: sale.id } })
  if (seededInquiry && !(await db.inquiryMessage.findFirst({ where: { inquiryId: seededInquiry.id } }))) await db.inquiryMessage.create({ data: { inquiryId: seededInquiry.id, senderId: buyer.id, body: seededInquiry.message } })
  const viewing = await db.viewing.findFirst({ where: { requesterId: buyer.id, propertyId: sale.id } })
  if (!viewing) await db.viewing.create({ data: { organizationId: organization.id, propertyId: sale.id, requesterId: buyer.id, agentId: agent.id, scheduledAt: new Date(Date.now() + 3 * 86400000), mode: ViewingMode.IN_PERSON, status: ViewingStatus.CONFIRMED } })
  const offer = await db.offer.findFirst({ where: { buyerId: buyer.id, propertyId: sale.id } })
  if (!offer) await db.offer.create({ data: { organizationId: organization.id, propertyId: sale.id, buyerId: buyer.id, amount: 27000000, message: 'Ready to proceed with a standard bank transfer.', status: OfferStatus.SUBMITTED } })
  const application = await db.rentalApplication.findFirst({ where: { applicantId: tenant.id, propertyId: applicationProperty.id } })
  if (!application) await db.rentalApplication.create({ data: { organizationId: organization.id, propertyId: applicationProperty.id, applicantId: tenant.id, monthlyIncome: 620000, employment: 'Employed', message: 'Looking for a long-term home close to work.', status: ApplicationStatus.SUBMITTED } })

  const unit = await db.propertyUnit.upsert({ where: { propertyId_unitNumber: { propertyId: rental.id, unitNumber: 'F10-3B' } }, update: {}, create: { organizationId: organization.id, propertyId: rental.id, unitNumber: 'F10-3B', bedrooms: 3, monthlyRent: 210000, status: UnitStatus.OCCUPIED } })
  let lease = await db.lease.findFirst({ where: { organizationId: organization.id, propertyId: rental.id, tenantId: tenant.id } })
  if (!lease) lease = await db.lease.create({ data: { organizationId: organization.id, propertyId: rental.id, unitId: unit.id, tenantId: tenant.id, ownerId: owner.id, startDate: new Date(Date.now() - 30 * 86400000), endDate: new Date(Date.now() + 335 * 86400000), monthlyRent: 210000, deposit: 210000, status: LeaseStatus.ACTIVE } })
  const now = new Date()
  const firstPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
  const leaseMonths = Math.min(36, Math.max(1, (lease.endDate.getFullYear() - lease.startDate.getFullYear()) * 12 + lease.endDate.getMonth() - lease.startDate.getMonth()))
  for (let i = 0; i < leaseMonths; i++) {
    const start = new Date(firstPeriod); start.setMonth(start.getMonth() + i)
    const end = new Date(start); end.setMonth(end.getMonth() + 1)
    const invoice = await db.rentInvoice.upsert({ where: { leaseId_periodStart: { leaseId: lease.id, periodStart: start } }, update: {}, create: { leaseId: lease.id, periodStart: start, periodEnd: end, dueDate: start, amount: 210000, status: i === 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.UPCOMING, amountPaid: i === 0 ? 50000 : 0 } })
    if (i === 0 && !(await db.payment.findUnique({ where: { reference: 'PS-DEMO-RENT-001' } }))) await db.payment.create({ data: { invoiceId: invoice.id, payerId: tenant.id, amount: 50000, method: PaymentMethod.BANK_TRANSFER, reference: 'PS-DEMO-RENT-001' } })
  }
  const vendorPerson = users.get('vendor@propsphere.local')!
  let vendor = await db.vendor.findFirst({ where: { organizationId: organization.id, name: 'Northside Plumbing' } })
  if (!vendor) vendor = await db.vendor.create({ data: { organizationId: organization.id, name: 'Northside Plumbing', service: 'Plumbing and drainage', phone: '+92 300 555 0142', email: vendorPerson.email, userId: vendorPerson.id } })
  else if (!vendor.userId) vendor = await db.vendor.update({ where: { id: vendor.id }, data: { email: vendorPerson.email, userId: vendorPerson.id } })
  const ticket = await db.maintenanceRequest.findFirst({ where: { organizationId: organization.id, requesterId: tenant.id, title: 'Kitchen tap needs a new washer' } })
  if (!ticket) await db.maintenanceRequest.create({ data: { organizationId: organization.id, propertyId: rental.id, requesterId: tenant.id, vendorId: vendor.id, title: 'Kitchen tap needs a new washer', description: 'The kitchen faucet drips steadily when closed. Weekday visits after 3pm work best.', category: 'Plumbing', priority: Priority.MEDIUM, status: MaintenanceStatus.SCHEDULED, quotedCost: 4500 } })

  const task = await db.task.findFirst({ where: { organizationId: organization.id, assignedToId: agent.id, title: 'Confirm weekend viewing with Zain' } })
  if (!task) await db.task.create({ data: { organizationId: organization.id, assignedToId: agent.id, title: 'Confirm weekend viewing with Zain', dueAt: new Date(Date.now() + 86400000) } })
  const savedSearch = await db.savedSearch.findFirst({ where: { userId: buyer.id, name: 'Islamabad homes under PKR 3 crore' } })
  if (!savedSearch) await db.savedSearch.create({ data: { userId: buyer.id, name: 'Islamabad homes under PKR 3 crore', filters: { city: 'Islamabad', maxPrice: '30000000' } } })

  let development = await db.developmentProject.findFirst({ where: { organizationId: organization.id, name: 'Cedar Heights' } })
  if (!development) development = await db.developmentProject.create({ data: { organizationId: organization.id, name: 'Cedar Heights', city: 'Islamabad', address: 'G-11 Markaz', description: 'A mid-rise residential project with scheduled installment options.' } })
  await db.developmentUnit.upsert({ where: { projectId_unitNumber: { projectId: development.id, unitNumber: '12B' } }, update: {}, create: { projectId: development.id, unitNumber: '12B', floor: 12, bedrooms: 3, areaSqft: 1650, price: 38500000 } })
  if (!(await db.stayListing.findFirst({ where: { organizationId: organization.id, title: 'Garden suite near F-10' } }))) await db.stayListing.create({ data: { organizationId: organization.id, title: 'Garden suite near F-10', city: 'Islamabad', address: 'F-10', description: 'A furnished, quiet apartment for work trips and city visits.', imageUrl: homes[0].imageUrl, nightlyRate: 18500, maxGuests: 3, bedrooms: 2 } })

  console.log(`Seeded ${listingCatalog.length + 2} live sample listings across ${cities.length} cities, a review queue, development and stay examples, and eleven demo users.`)
}

main().finally(() => db.$disconnect())
