<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, MapPin, Search, ShieldCheck, Sparkles, Plus, House, Building2, Factory, Map } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PropertyGrid from '../components/PropertyGrid.vue'
import { api } from '../api'
import type { Property } from '../types'

const properties = ref<Property[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | undefined
const typeGroups = [
  { label: 'Residential', icon: House, types: [['HOUSE','Houses'],['APARTMENT','Apartments'],['VILLA','Villas'],['PENTHOUSE','Penthouses'],['STUDIO','Studios']] },
  { label: 'Commercial', icon: Building2, types: [['OFFICE','Offices'],['SHOP','Shops'],['COMMERCIAL','Commercial units']] },
  { label: 'Industrial', icon: Factory, types: [['WAREHOUSE','Warehouses'],['FACTORY','Factories']] },
  { label: 'Land', icon: Map, types: [['LAND','Plots & land']] },
]
async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try { const page = (await api.get('/properties', { params: { skip: properties.value.length, take: 18 } })).data as Property[]; properties.value.push(...page); hasMore.value = page.length === 18 }
  catch { hasMore.value = false } finally { loading.value = false; loadingMore.value = false }
}
onMounted(() => { void loadMore(); observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) void loadMore() }, { rootMargin: '500px' }); if (sentinel.value) observer.observe(sentinel.value) })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-copy"><div class="eyebrow"><Sparkles :size="15" /> Pakistan property marketplace</div><h1>Find a place<br />that fits <em>your plans.</em></h1><p>Explore homes, rentals, offices, shops, warehouses, and factories across ten Pakistani cities.</p></div>
      <div class="hero-art"><img src="https://images.pexels.com/photos/34956623/pexels-photo-34956623.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Sunlit modern home living room" /><div class="floating-note"><span class="note-icon"><ShieldCheck :size="17" /></span><span><b>Property, connected</b><small>Residential, commercial, industrial</small></span></div></div>
      <div class="search-panel">
        <div class="search-tabs"><RouterLink class="selected" to="/search?purpose=SALE">Buy</RouterLink><RouterLink to="/search?purpose=RENT">Rent</RouterLink><RouterLink class="stay-tab" to="/stays">Short stays</RouterLink></div>
        <form class="search-form" action="/search"><label class="location-input"><MapPin :size="18" /><span><small>Property or area</small><input name="q" placeholder="House name, city, or area" /></span></label><label class="select-input"><span><small>Property type</small><select name="type"><option value="">Any type</option><optgroup label="Residential"><option value="HOUSE">House</option><option value="APARTMENT">Apartment</option><option value="VILLA">Villa</option><option value="PENTHOUSE">Penthouse</option><option value="STUDIO">Studio</option></optgroup><optgroup label="Commercial"><option value="OFFICE">Office</option><option value="SHOP">Shop</option><option value="COMMERCIAL">Commercial unit</option></optgroup><optgroup label="Industrial"><option value="WAREHOUSE">Warehouse</option><option value="FACTORY">Factory</option></optgroup><optgroup label="Land"><option value="LAND">Plot & land</option></optgroup></select></span></label><label class="select-input"><span><small>Price range</small><select name="maxPrice"><option value="">Any price</option><option value="30000000">Up to PKR 3 Cr</option><option value="60000000">Up to PKR 6 Cr</option></select></span></label><button class="button button-primary search-submit"><Search :size="17" /> Search listings</button></form>
      </div>
    </section>
    <section class="content-section"><div class="section-heading"><div><div class="eyebrow muted-eyebrow">HANDPICKED FOR YOU</div><h2>Featured properties</h2><p>Thoughtful spaces in places you'll love.</p></div><RouterLink class="text-link" to="/search">Explore all <ArrowRight :size="16" /></RouterLink></div><PropertyGrid :properties="properties.slice(0, 6)" :loading="loading" /></section>
    <section class="browse-types"><div class="eyebrow muted-eyebrow">EVERY PROPERTY TYPE, IN ONE PLACE</div><h2>Browse the market your way</h2><div class="property-type-groups"><article v-for="group in typeGroups" :key="group.label" class="property-type-group"><div class="property-type-heading"><span><component :is="group.icon" :size="18"/></span><h3>{{group.label}}</h3></div><div class="property-type-chips"><RouterLink v-for="type in group.types" :key="type[0]" :to="`/search?type=${type[0]}`">{{type[1]}}</RouterLink></div></article></div></section>
    <section class="content-section all-listings-section"><div class="section-heading"><div><div class="eyebrow muted-eyebrow">LATEST ACROSS PAKISTAN</div><h2>Explore all properties</h2><p>More listings load automatically as you scroll.</p></div><RouterLink class="button button-outline" to="/list-property"><Plus :size="16"/> List a property</RouterLink></div><PropertyGrid :properties="properties" :loading="loading"/><div ref="sentinel" class="load-more-sentinel" aria-live="polite"><span v-if="loadingMore" class="loading-spinner"></span><span v-if="loadingMore">Finding more properties…</span><span v-else-if="!hasMore && properties.length">You’re all caught up.</span></div></section>
    <section id="projects" class="trust-strip"><div><span class="trust-icon"><ShieldCheck /></span><span><b>Listed with care</b><small>Properties reviewed by our team</small></span></div><div><span class="trust-icon"><MapPin /></span><span><b>Local knowledge</b><small>Explore communities across Pakistan</small></span></div><div><span class="trust-icon"><Sparkles /></span><span><b>Your next chapter</b><small>Find a home that fits your life</small></span></div></section>
  </div>
</template>
