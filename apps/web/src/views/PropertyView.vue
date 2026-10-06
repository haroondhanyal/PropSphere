<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, BadgeCheck, Bath, BedDouble, Building2, Heart, MapPin, MoveUpRight, Navigation, Share2 } from 'lucide-vue-next'
import { api, hasSessionToken, mediaUrl } from '../api'
import PropertyGrid from '../components/PropertyGrid.vue'
import type { Property } from '../types'
import { useSessionStore } from '../stores/session'
const route = useRoute(); const router = useRouter(); const session = useSessionStore()
const property = ref<Property | null>(null); const related = ref<Property[]>([]); const loading = ref(true)
const favorites = ref<string[]>(JSON.parse(localStorage.getItem('propsphere-favorites') || '[]'))
const saved = computed(() => property.value ? favorites.value.includes(property.value.id) : false)
const galleryImages = computed(() => { if (!property.value) return []; const images = [property.value.imageUrl, ...(property.value.galleryUrls || [])].filter(Boolean); return [...new Set(images)].slice(0, 12) })
const price = computed(() => property.value ? property.value.purpose === 'RENT' ? `PKR ${Number(property.value.price).toLocaleString()} / month` : `PKR ${(Number(property.value.price) / 10000000).toFixed(2)} Cr` : '')
const directionsUrl = computed(() => property.value ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([property.value.streetAddress, property.value.community, property.value.city].filter(Boolean).join(', '))}` : '#')
const contactOpen = ref(false); const contactMessage = ref(''); const contactPhone = ref(''); const contactError = ref(''); const contactSaving = ref(false)
async function load() {
  loading.value = true
  try { property.value = (await api.get(`/properties/slug/${route.params.slug}`)).data }
  catch { property.value = null }
  finally { loading.value = false }
  if (!property.value) return
  if (hasSessionToken()) {
    try {
      const favoritesResult = await api.get<Property[]>('/properties/favorites')
      favorites.value = favoritesResult.data.map((item) => item.id)
      localStorage.setItem('propsphere-favorites', JSON.stringify(favorites.value))
    } catch { /* Keep the local shortlist visible if the API is temporarily unavailable. */ }
  }
  try {
    const propertyId = property.value.id
    const result = await api.get('/properties', { params: { city: property.value.city, take: 7 } })
    related.value = result.data.filter((item: Property) => item.id !== propertyId).slice(0, 6)
  } catch { related.value = [] }
}
async function toggleSave() {
  if (!property.value) return
  const wasSaved = saved.value
  favorites.value = wasSaved ? favorites.value.filter((id) => id !== property.value?.id) : [...favorites.value, property.value.id]
  localStorage.setItem('propsphere-favorites', JSON.stringify(favorites.value))
  window.dispatchEvent(new Event('favorites-updated'))
  if (hasSessionToken()) {
    try {
      if (wasSaved) await api.delete(`/properties/${property.value.id}/favorite`)
      else await api.post(`/properties/${property.value.id}/favorite`)
    } catch {
      favorites.value = wasSaved ? [...favorites.value, property.value.id] : favorites.value.filter((id) => id !== property.value?.id)
      localStorage.setItem('propsphere-favorites', JSON.stringify(favorites.value))
      window.dispatchEvent(new Event('favorites-updated'))
    }
  }
}
async function shareProperty() { if (!property.value) return; if (navigator.share) await navigator.share({ title: property.value.title, url: window.location.href }); else await navigator.clipboard.writeText(window.location.href) }
function startInquiry() { if (!session.session) { void router.push(`/login?next=${encodeURIComponent(route.fullPath)}`); return } contactOpen.value = true }
async function submitInquiry() { if (!property.value) return; contactSaving.value = true; contactError.value = ''; try { await api.post('/inquiries', { propertyId: property.value.id, message: contactMessage.value, phone: contactPhone.value || undefined }); contactOpen.value = false; contactMessage.value = ''; contactPhone.value = '' } catch (e: any) { contactError.value = e.response?.data?.message || 'Could not send inquiry.' } finally { contactSaving.value = false } }
function scheduleViewing() { void router.push(session.session ? '/workspace/viewings' : `/login?next=${encodeURIComponent('/workspace/viewings')}`) }
onMounted(load)
</script>
<template><div class="page-container detail-page"><RouterLink class="back-link" to="/search"><ArrowLeft :size="16"/> Back to search</RouterLink><div v-if="loading" class="detail-loading">Loading property…</div><div v-else-if="!property" class="empty-state"><h3>We couldn't find that listing</h3><p>It may have been removed or the link may be incorrect.</p><RouterLink class="button button-dark" to="/search">Browse properties</RouterLink></div><template v-else>
  <div class="detail-heading"><div><div class="eyebrow muted-eyebrow">{{property.purpose==='SALE'?'FOR SALE':'FOR RENT'}}<span v-if="property.verified"> · VERIFIED LISTING</span></div><h1>{{property.title}}</h1><p class="muted"><MapPin :size="16"/> {{property.streetAddress || property.community}}, {{property.city}}</p></div><div class="detail-actions"><button class="button button-outline" @click="toggleSave"><Heart :size="16" :fill="saved?'currentColor':'none'"/> {{saved?'Saved':'Save'}}</button><button class="button button-outline" @click="shareProperty"><Share2 :size="16"/> Share</button></div></div>
  <div class="property-media-gallery"><template v-for="(image,index) in galleryImages" :key="image"><video v-if="/\.(mp4|webm|mov)(\?|$)/i.test(image)" :src="mediaUrl(image)" controls playsinline :class="{'media-featured':index===0}"/><img v-else :src="mediaUrl(image)" :alt="`${property.title} photo ${index+1}`" :class="{'media-featured':index===0}"/></template></div>
  <div class="detail-layout"><article class="detail-main"><div v-if="property.isDemo" class="notice">Demo sample: details and photos are illustrative, not a live property offer.</div><div class="detail-facts"><div v-if="property.bedrooms"><BedDouble/><b>{{property.bedrooms}}</b><span>Bedrooms</span></div><div v-if="property.bedrooms"><Bath/><b>{{property.bathrooms}}</b><span>Bathrooms</span></div><div><MoveUpRight/><b>{{property.areaSqft.toLocaleString()}}</b><span>Square feet</span></div><div v-if="property.floors != null"><Building2/><b>{{property.floors}}</b><span>Floors</span></div></div><section class="detail-section"><h2>About this property</h2><p>{{property.description}}</p></section><section class="detail-section"><h2>Property details</h2><div class="detail-table"><span>Property type</span><b>{{property.type}}</b><span>Purpose</span><b>{{property.purpose==='SALE'?'For sale':'For rent'}}</b><span>Community</span><b>{{property.community}}</b><span>Street / address</span><b>{{property.streetAddress || 'Area level location'}}</b><span>Floors</span><b>{{property.floors ?? 'Not specified'}}</b><span>Listing reference</span><b>{{property.id.slice(0,8).toUpperCase()}}</b></div></section><section class="detail-section map-placeholder"><MapPin :size="24"/><div><b>{{property.streetAddress || property.community}}, {{property.city}}</b><p>Get directions to the listing with Google Maps.</p></div><a class="button button-outline" :href="directionsUrl" target="_blank" rel="noopener noreferrer"><Navigation :size="15"/> Directions</a></section></article><aside class="contact-card"><div class="price-label">{{property.purpose==='RENT'?'Monthly rent':'Asking price'}}</div><h2>{{price}}</h2><div v-if="property.verified" class="verified-line"><BadgeCheck :size="17"/> Verified listing</div><hr/><div class="agent-row"><div class="agent-avatar">PS</div><div><b>PropSphere team</b><small>Listing support</small></div></div><button class="button button-primary full-button" @click="startInquiry">Contact about this home</button><button class="button button-outline full-button" @click="scheduleViewing">Schedule a viewing</button><small class="safe-note">Your inquiry creates an agent follow-up.</small></aside></div>
  <section v-if="related.length" class="related-properties"><div class="section-heading"><div><div class="eyebrow muted-eyebrow">NEARBY HOMES</div><h2>More properties you may like</h2></div><RouterLink class="text-link" :to="`/search?city=${encodeURIComponent(property.city)}`">See all nearby</RouterLink></div><PropertyGrid :properties="related"/></section>
  <div v-if="contactOpen" class="modal-backdrop" @click.self="contactOpen=false"><form class="panel-card lease-modal" @submit.prevent="submitInquiry"><button type="button" class="modal-close" aria-label="Close" @click="contactOpen=false"><span>×</span></button><div class="eyebrow muted-eyebrow">PROPERTY INQUIRY</div><h2>Ask about this home</h2><p>{{property.title}} · {{property.community}}, {{property.city}}</p><div v-if="contactError" class="form-error">{{contactError}}</div><label class="modal-label">Phone number (optional)<input v-model="contactPhone" type="tel" maxlength="40" autocomplete="tel" placeholder="+92 300 1234567"/></label><label class="modal-label">Your message<textarea v-model="contactMessage" rows="4" required maxlength="1200" placeholder="Tell the listing team what you'd like to know…"></textarea></label><small class="modal-hint">Your message creates a follow-up lead.</small><button class="button button-primary full-button" :disabled="contactSaving">{{contactSaving?'Sending…':'Send inquiry'}}</button></form></div>
</template></div></template>
