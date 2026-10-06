<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Heart, BedDouble, Bath, MoveUpRight, BadgeCheck } from 'lucide-vue-next'
import type { Property } from '../types'
import { api, mediaUrl } from '../api'

const props = defineProps<{ property: Property }>()
const favorites = ref<string[]>(JSON.parse(localStorage.getItem('propsphere-favorites') || '[]'))
const saved = computed(() => favorites.value.includes(props.property.id))
const propertyGroup = computed(() => ['WAREHOUSE', 'FACTORY'].includes(props.property.type) ? 'INDUSTRIAL' : ['OFFICE', 'SHOP', 'COMMERCIAL'].includes(props.property.type) ? 'COMMERCIAL' : 'RESIDENTIAL')
onMounted(async () => {
  if (!localStorage.getItem('propsphere-token')) return
  try {
    const { data } = await api.get<Property[]>('/properties/favorites')
    favorites.value = data.map((item) => item.id)
    localStorage.setItem('propsphere-favorites', JSON.stringify(favorites.value))
  } catch { /* Keep the locally saved shortlist available if the API is offline. */ }
})
async function toggleFavorite() {
  const wasSaved = saved.value
  favorites.value = wasSaved ? favorites.value.filter((id) => id !== props.property.id) : [...favorites.value, props.property.id]
  localStorage.setItem('propsphere-favorites', JSON.stringify(favorites.value))
  window.dispatchEvent(new Event('favorites-updated'))
  if (localStorage.getItem('propsphere-token')) {
    try {
      if (wasSaved) await api.delete(`/properties/${props.property.id}/favorite`)
      else await api.post(`/properties/${props.property.id}/favorite`)
    } catch {
      favorites.value = wasSaved ? [...favorites.value, props.property.id] : favorites.value.filter((id) => id !== props.property.id)
      localStorage.setItem('propsphere-favorites', JSON.stringify(favorites.value))
      window.dispatchEvent(new Event('favorites-updated'))
    }
  }
}
const formattedPrice = computed(() => props.property.purpose === 'RENT' ? `PKR ${Number(props.property.price).toLocaleString()}/mo` : `PKR ${(Number(props.property.price) / 10000000).toFixed(2)} Cr`)
</script>

<template>
  <article class="property-card">
    <RouterLink :to="`/property/${property.slug}`" class="property-image-wrap">
      <img class="property-image" :src="mediaUrl(property.imageUrl)" :alt="property.title" loading="lazy" />
      <span class="image-label">{{ property.purpose === 'SALE' ? 'FOR SALE' : 'FOR RENT' }}</span>
      <span v-if="property.isDemo" class="demo-label">SAMPLE PHOTO</span>
      <span v-if="property.verified" class="verified"><BadgeCheck :size="14" /> Verified</span>
    </RouterLink>
    <button class="favorite-button" :class="{ active: saved }" :aria-label="saved ? 'Remove saved property' : 'Save property'" @click="toggleFavorite"><Heart :size="18" :fill="saved ? 'currentColor' : 'none'" /></button>
    <div class="property-info">
      <div class="price-row"><strong>{{ formattedPrice }}</strong><span>{{ propertyGroup }} · {{ property.type.replaceAll('_', ' ') }}</span></div>
      <RouterLink class="property-title" :to="`/property/${property.slug}`">{{ property.title }}</RouterLink>
      <p class="muted location-line">{{ property.community }}, {{ property.city }}</p>
      <div class="property-facts"><span v-if="property.bedrooms"><BedDouble :size="16" /> {{ property.bedrooms }} beds</span><span v-if="property.bedrooms"><Bath :size="16" /> {{ property.bathrooms }} baths</span><span><MoveUpRight :size="15" /> {{ property.areaSqft.toLocaleString() }} sqft</span></div>
    </div>
  </article>
</template>
