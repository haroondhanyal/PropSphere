<script setup lang="ts">
import PropertyCard from './PropertyCard.vue'
import type { Property } from '../types'
defineProps<{ properties: Property[]; loading?: boolean }>()
</script>

<template>
  <div v-if="loading" class="property-grid"><div v-for="n in 3" :key="n" class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
  <div v-else-if="properties.length" class="property-grid"><PropertyCard v-for="property in properties" :key="property.id" :property="property" /></div>
  <div v-else class="empty-state"><div class="empty-icon">⌂</div><h3>No properties found</h3><p>Try widening your search or clearing a filter.</p><RouterLink class="button button-dark" to="/search">Browse all homes</RouterLink></div>
</template>
