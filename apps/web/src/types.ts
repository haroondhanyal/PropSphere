export interface Property {
  id: string
  slug: string
  title: string
  city: string
  community: string
  purpose: 'SALE' | 'RENT'
  type: string
  price: number
  bedrooms: number
  bathrooms: number
  areaSqft: number
  imageUrl: string
  description: string
  verified: boolean
  status: 'PUBLISHED' | 'PENDING_REVIEW'
  isDemo?: boolean
  galleryUrls?: string[]
  streetAddress?: string | null
  floors?: number | null
}

export interface Session {
  token: string
  user: { id: string; name: string; email: string; role: string; accountType?: string; phone?: string | null; avatarUrl?: string | null; organizationId: string; organizationName: string; organizations: { id: string; name: string; role: string }[] }
}
