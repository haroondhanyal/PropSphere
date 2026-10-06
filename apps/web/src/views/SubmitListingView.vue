<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-vue-next'
import { api } from '../api'
const router = useRouter()
const loading = ref(false)
const error = ref('')
const submitted = ref(false)
const files = ref<File[]>([])
const form = ref({ title: '', description: '', city: 'Islamabad', community: '', streetAddress: '', purpose: 'SALE', type: 'HOUSE', price: '', bedrooms: '3', bathrooms: '2', areaSqft: '', floors: '1', imageUrl: '' })
const totalBytes = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))
const sizeLabel = computed(() => `${(totalBytes.value / 1024 / 1024).toFixed(1)} / 50 MB`)
function selectFiles(event: Event) { files.value = Array.from((event.target as HTMLInputElement).files || []); error.value = files.value.length > 8 ? 'Choose up to 8 photos or videos.' : '' }
async function submit() {
  error.value = ''
  if (totalBytes.value > 50 * 1024 * 1024) { error.value = 'Images and videos must total 50 MB or less.'; return }
  if (!files.value.some((file) => file.type.startsWith('image/')) && !form.value.imageUrl.startsWith('https://')) { error.value = 'Add at least one property photo or a secure HTTPS photo URL.'; return }
  loading.value = true
  try {
    let imageUrl = form.value.imageUrl
    let galleryUrls: string[] = []
    if (files.value.length) {
      const data = new FormData(); files.value.forEach((file) => data.append('files', file)); data.append('totalBytes', String(totalBytes.value)); data.append('kind', 'property')
      const uploaded = await api.post('/properties/media', data)
      const imageIndex = files.value.findIndex((file) => file.type.startsWith('image/'))
      imageUrl = uploaded.data.urls[imageIndex]
      galleryUrls = uploaded.data.urls.filter((_: string, index: number) => index !== imageIndex)
    }
    await api.post('/properties', { ...form.value, imageUrl, galleryUrls, price: Number(form.value.price), bedrooms: Number(form.value.bedrooms), bathrooms: Number(form.value.bathrooms), areaSqft: Number(form.value.areaSqft), floors: Number(form.value.floors) })
    submitted.value = true
  } catch (e: any) { error.value = Array.isArray(e.response?.data?.message) ? e.response.data.message.join(', ') : e.response?.data?.message || e.message || 'Could not submit this listing.' }
  finally { loading.value = false }
}
</script>
<template><div class="page-container listing-form-page"><RouterLink class="back-link" to="/"><ArrowLeft :size="16" /> Back home</RouterLink><div v-if="submitted" class="success-card"><div class="success-icon"><CheckCircle2 :size="26" /></div><div class="eyebrow muted-eyebrow">SUBMITTED FOR REVIEW</div><h1>Your listing is in review</h1><p>Our team will review the details before it appears in public search results.</p><button class="button button-primary" @click="router.push('/')">Back to marketplace</button></div><template v-else><div class="page-heading"><div><div class="eyebrow muted-eyebrow">SELL OR RENT WITH PROPSPHERE</div><h1>List your property</h1><p>Add accurate details and real photos. Listings are reviewed before publication.</p></div></div><form class="listing-form" @submit.prevent="submit"><div v-if="error" class="form-error">{{ error }}</div><div class="form-grid"><label class="wide">Listing title<input v-model="form.title" required maxlength="100" placeholder="e.g. Bright family home in F-11" /></label><label>City<select v-model="form.city"><option>Islamabad</option><option>Rawalpindi</option><option>Lahore</option><option>Karachi</option><option>Peshawar</option><option>Faisalabad</option><option>Multan</option><option>Quetta</option><option>Hyderabad</option><option>Sialkot</option></select></label><label>Area / community<input v-model="form.community" required placeholder="e.g. F-11" /></label><label class="wide">Street address / location<input v-model="form.streetAddress" maxlength="240" placeholder="Street, block, or a nearby landmark" /></label><label>Listing purpose<select v-model="form.purpose"><option value="SALE">For sale</option><option value="RENT">For rent</option></select></label><label>Property type<select v-model="form.type"><option value="APARTMENT">Apartment</option><option value="HOUSE">House</option><option value="VILLA">Villa</option><option value="PENTHOUSE">Penthouse</option><option value="STUDIO">Studio</option><option value="OFFICE">Office</option><option value="SHOP">Shop</option><option value="COMMERCIAL">Commercial unit</option><option value="WAREHOUSE">Warehouse</option><option value="FACTORY">Factory</option><option value="LAND">Land</option></select></label><label>Price (PKR)<input v-model="form.price" required type="number" min="1" placeholder="28500000" /></label><label>Area (sq ft)<input v-model="form.areaSqft" required type="number" min="1" placeholder="1850" /></label><label>Bedrooms<input v-model="form.bedrooms" required type="number" min="0" /></label><label>Bathrooms<input v-model="form.bathrooms" required type="number" min="0" /></label><label>Floors<input v-model="form.floors" required type="number" min="0" /></label><label class="wide">Property photos and videos<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" multiple @change="selectFiles"/><small>Up to 8 files and 50 MB total · JPG, PNG, WebP, AVIF, MP4, WebM, MOV</small><span v-if="files.length" class="selected-media">{{ files.length }} file(s) selected · {{ sizeLabel }}</span></label><label class="wide">Or use a main photo URL (optional)<input v-model="form.imageUrl" type="url" placeholder="https://…" /></label><label class="wide">Description<textarea v-model="form.description" required maxlength="3000" rows="5" placeholder="Describe the property and its features…"></textarea></label></div><div class="form-footer"><span><Upload :size="15"/> Up to 50 MB of images and video for each listing.</span><button class="button button-primary" :disabled="loading">{{ loading ? 'Submitting…' : 'Submit for review' }}</button></div></form></template></div></template>
