import { PrismaClient, PropertyPurpose, PropertyType, Role, ListingStatus, LeadStage, ViewingMode, ViewingStatus, OfferStatus, ApplicationStatus, LeaseStatus, InvoiceStatus, PaymentMethod, UnitStatus, MaintenanceStatus, Priority } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const db = new PrismaClient()
const photo = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`
const homes = [
  { slug: 'sunlit-apartment-f-11', title: 'Sunlit apartment with a garden view', city: 'Islamabad', community: 'F-11', purpose: PropertyPurpose.SALE, type: PropertyType.APARTMENT, price: 28500000, bedrooms: 3, bathrooms: 3, areaSqft: 1850, imageUrl: photo(33054912), description: 'A bright, generous home with thoughtfully planned living spaces, a calm garden outlook, and everyday essentials nearby.' },
  { slug: 'family-home-bahria-town', title: 'A family home on a quiet street', city: 'Islamabad', community: 'Bahria Town', purpose: PropertyPurpose.SALE, type: PropertyType.HOUSE, price: 54000000, bedrooms: 5, bathrooms: 5, areaSqft: 4200, imageUrl: photo(34188579), description: 'Room to grow in a well-kept family home with a welcoming entrance, bright interiors, and a peaceful neighborhood feel.' },
  { slug: 'modern-flat-dha-lahore', title: 'Modern city apartment, ready to move in', city: 'Lahore', community: 'DHA Phase 6', purpose: PropertyPurpose.RENT, type: PropertyType.APARTMENT, price: 185000, bedrooms: 2, bathrooms: 2, areaSqft: 1450, imageUrl: photo(34956623), description: 'An easy-to-maintain city apartment with a balanced layout, warm natural light, and shops and cafes a short drive away.' },
  { slug: 'contemporary-villa-karachi', title: 'Contemporary villa with room to unwind', city: 'Karachi', community: 'DHA Phase 8', purpose: PropertyPurpose.SALE, type: PropertyType.VILLA, price: 89000000, bedrooms: 4, bathrooms: 5, areaSqft: 5100, imageUrl: photo(35386183), description: 'A refined villa with flexible spaces for hosting, quiet evenings, and comfortable everyday living.' },
  { slug: 'bahria-studio-rawalpindi', title: 'Light-filled studio near the park', city: 'Rawalpindi', community: 'Bahria Town', purpose: PropertyPurpose.RENT, type: PropertyType.STUDIO, price: 95000, bedrooms: 1, bathrooms: 1, areaSqft: 720, imageUrl: photo(15251055), description: 'A smart studio with an open plan, a tidy kitchen, and a leafy park close by.' },
  { slug: 'gulberg-penthouse-lahore', title: 'A calm penthouse above the city', city: 'Lahore', community: 'Gulberg', purpose: PropertyPurpose.SALE, type: PropertyType.PENTHOUSE, price: 76000000, bedrooms: 4, bathrooms: 4, areaSqft: 3600, imageUrl: photo(22743872), description: 'A generous top-floor residence with long city views, gracious rooms, and an inviting terrace.' },
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
const demoPhotos = {
  home: [photo(34188579), photo(35386183), photo(34804512), photo(36241380), photo(33752181), photo(34956623), photo(33054912), photo(31656156), photo(30509382), photo(15251055), photo(22743872), photo(16869705), photo(7166945), photo(32642370), photo(28354506), photo(12792317)],
  commercial: [photo(35158336), photo(33827307), photo(32216281), photo(33393712), photo(33342702), photo(15465916), photo(31673633), photo(14191431), photo(32456063), photo(7534232)],
  industrial: [photo(31771243), photo(34315423), photo(8556704), photo(17937093), photo(15177112)],
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
    { name: 'Amina Farooq', email: 'buyer2@propsphere.local', role: Role.BUYER, accountType: 'BUYER' },
    { name: 'Raza Mahmood', email: 'buyer3@propsphere.local', role: Role.BUYER, accountType: 'BUYER' },
    { name: 'Hira Javed', email: 'buyer4@propsphere.local', role: Role.BUYER, accountType: 'BUYER' },
    { name: 'Daniyal Sheikh', email: 'buyer5@propsphere.local', role: Role.BUYER, accountType: 'BUYER' },
    { name: 'Farah Zubair', email: 'owner2@propsphere.local', role: Role.OWNER, accountType: 'OWNER' },
    { name: 'Usman Qureshi', email: 'owner3@propsphere.local', role: Role.OWNER, accountType: 'OWNER' },
    { name: 'Sadia Ahmed', email: 'owner4@propsphere.local', role: Role.OWNER, accountType: 'OWNER' },
    { name: 'Noor Hassan', email: 'tenant2@propsphere.local', role: Role.TENANT, accountType: 'TENANT' },
    { name: 'Muneeb Aslam', email: 'tenant3@propsphere.local', role: Role.TENANT, accountType: 'TENANT' },
    { name: 'Iqra Malik', email: 'tenant4@propsphere.local', role: Role.TENANT, accountType: 'TENANT' },
  ] as const
  const users = new Map<string, { id: string; name: string; email: string }>()
  for (const person of people) {
    const accountType = 'accountType' in person ? person.accountType : undefined
    const user = await db.user.upsert({ where: { email: person.email }, update: { passwordHash, name: person.name, role: person.role, ...(accountType ? { accountType } : {}) }, create: { organizationId: organization.id, ...person, passwordHash } })
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
  // Give every seeded owner a real portfolio sample while retaining the fixed 150-listing catalog.
  for (const [index, email] of ['owner2@propsphere.local', 'owner3@propsphere.local', 'owner4@propsphere.local'].entries()) {
    const property = await db.property.findUnique({ where: { slug: supplementalHomes[15 + index].slug } })
    const person = users.get(email)!
    if (property) await db.property.update({ where: { id: property.id }, data: { createdById: person.id } })
  }

  const rentalPhotos = demoPhotos.home.slice(0, 3)
  const rental = await db.property.upsert({ where: { slug: 'garden-apartment-islamabad' }, update: { price: 210000, isDemo: true, verified: false, imageUrl: rentalPhotos[0], galleryUrls: rentalPhotos }, create: { organizationId: organization.id, createdById: owner.id, slug: 'garden-apartment-islamabad', title: 'Garden apartment in a quiet Islamabad block', description: 'Sample rental for the PropSphere product demo. Details and availability are illustrative.', city: 'Islamabad', community: 'F-10', purpose: PropertyPurpose.RENT, type: PropertyType.APARTMENT, price: 210000, bedrooms: 3, bathrooms: 2, areaSqft: 1680, imageUrl: rentalPhotos[0], galleryUrls: rentalPhotos, isDemo: true, verified: false, status: ListingStatus.PUBLISHED } })
  const applicationPhotos = demoPhotos.home.slice(3, 6)
  const applicationProperty = await db.property.upsert({ where: { slug: 'family-apartment-i8-islamabad' }, update: { price: 195000, isDemo: true, verified: false, imageUrl: applicationPhotos[0], galleryUrls: applicationPhotos }, create: { organizationId: organization.id, createdById: owner.id, slug: 'family-apartment-i8-islamabad', title: 'Family apartment close to the I-8 market', description: 'Sample rental for the PropSphere product demo. Details and availability are illustrative.', city: 'Islamabad', community: 'I-8', purpose: PropertyPurpose.RENT, type: PropertyType.APARTMENT, price: 195000, bedrooms: 3, bathrooms: 2, areaSqft: 1540, imageUrl: applicationPhotos[0], galleryUrls: applicationPhotos, isDemo: true, verified: false, status: ListingStatus.PUBLISHED } })
  await db.property.upsert({ where: { slug: 'submitted-house-blue-area' }, update: { isDemo: true, imageUrl: demoPhotos.home[6], galleryUrls: [0, 1, 2].map((offset) => demoPhotos.home[(6 + offset) % demoPhotos.home.length]) }, create: { organizationId: organization.id, createdById: admin.id, slug: 'submitted-house-blue-area', title: 'Newly renovated home near Blue Area', description: 'Illustrative listing submitted for the PropSphere review workflow.', city: 'Islamabad', community: 'G-6', purpose: PropertyPurpose.SALE, type: PropertyType.HOUSE, price: 46500000, bedrooms: 4, bathrooms: 4, areaSqft: 3100, imageUrl: demoPhotos.home[6], galleryUrls: [0, 1, 2].map((offset) => demoPhotos.home[(6 + offset) % demoPhotos.home.length]), isDemo: true, status: ListingStatus.PENDING_REVIEW } })

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
  const starterStay = await db.stayListing.findFirst({ where: { organizationId: organization.id, title: 'Garden suite near F-10' } })
  if (!starterStay) await db.stayListing.create({ data: { organizationId: organization.id, title: 'Garden suite near F-10', city: 'Islamabad', address: 'F-10', description: 'A furnished, quiet apartment for work trips and city visits.', imageUrl: demoPhotos.home[0], nightlyRate: 18500, maxGuests: 3, bedrooms: 2 } })
  else await db.stayListing.update({ where: { id: starterStay.id }, data: { imageUrl: demoPhotos.home[0] } })

  // Expand every admin and operations list with stable, repeatable demo rows.
  // Existing records are looked up by a deterministic marker so db:seed can be rerun safely.
  const saleProperties = await db.property.findMany({ where: { organizationId: organization.id, purpose: PropertyPurpose.SALE, status: ListingStatus.PUBLISHED }, orderBy: { slug: 'asc' }, take: 30 })
  const rentProperties = await db.property.findMany({ where: { organizationId: organization.id, purpose: PropertyPurpose.RENT, status: ListingStatus.PUBLISHED }, orderBy: { slug: 'asc' }, take: 30 })
  const clients = [buyer, tenant, ...[2, 3, 4, 5].map((n) => users.get(`buyer${n}@propsphere.local`)!), ...[2, 3, 4].map((n) => users.get(`tenant${n}@propsphere.local`)!)]
  const stages = [LeadStage.NEW, LeadStage.CONTACTED, LeadStage.QUALIFIED, LeadStage.VIEWING, LeadStage.NEGOTIATION, LeadStage.OFFER, LeadStage.CONTRACT, LeadStage.WON, LeadStage.LOST]

  // 12 review cards, separate from public/published inventory.
  for (let i = 0; i < 12; i++) {
    const slug = `review-sample-${String(i + 1).padStart(2, '0')}`
    const found = await db.property.findUnique({ where: { slug } })
    const source = saleProperties[i % saleProperties.length] || sale
    if (!found) {
      await db.property.create({ data: { organizationId: organization.id, createdById: admin.id, slug, title: `Review queue · ${source.title}`, description: `Illustrative admin review sample ${i + 1}. Confirm owner details, photos and pricing before approving.`, city: source.city, community: source.community, purpose: source.purpose, type: source.type, price: source.price, bedrooms: source.bedrooms, bathrooms: source.bathrooms, areaSqft: source.areaSqft, imageUrl: demoPhotos.home[i % demoPhotos.home.length], galleryUrls: [0, 1, 2].map((offset) => demoPhotos.home[(i + offset) % demoPhotos.home.length]), isDemo: true, status: ListingStatus.PENDING_REVIEW } })
    } else {
      await db.property.update({ where: { id: found.id }, data: { imageUrl: demoPhotos.home[i % demoPhotos.home.length], galleryUrls: [0, 1, 2].map((offset) => demoPhotos.home[(i + offset) % demoPhotos.home.length]) } })
    }
  }

  // Build a balanced CRM pipeline and an inbox with real, linked property/customer records.
  for (let i = 0; i < 15; i++) {
    const marker = `Demo CRM sample ${i + 1}`
    let lead = await db.lead.findFirst({ where: { organizationId: organization.id, notes: marker } })
    if (!lead) lead = await db.lead.create({ data: { organizationId: organization.id, propertyId: saleProperties[i % saleProperties.length]?.id, customerId: clients[i % clients.length].id, assignedToId: agents[i % agents.length].id, name: `Marketplace enquiry ${String(i + 1).padStart(2, '0')}`, email: clients[i % clients.length].email, phone: `+92 300 555 ${String(1000 + i)}`, budget: 18000000 + i * 1750000, preferredCity: cities[i % cities.length].city, stage: stages[i % stages.length], notes: marker } })
    if (!(await db.leadActivity.findFirst({ where: { leadId: lead.id, body: marker } }))) await db.leadActivity.create({ data: { leadId: lead.id, actorId: agents[i % agents.length].id, kind: 'DEMO_NOTE', body: marker } })

    const property = saleProperties[i % saleProperties.length] || sale
    const client = clients[i % clients.length]
    const message = `Demo conversation ${String(i + 1).padStart(2, '0')}: please share details for ${property.title}.`
    let inquiry = await db.inquiry.findFirst({ where: { organizationId: organization.id, senderId: client.id, propertyId: property.id, message } })
    if (!inquiry) inquiry = await db.inquiry.create({ data: { organizationId: organization.id, propertyId: property.id, senderId: client.id, message } })
    if (!(await db.inquiryMessage.findFirst({ where: { inquiryId: inquiry.id, body: message } }))) await db.inquiryMessage.create({ data: { inquiryId: inquiry.id, senderId: client.id, body: message } })
    const reply = `Thanks for your interest. Our team will follow up about ${property.community}.`
    if (!(await db.inquiryMessage.findFirst({ where: { inquiryId: inquiry.id, body: reply } }))) await db.inquiryMessage.create({ data: { inquiryId: inquiry.id, senderId: agents[i % agents.length].id, body: reply } })

    const viewingNotes = `Demo viewing ${i + 1}`
    if (!(await db.viewing.findFirst({ where: { organizationId: organization.id, notes: viewingNotes } }))) await db.viewing.create({ data: { organizationId: organization.id, propertyId: property.id, requesterId: client.id, agentId: agents[i % agents.length].id, scheduledAt: new Date(Date.now() + (i + 2) * 86400000), mode: i % 2 ? ViewingMode.VIDEO : ViewingMode.IN_PERSON, status: i % 5 === 0 ? ViewingStatus.REQUESTED : ViewingStatus.CONFIRMED, notes: viewingNotes } })

    const appProperty = rentProperties[i % rentProperties.length] || applicationProperty
    if (!(await db.rentalApplication.findFirst({ where: { organizationId: organization.id, propertyId: appProperty.id, applicantId: tenant.id, message: `Demo rental application ${i + 1}` } }))) await db.rentalApplication.create({ data: { organizationId: organization.id, propertyId: appProperty.id, applicantId: tenant.id, monthlyIncome: 350000 + i * 25000, employment: i % 2 ? 'Business owner' : 'Salaried professional', message: `Demo rental application ${i + 1}`, status: [ApplicationStatus.SUBMITTED, ApplicationStatus.REVIEWING, ApplicationStatus.APPROVED][i % 3] } })

    const offerProperty = saleProperties[i % saleProperties.length] || sale
    if (!(await db.offer.findFirst({ where: { organizationId: organization.id, propertyId: offerProperty.id, buyerId: buyer.id, message: `Demo offer ${i + 1}` } }))) await db.offer.create({ data: { organizationId: organization.id, propertyId: offerProperty.id, buyerId: buyer.id, amount: Math.max(1000000, Math.round(Number(offerProperty.price) * (0.82 + (i % 8) * 0.02))), message: `Demo offer ${i + 1}`, status: [OfferStatus.SUBMITTED, OfferStatus.COUNTERED, OfferStatus.ACCEPTED, OfferStatus.REJECTED][i % 4] } })
  }

  // Admin-specific lists: active risk review, audit trail, and configurable workspace settings.
  const riskCategories = ['Listing verification', 'Payment review', 'Duplicate account', 'Unusual activity']
  for (let i = 0; i < 12; i++) {
    const description = `Demo risk sample ${i + 1}: ${['verify listing ownership documents', 'review an unusual payment pattern', 'confirm this account information', 'check repeated listing submissions'][i % 4]}.`
    if (!(await db.riskFlag.findFirst({ where: { organizationId: organization.id, description } }))) await db.riskFlag.create({ data: { organizationId: organization.id, createdById: admin.id, category: riskCategories[i % riskCategories.length], description, severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][i % 4], status: i % 4 === 0 ? 'RESOLVED' : 'OPEN', ...(i % 4 === 0 ? { resolvedById: admin.id, resolvedAt: new Date() } : {}) } })
    const action = `demo.seeded_sample_${i + 1}`
    if (!(await db.auditLog.findFirst({ where: { organizationId: organization.id, action } }))) await db.auditLog.create({ data: { organizationId: organization.id, actorId: admin.id, action, entity: ['Property', 'Lead', 'Viewing', 'Organization'][i % 4], entityId: saleProperties[i % saleProperties.length]?.id, details: { sample: true, row: i + 1 } } })
  }
  const settings = [
    ['organizationName', organization.name], ['supportEmail', 'support@propsphere.local'], ['timezone', 'Asia/Karachi'], ['defaultCurrency', 'PKR'], ['defaultLocale', 'en-PK'], ['listingReviewRequired', 'true'], ['inquiryAutoReply', 'true'], ['savedSearchAlerts', 'true'], ['maintenanceSlaHours', '48'], ['invoiceDueDays', '5'], ['contactPhone', '+92 300 555 0100'], ['brandAccent', '#168b7a'],
  ]
  for (const [key, value] of settings) await db.organizationSetting.upsert({ where: { organizationId_key: { organizationId: organization.id, key } }, update: {}, create: { organizationId: organization.id, key, value: { value } } })

  // Property operations: fill landlord portfolio, leases, rent ledger, and payment history.
  for (let i = 0; i < 12; i++) {
    const property = rentProperties[i % rentProperties.length] || rental
    const renter = clients[i % clients.length]
    const unit = await db.propertyUnit.upsert({ where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: `DEMO-${String(i + 1).padStart(2, '0')}` } }, update: {}, create: { organizationId: organization.id, propertyId: property.id, unitNumber: `DEMO-${String(i + 1).padStart(2, '0')}`, bedrooms: Math.max(0, property.bedrooms), monthlyRent: Number(property.price), status: i % 4 === 0 ? UnitStatus.OCCUPIED : UnitStatus.VACANT } })
    let demoLease = await db.lease.findFirst({ where: { organizationId: organization.id, propertyId: property.id, tenantId: renter.id, ownerId: owner.id } })
    if (!demoLease) demoLease = await db.lease.create({ data: { organizationId: organization.id, propertyId: property.id, unitId: unit.id, tenantId: renter.id, ownerId: owner.id, startDate: new Date(Date.now() - (i + 1) * 45 * 86400000), endDate: new Date(Date.now() + (12 - i) * 45 * 86400000), monthlyRent: Number(property.price), deposit: Number(property.price), status: i % 5 === 0 ? LeaseStatus.EXPIRING : LeaseStatus.ACTIVE } })
    const periodStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const invoiceStatus = [InvoiceStatus.DUE, InvoiceStatus.PARTIAL, InvoiceStatus.PAID, InvoiceStatus.OVERDUE][i % 4]
    const paid = invoiceStatus === InvoiceStatus.PAID ? Number(property.price) : invoiceStatus === InvoiceStatus.PARTIAL ? Math.round(Number(property.price) * 0.4) : 0
    const invoice = await db.rentInvoice.upsert({ where: { leaseId_periodStart: { leaseId: demoLease.id, periodStart } }, update: {}, create: { leaseId: demoLease.id, periodStart, periodEnd, dueDate: periodStart, amount: Number(property.price), amountPaid: paid, status: invoiceStatus } })
    if (paid > 0 && !(await db.payment.findUnique({ where: { reference: `PS-DEMO-LEDGER-${i + 1}` } }))) await db.payment.create({ data: { invoiceId: invoice.id, payerId: renter.id, amount: paid, method: PaymentMethod.BANK_TRANSFER, reference: `PS-DEMO-LEDGER-${i + 1}` } })
  }

  // Maintenance queue and corresponding vendor invoices.
  for (let i = 0; i < 12; i++) {
    const property = rentProperties[i % rentProperties.length] || rental
    const title = `Demo maintenance ${String(i + 1).padStart(2, '0')} · ${['Heating check', 'Kitchen plumbing', 'Entry lock service', 'Electrical inspection'][i % 4]}`
    let job = await db.maintenanceRequest.findFirst({ where: { organizationId: organization.id, title } })
    if (!job) job = await db.maintenanceRequest.create({ data: { organizationId: organization.id, propertyId: property.id, requesterId: tenant.id, vendorId: vendor.id, title, description: 'Illustrative maintenance work order for the demo workspace.', category: ['HVAC', 'Plumbing', 'Security', 'Electrical'][i % 4], priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4] as Priority, status: MaintenanceStatus.COMPLETED, quotedCost: 3500 + i * 1250, slaDueAt: new Date(Date.now() + 5 * 86400000) } })
    const invoiceReference = `DEMO-NORTH-${String(i + 1).padStart(4, '0')}`
    if (!(await db.vendorBill.findUnique({ where: { maintenanceRequestId: job.id } }))) await db.vendorBill.create({ data: { organizationId: organization.id, vendorId: vendor.id, maintenanceRequestId: job.id, invoiceReference, description: `Service visit and materials for ${title}`, amount: 3500 + i * 1250, status: ['PENDING', 'APPROVED', 'PAID'][i % 3], reviewedById: i % 3 === 0 ? null : admin.id, reviewedAt: i % 3 === 0 ? null : new Date(), paidAt: i % 3 === 2 ? new Date() : null } })
  }

  // Each salesperson gets a useful task list; buyers and tenants each get saved searches.
  for (const [agentIndex, salesperson] of agents.entries()) for (let i = 0; i < 12; i++) {
    const title = `Demo follow-up ${i + 1}: ${['call customer', 'confirm viewing', 'send property details', 'update offer status'][i % 4]}`
    const assignedTitle = `${title} · ${agentIndex + 1}`
    if (!(await db.task.findFirst({ where: { organizationId: organization.id, assignedToId: salesperson.id, title: assignedTitle } }))) await db.task.create({ data: { organizationId: organization.id, assignedToId: salesperson.id, title: assignedTitle, dueAt: new Date(Date.now() + (i + 1) * 86400000), ...(i % 6 === 0 ? { completedAt: new Date() } : {}) } })
  }
  for (const customer of clients) for (let i = 0; i < 12; i++) {
    const name = `Saved search ${i + 1} · ${cities[i % cities.length].city}`
    if (!(await db.savedSearch.findFirst({ where: { userId: customer.id, name } }))) await db.savedSearch.create({ data: { userId: customer.id, name, filters: { city: cities[i % cities.length].city, purpose: i % 2 ? 'RENT' : 'SALE', maxPrice: String(15000000 + i * 2500000) }, alertEnabled: i % 4 !== 0 } })
  }

  // Developments and short stays, with real linked units/reservations/bookings.
  for (let i = 0; i < 12; i++) {
    const name = `Demo development ${String(i + 1).padStart(2, '0')}`
    let project = await db.developmentProject.findFirst({ where: { organizationId: organization.id, name } })
    if (!project) project = await db.developmentProject.create({ data: { organizationId: organization.id, name, city: cities[i % cities.length].city, address: cities[i % cities.length].areas[0], description: 'Illustrative mixed-use development project and unit inventory.', status: ['PLANNING', 'ACTIVE', 'SELLING'][i % 3] } })
    for (let unitIndex = 0; unitIndex < 2; unitIndex++) await db.developmentUnit.upsert({ where: { projectId_unitNumber: { projectId: project.id, unitNumber: `D${i + 1}-${unitIndex + 1}` } }, update: {}, create: { projectId: project.id, unitNumber: `D${i + 1}-${unitIndex + 1}`, floor: unitIndex + 2, bedrooms: unitIndex + 1, areaSqft: 850 + i * 60 + unitIndex * 150, price: 9500000 + i * 1800000 + unitIndex * 900000, status: unitIndex === 1 && i < 10 ? 'RESERVED' : 'AVAILABLE' } })
    const reservedUnit = await db.developmentUnit.findUnique({ where: { projectId_unitNumber: { projectId: project.id, unitNumber: `D${i + 1}-2` } } })
    if (i < 10 && reservedUnit && !(await db.reservation.findFirst({ where: { organizationId: organization.id, unitId: reservedUnit.id, customerEmail: `reservation${i + 1}@propsphere.local` } }))) {
      const reservation = await db.reservation.create({ data: { organizationId: organization.id, unitId: reservedUnit.id, customerName: `Demo buyer ${i + 1}`, customerEmail: `reservation${i + 1}@propsphere.local`, customerPhone: `+92 300 555 ${2000 + i}`, deposit: 500000 + i * 50000, status: i % 3 === 0 ? 'CONFIRMED' : 'PENDING' } })
      await db.installment.createMany({ data: [1, 2].map((n) => ({ reservationId: reservation.id, title: `Demo installment ${n}`, amount: 1200000 + i * 60000, dueDate: new Date(Date.now() + n * 30 * 86400000), status: n === 1 && i % 2 === 0 ? 'PAID' : 'DUE', paidAt: n === 1 && i % 2 === 0 ? new Date() : null })) })
    }
  }
  for (let i = 0; i < 12; i++) {
    const title = `Demo short stay ${String(i + 1).padStart(2, '0')} · ${cities[i % cities.length].city}`
    let stay = await db.stayListing.findFirst({ where: { organizationId: organization.id, title } })
    if (!stay) stay = await db.stayListing.create({ data: { organizationId: organization.id, title, city: cities[i % cities.length].city, address: cities[i % cities.length].areas[0], description: 'Illustrative furnished short-stay home with verified host details and flexible booking.', imageUrl: demoPhotos.home[i % demoPhotos.home.length], nightlyRate: 12000 + i * 1500, maxGuests: 2 + i % 4, bedrooms: 1 + i % 3 } })
    else stay = await db.stayListing.update({ where: { id: stay.id }, data: { imageUrl: demoPhotos.home[i % demoPhotos.home.length] } })
    const checkIn = new Date(Date.now() + (40 + i * 3) * 86400000)
    const checkOut = new Date(checkIn.getTime() + 3 * 86400000)
    if (!(await db.stayBooking.findFirst({ where: { organizationId: organization.id, stayId: stay.id, guestId: buyer.id } }))) await db.stayBooking.create({ data: { organizationId: organization.id, stayId: stay.id, guestId: buyer.id, checkIn, checkOut, guests: 2, nightlyRate: stay.nightlyRate, totalAmount: Number(stay.nightlyRate) * 3, status: i % 4 === 0 ? 'CONFIRMED' : 'REQUESTED' } })
  }

  // Finance dashboards show enough sample transactions to exercise table, filters and totals.
  for (let i = 0; i < 12; i++) {
    const property = rentProperties[i % rentProperties.length] || rental
    const description = `Demo operating expense ${i + 1} · ${['repairs', 'utilities', 'cleaning', 'insurance'][i % 4]}`
    if (!(await db.expense.findFirst({ where: { organizationId: organization.id, description } }))) await db.expense.create({ data: { organizationId: organization.id, propertyId: property.id, category: ['Repairs', 'Utilities', 'Cleaning', 'Insurance'][i % 4], description, amount: 5000 + i * 2250, incurredAt: new Date(Date.now() - i * 86400000), createdById: admin.id } })
    const period = `2026-${String((i % 12) + 1).padStart(2, '0')}`
    if (!(await db.ownerPayout.findFirst({ where: { organizationId: organization.id, ownerId: owner.id, period } }))) await db.ownerPayout.create({ data: { organizationId: organization.id, ownerId: owner.id, amount: 150000 + i * 12000, period, reference: `DEMO-PAYOUT-${i + 1}`, status: i % 3 === 0 ? 'PAID' : 'PENDING', paidAt: i % 3 === 0 ? new Date() : null } })
  }

  console.log(`Seeded ${listingCatalog.length + 2} published demo listings across ${cities.length} cities plus linked demo records for admin and workspace screens.`)
}

main().finally(() => db.$disconnect())
