<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2 } from 'lucide-vue-next'
import { api } from '../api'
const router = useRouter()
const loading = ref(false)
const error = ref('')
const submitted = ref(false)
const form = ref({ title: '', description: '', city: 'Islamabad', community: '', purpose: 'SALE', type: 'APARTMENT', price: '', bedrooms: '3', bathrooms: '2', areaSqft: '', imageUrl: '' })
async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/properties', { ...form.value, price: Number(form.value.price), bedrooms: Number(form.value.bedrooms), bathrooms: Number(form.value.bathrooms), areaSqft: Number(form.value.areaSqft) })
    submitted.value = true
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not submit this listing.' } finally { loading.value = false }
}
</script>

<template><div class="page-container listing-form-page"><RouterLink class="back-link" to="/"><ArrowLeft :size="16" /> Back home</RouterLink><div v-if="submitted" class="success-card"><div class="success-icon"><CheckCircle2 :size="26" /></div><div class="eyebrow muted-eyebrow">SUBMITTED FOR REVIEW</div><h1>Your listing is in review</h1><p>Our team will review the property details before it appears in public search results.</p><button class="button button-primary" @click="router.push('/')">Back to marketplace</button></div><template v-else><div class="page-heading"><div><div class="eyebrow muted-eyebrow">SELL OR RENT WITH PROPSPHERE</div><h1>List your property</h1><p>Share the details. Our team will review the listing before it goes live.</p></div></div><form class="listing-form" @submit.prevent="submit"><div v-if="error" class="form-error">{{ Array.isArray(error) ? error.join(', ') : error }}</div><div class="form-grid"><label class="wide">Listing title<input v-model="form.title" required maxlength="100" placeholder="e.g. Bright family home in F-11" /></label><label>City<select v-model="form.city"><option>Islamabad</option><option>Rawalpindi</option><option>Lahore</option><option>Karachi</option><option>Peshawar</option><option>Faisalabad</option><option>Multan</option><option>Quetta</option><option>Hyderabad</option><option>Sialkot</option></select></label><label>Area / community<input v-model="form.community" required placeholder="e.g. F-11" /></label><label>Listing purpose<select v-model="form.purpose"><option value="SALE">For sale</option><option value="RENT">For rent</option></select></label><label>Property type<select v-model="form.type"><option value="APARTMENT">Apartment</option><option value="HOUSE">House</option><option value="VILLA">Villa</option><option value="PENTHOUSE">Penthouse</option><option value="STUDIO">Studio</option><option value="OFFICE">Office</option><option value="SHOP">Shop</option><option value="COMMERCIAL">Commercial unit</option><option value="WAREHOUSE">Warehouse</option><option value="FACTORY">Factory</option><option value="LAND">Land</option></select></label><label>Price (PKR)<input v-model="form.price" required type="number" min="1" placeholder="28500000" /></label><label>Area (sq ft)<input v-model="form.areaSqft" required type="number" min="1" placeholder="1850" /></label><label>Bedrooms<input v-model="form.bedrooms" required type="number" min="0" /></label><label>Bathrooms<input v-model="form.bathrooms" required type="number" min="0" /></label><label class="wide">Main photo URL<input v-model="form.imageUrl" required type="url" placeholder="https://…" /></label><label class="wide">Description<textarea v-model="form.description" required maxlength="3000" rows="5" placeholder="Describe the home and what makes it special…"></textarea></label></div><div class="form-footer"><span>Listings are checked for quality and accuracy before publishing.</span><button class="button button-primary" :disabled="loading">{{ loading ? 'Submitting…' : 'Submit for review' }}</button></div></form></template></div></template>
