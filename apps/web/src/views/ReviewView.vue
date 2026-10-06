<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BadgeCheck, Clock3, ShieldCheck, X } from 'lucide-vue-next'
import { api } from '../api'
import type { Property } from '../types'
const properties = ref<Property[]>([])
const message = ref('')
const loading = ref(true)
async function load() { loading.value = true; try { properties.value = (await api.get('/properties/review')).data } catch { properties.value = [] } finally { loading.value = false } }
async function decide(id: string, action: 'approve' | 'reject') {
  message.value = ''
  try { await api.post(`/properties/${id}/${action}`); message.value = action === 'approve' ? 'Listing approved and published.' : 'Listing rejected.'; await load() }
  catch (e: any) { message.value = e.response?.data?.message || 'Could not update listing.' }
}
onMounted(load)
</script>

<template><div class="page-container review-page"><div class="page-heading"><div><div class="eyebrow muted-eyebrow">ADMIN WORKSPACE</div><h1>Listing review</h1><p>Review new listings before they reach the marketplace.</p></div><span class="review-count"><Clock3 :size="16" /> {{ properties.length }} waiting</span></div><div v-if="message" class="notice">{{ message }}</div><div v-if="loading" class="loading-row">Loading submitted listings…</div><div v-else-if="!properties.length" class="empty-state"><div class="empty-icon"><BadgeCheck /></div><h3>You're all caught up</h3><p>New submissions will appear here.</p></div><div v-else class="review-list"><article v-for="property in properties" :key="property.id" class="review-card"><img :src="property.imageUrl" :alt="property.title" /><div class="review-info"><span class="status-pill pending"><Clock3 :size="13" /> Pending review</span><h2>{{ property.title }}</h2><p>{{ property.community }}, {{ property.city }} · {{ property.type }} · {{ property.areaSqft.toLocaleString() }} sqft</p><b>PKR {{ (property.price / 10000000).toFixed(2) }} Cr</b></div><div class="review-actions"><button class="button button-outline reject" @click="decide(property.id, 'reject')"><X :size="16" /> Reject</button><button class="button button-primary" @click="decide(property.id, 'approve')"><ShieldCheck :size="16" /> Approve listing</button></div></article></div></div></template>
