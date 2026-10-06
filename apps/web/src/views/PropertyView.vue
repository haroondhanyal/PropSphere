<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, BadgeCheck, Bath, BedDouble, Heart, MapPin, MoveUpRight, Share2 } from 'lucide-vue-next'
import { api } from '../api'
import type { Property } from '../types'
import { useSessionStore } from '../stores/session'
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const property = ref<Property | null>(null)
const loading = ref(true)
const favorites = ref<string[]>(JSON.parse(localStorage.getItem('propsphere-favorites') || '[]'))
const saved = computed(() => property.value ? favorites.value.includes(property.value.id) : false)
const galleryImages = computed(() => {
  if (!property.value) return []
  const images = (property.value.galleryUrls || []).filter(Boolean)
  const first = images[0] || property.value.imageUrl
  return [first, images[1] || first, images[2] || images[1] || first]
})
const price = computed(() => property.value ? property.value.purpose === 'RENT' ? `PKR ${Number(property.value.price).toLocaleString()} / month` : `PKR ${(Number(property.value.price) / 10000000).toFixed(2)} Cr` : '')
const contactOpen = ref(false)
const contactMessage = ref('')
const contactPhone = ref('')
const contactError = ref('')
const contactSaving = ref(false)
async function load() { loading.value = true; try { property.value = (await api.get(`/properties/slug/${route.params.slug}`)).data } catch { property.value = null } finally { loading.value = false } }
function toggleSave() { if (!property.value) return; favorites.value = saved.value ? favorites.value.filter((id) => id !== property.value?.id) : [...favorites.value, property.value.id]; localStorage.setItem('propsphere-favorites', JSON.stringify(favorites.value)) }
async function shareProperty() {
  if (!property.value) return
  if (navigator.share) await navigator.share({ title: property.value.title, url: window.location.href })
  else await navigator.clipboard.writeText(window.location.href)
}
function startInquiry() {
  if (!session.session) { void router.push(`/login?next=${encodeURIComponent(route.fullPath)}`); return }
  contactOpen.value = true
}
async function submitInquiry() {
  if (!property.value) return
  contactSaving.value = true
  contactError.value = ''
  try { await api.post('/inquiries', { propertyId: property.value.id, message: contactMessage.value, phone: contactPhone.value || undefined }); contactOpen.value = false; contactMessage.value = ''; contactPhone.value = '' }
  catch (e: any) { contactError.value = e.response?.data?.message || 'Could not send inquiry.' }
  finally { contactSaving.value = false }
}
function scheduleViewing() { void router.push(session.session ? '/workspace/viewings' : `/login?next=${encodeURIComponent('/workspace/viewings')}`) }
onMounted(load)
</script>

<template>
  <div class="page-container detail-page"><RouterLink class="back-link" to="/search"><ArrowLeft :size="16" /> Back to search</RouterLink><div v-if="loading" class="detail-loading">Loading property…</div><div v-else-if="!property" class="empty-state"><h3>We couldn't find that listing</h3><p>It may have been removed or the link may be incorrect.</p><RouterLink class="button button-dark" to="/search">Browse properties</RouterLink></div><template v-else>
    <div class="detail-heading"><div><div class="eyebrow muted-eyebrow">{{ property.purpose === 'SALE' ? 'FOR SALE' : 'FOR RENT' }} <span v-if="property.verified"> · VERIFIED LISTING</span></div><h1>{{ property.title }}</h1><p class="muted"><MapPin :size="16" /> {{ property.community }}, {{ property.city }}</p></div><div class="detail-actions"><button class="button button-outline" @click="toggleSave"><Heart :size="16" :fill="saved ? 'currentColor' : 'none'" /> {{ saved ? 'Saved' : 'Save' }}</button><button class="button button-outline" @click="shareProperty"><Share2 :size="16" /> Share</button></div></div>
    <div class="gallery"><img :src="galleryImages[0]" :alt="property.title" /><div class="gallery-side"><img :src="galleryImages[1]" :alt="`${property.title} second photo`" /><div class="gallery-more"><img :src="galleryImages[2]" :alt="`${property.title} third photo`" /><span>3 sample photos</span></div></div></div>
    <div class="detail-layout"><article class="detail-main"><div v-if="property.isDemo" class="notice">Demo sample: this listing, details, and photos are illustrative. It is not a live property offer.</div><div class="detail-facts"><div v-if="property.bedrooms"><BedDouble /><b>{{ property.bedrooms }}</b><span>Bedrooms</span></div><div v-if="property.bedrooms"><Bath /><b>{{ property.bathrooms }}</b><span>Bathrooms</span></div><div><MoveUpRight /><b>{{ property.areaSqft.toLocaleString() }}</b><span>Square feet</span></div></div><section class="detail-section"><h2>About this property</h2><p>{{ property.description }}</p></section><section class="detail-section"><h2>Home details</h2><div class="detail-table"><span>Property type</span><b>{{ property.type }}</b><span>Purpose</span><b>{{ property.purpose === 'SALE' ? 'For sale' : 'For rent' }}</b><span>Community</span><b>{{ property.community }}</b><span>Listing reference</span><b>{{ property.id.slice(0, 8).toUpperCase() }}</b></div></section><section class="detail-section map-placeholder"><MapPin :size="24" /><div><b>{{ property.community }}, {{ property.city }}</b><p>Location map integration is planned for a later phase.</p></div></section></article><aside class="contact-card"><div class="price-label">{{property.purpose==='RENT'?'Monthly rent':'Asking price'}}</div><h2>{{ price }}</h2><div v-if="property.verified" class="verified-line"><BadgeCheck :size="17" /> Verified listing</div><hr /><div class="agent-row"><div class="agent-avatar">PS</div><div><b>PropSphere team</b><small>Listing support</small></div></div><button class="button button-primary full-button" @click="startInquiry">Contact about this home</button><button class="button button-outline full-button" @click="scheduleViewing">Schedule a viewing</button><small class="safe-note">Your inquiry will also create an agent follow-up.</small></aside></div>
    <div v-if="contactOpen" class="modal-backdrop" @click.self="contactOpen=false"><form class="panel-card lease-modal" @submit.prevent="submitInquiry"><button type="button" class="modal-close" aria-label="Close" @click="contactOpen=false"><span>×</span></button><div class="eyebrow muted-eyebrow">PROPERTY INQUIRY</div><h2>Ask about this home</h2><p>{{property.title}} · {{property.community}}, {{property.city}}</p><div v-if="contactError" class="form-error">{{contactError}}</div><label class="modal-label">Phone number (optional)<input v-model="contactPhone" type="tel" maxlength="40" autocomplete="tel" placeholder="+92 300 1234567" /></label><label class="modal-label">Your message<textarea v-model="contactMessage" rows="4" required maxlength="1200" placeholder="Tell the listing team what you'd like to know…"></textarea></label><small class="modal-hint">Your message will create a follow-up lead in the agent workspace.</small><button class="button button-primary full-button" :disabled="contactSaving">{{contactSaving?'Sending…':'Send inquiry'}}</button></form></div>
  </template></div>
</template>
