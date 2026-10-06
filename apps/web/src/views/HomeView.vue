<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PropertyGrid from '../components/PropertyGrid.vue'
import { api } from '../api'
import type { Property } from '../types'

const properties = ref<Property[]>([])
const loading = ref(true)
onMounted(async () => {
  try { properties.value = (await api.get('/properties')).data } catch { properties.value = [] } finally { loading.value = false }
})
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-copy"><div class="eyebrow"><Sparkles :size="15" /> Pakistan property marketplace</div><h1>Find a place<br />that fits <em>your plans.</em></h1><p>Explore homes, rentals, offices, shops, warehouses, and factories across ten Pakistani cities.</p></div>
      <div class="hero-art"><img src="https://images.pexels.com/photos/11296222/pexels-photo-11296222.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Sunlit modern home living room" /><div class="floating-note"><span class="note-icon"><ShieldCheck :size="17" /></span><span><b>Property, connected</b><small>Residential, commercial, industrial</small></span></div></div>
      <div class="search-panel">
        <div class="search-tabs"><RouterLink class="selected" to="/search?purpose=SALE">Buy</RouterLink><RouterLink to="/search?purpose=RENT">Rent</RouterLink><RouterLink class="stay-tab" to="/stays">Short stays</RouterLink></div>
        <form class="search-form" action="/search"><label class="location-input"><MapPin :size="18" /><span><small>Where</small><input name="city" placeholder="City, area or community" /></span></label><label class="select-input"><span><small>Property type</small><select name="type"><option value="">Any type</option><option value="APARTMENT">Apartment</option><option value="HOUSE">House</option><option value="VILLA">Villa</option><option value="OFFICE">Office</option><option value="SHOP">Shop</option><option value="WAREHOUSE">Warehouse</option><option value="FACTORY">Factory</option></select></span></label><label class="select-input"><span><small>Price range</small><select name="maxPrice"><option value="">Any price</option><option value="30000000">Up to PKR 3 Cr</option><option value="60000000">Up to PKR 6 Cr</option></select></span></label><button class="button button-primary search-submit"><Search :size="17" /> Search listings</button></form>
      </div>
    </section>
    <section class="content-section"><div class="section-heading"><div><div class="eyebrow muted-eyebrow">HANDPICKED FOR YOU</div><h2>Featured properties</h2><p>Thoughtful spaces in places you'll love.</p></div><RouterLink class="text-link" to="/search">Explore all <ArrowRight :size="16" /></RouterLink></div><PropertyGrid :properties="properties.slice(0, 3)" :loading="loading" /></section>
    <section id="projects" class="trust-strip"><div><span class="trust-icon"><ShieldCheck /></span><span><b>Listed with care</b><small>Properties reviewed by our team</small></span></div><div><span class="trust-icon"><MapPin /></span><span><b>Local knowledge</b><small>Explore communities across Pakistan</small></span></div><div><span class="trust-icon"><Sparkles /></span><span><b>Your next chapter</b><small>Find a home that fits your life</small></span></div></section>
  </div>
</template>
