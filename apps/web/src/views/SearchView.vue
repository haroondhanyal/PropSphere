<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-vue-next'
import PropertyGrid from '../components/PropertyGrid.vue'
import { api } from '../api'
import type { Property } from '../types'
import { useSessionStore } from '../stores/session'

const route = useRoute()
const session = useSessionStore()
const properties = ref<Property[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | undefined
const pageSize = 18
const fields = ['q', 'city', 'type', 'purpose', 'minPrice', 'maxPrice', 'minBedrooms', 'minBathrooms', 'minArea', 'maxArea', 'sort'] as const
type FilterName = typeof fields[number]
const filters = ref<Record<FilterName, string>>({ q: '', city: '', type: '', purpose: '', minPrice: '', maxPrice: '', minBedrooms: '', minBathrooms: '', minArea: '', maxArea: '', sort: 'newest' })
const showAdvanced = ref(false)
const savingSearch = ref(false)
const searchName = ref('')
const searchMessage = ref('')
const showSaveSearch = ref(false)
const activeFilterCount = computed(() => fields.filter((key) => key !== 'sort' && filters.value[key]).length)

function syncFromUrl() {
  for (const key of fields) filters.value[key] = String(route.query[key] || (key === 'sort' ? 'newest' : ''))
}
async function search() {
  loading.value = true; hasMore.value = true
  try {
    const params = Object.fromEntries(fields.filter((key) => filters.value[key] && (key !== 'sort' || filters.value[key] !== 'newest')).map((key) => [key, filters.value[key]]))
    const page = (await api.get('/properties', { params: { ...params, skip: 0, take: pageSize } })).data as Property[]
    properties.value = page; hasMore.value = page.length === pageSize
  } catch { properties.value = [] } finally { loading.value = false }
}
async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const params = Object.fromEntries(fields.filter((key) => filters.value[key] && (key !== 'sort' || filters.value[key] !== 'newest')).map((key) => [key, filters.value[key]]))
    const page = (await api.get('/properties', { params: { ...params, skip: properties.value.length, take: pageSize } })).data as Property[]
    properties.value.push(...page); hasMore.value = page.length === pageSize
  } catch { hasMore.value = false } finally { loadingMore.value = false }
}
function clearFilters() {
  filters.value = { q: '', city: '', type: '', purpose: '', minPrice: '', maxPrice: '', minBedrooms: '', minBathrooms: '', minArea: '', maxArea: '', sort: 'newest' }
  search()
}
onMounted(() => { syncFromUrl(); search(); observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) void loadMore() }, { rootMargin: '500px' }); if (sentinel.value) observer.observe(sentinel.value) })
onBeforeUnmount(() => observer?.disconnect())
watch(() => route.query, () => { syncFromUrl(); search() })
async function saveSearch() {
  if (!searchName.value.trim()) return
  savingSearch.value = true; searchMessage.value = ''
  try {
    const savedFilters = Object.fromEntries(fields.filter((key) => filters.value[key] && (key !== 'sort' || filters.value[key] !== 'newest')).map((key) => [key, filters.value[key]]))
    await api.post('/saved-searches', { name: searchName.value, filters: savedFilters })
    searchMessage.value = 'Search saved to your workspace.'; showSaveSearch.value = false; searchName.value = ''
  } catch (e: any) { searchMessage.value = e.response?.data?.message || 'Sign in to save this search.' }
  finally { savingSearch.value = false }
}
</script>

<template>
  <div class="page-container search-page">
    <div class="page-heading"><div><div class="eyebrow muted-eyebrow">THE MARKETPLACE</div><h1>Find your next place</h1><p>Explore homes and spaces across Pakistan.</p></div><span class="result-count">{{ properties.length }} homes</span></div>
    <form class="filter-bar modern-filter-bar" @submit.prevent="search">
      <label class="search-location"><span>Search name, city, or area</span><div><Search :size="16" /><input v-model="filters.q" placeholder="e.g. house in F-11" /></div></label>
      <label class="search-location"><span>City or area</span><div><MapPin :size="16" /><input v-model="filters.city" placeholder="e.g. Islamabad" /></div></label>
      <label><span>Property type</span><select v-model="filters.type"><option value="">Any type</option><optgroup label="Residential"><option value="APARTMENT">Apartment</option><option value="HOUSE">House</option><option value="VILLA">Villa</option><option value="PENTHOUSE">Penthouse</option><option value="STUDIO">Studio</option></optgroup><optgroup label="Commercial"><option value="OFFICE">Office</option><option value="SHOP">Shop</option><option value="COMMERCIAL">Commercial unit</option></optgroup><optgroup label="Industrial"><option value="WAREHOUSE">Warehouse</option><option value="FACTORY">Factory</option></optgroup><option value="LAND">Land</option></select></label>
      <label><span>Looking to</span><select v-model="filters.purpose"><option value="">Buy or rent</option><option value="SALE">Buy</option><option value="RENT">Rent</option></select></label>
      <button type="button" class="button button-outline filter-button" :class="{ 'filter-active': showAdvanced }" @click="showAdvanced = !showAdvanced"><SlidersHorizontal :size="16" /> Filters<span v-if="activeFilterCount" class="filter-count">{{ activeFilterCount }}</span></button>
      <button class="button button-primary filter-submit"><Search :size="16" /> Search</button>
      <div v-if="showAdvanced" class="advanced-filters">
        <label><span>Min price (PKR)</span><input v-model="filters.minPrice" type="number" min="0" placeholder="No minimum" /></label>
        <label><span>Max price (PKR)</span><input v-model="filters.maxPrice" type="number" min="0" placeholder="No maximum" /></label>
        <label><span>Bedrooms</span><select v-model="filters.minBedrooms"><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5+</option></select></label>
        <label><span>Bathrooms</span><select v-model="filters.minBathrooms"><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select></label>
        <label><span>Min area (sq ft)</span><input v-model="filters.minArea" type="number" min="0" placeholder="Any size" /></label>
        <label><span>Max area (sq ft)</span><input v-model="filters.maxArea" type="number" min="0" placeholder="Any size" /></label>
        <button type="button" class="clear-filters" @click="clearFilters"><X :size="14" /> Clear filters</button>
      </div>
    </form>
    <div v-if="searchMessage" class="notice">{{ searchMessage }}</div>
    <div class="results-toolbar"><span>Showing {{ properties.length }} published {{ properties.length === 1 ? 'listing' : 'listings' }}</span><div class="results-actions"><button v-if="session.session" class="button button-outline save-search-trigger" @click="showSaveSearch = !showSaveSearch">Save this search</button><RouterLink v-else class="save-search-signin" :to="`/login?next=${encodeURIComponent(route.fullPath)}`">Sign in to save search</RouterLink><label class="sort-control"><span>Sort</span><select v-model="filters.sort" aria-label="Sort properties" @change="search"><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="area-desc">Largest area</option></select></label></div></div>
    <form v-if="showSaveSearch" class="save-search-form" @submit.prevent="saveSearch"><label>Name for this search<input v-model="searchName" required maxlength="80" placeholder="3 bed homes in Islamabad" /></label><button class="button button-primary" :disabled="savingSearch">{{ savingSearch ? 'Saving…' : 'Save search' }}</button><button type="button" class="button button-outline" @click="showSaveSearch = false">Cancel</button></form>
    <PropertyGrid :properties="properties" :loading="loading" />
    <div ref="sentinel" class="load-more-sentinel" aria-live="polite"><span v-if="loadingMore" class="loading-spinner"></span><span v-if="loadingMore">Loading more properties…</span><span v-else-if="!hasMore && properties.length">You’ve reached the end of these results.</span></div>
  </div>
</template>
