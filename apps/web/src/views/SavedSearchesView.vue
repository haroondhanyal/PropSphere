<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Bell, BellOff, Search, Trash2 } from 'lucide-vue-next'
import { api } from '../api'
const searches=ref<any[]>([])
const loading=ref(true)
const error=ref('')
async function load(){loading.value=true;try{searches.value=(await api.get('/saved-searches')).data}catch(e:any){error.value=e.response?.data?.message||'Could not load saved searches.'}finally{loading.value=false}}
async function remove(id:string){try{await api.post(`/saved-searches/${id}/delete`);await load()}catch(e:any){error.value=e.response?.data?.message||'Could not delete saved search.'}}
async function toggleAlerts(item:any){try{const response=await api.patch(`/saved-searches/${item.id}/alerts`,{enabled:!item.alertEnabled});item.alertEnabled=response.data.enabled}catch(e:any){error.value=e.response?.data?.message||'Could not update email alerts.'}}
function label(filters:Record<string,any>){const parts=[filters.city,filters.type,filters.purpose==='SALE'?'For sale':filters.purpose==='RENT'?'For rent':'',filters.maxPrice?`up to PKR ${Number(filters.maxPrice).toLocaleString()}`:''].filter(Boolean);return parts.join(' · ')||'All properties'}
onMounted(load)
</script>

<template><section class="workspace-content"><div class="section-toolbar"><div><h2>Saved searches and alerts</h2><p>Email alerts check for new matching listings daily when SMTP is configured.</p></div><span class="count-pill">{{searches.length}} saved</span></div><div v-if="error" class="notice error-notice">{{error}}</div><div v-if="loading" class="loading-row">Loading saved searches…</div><div v-else-if="!searches.length" class="empty-state compact-empty"><span class="empty-icon"><Search/></span><h3>No saved searches yet</h3><p>Run a property search and save its filters to find it again here.</p><RouterLink class="button button-outline" to="/search">Search properties</RouterLink></div><div v-else class="saved-search-list"><article v-for="item in searches" :key="item.id" class="saved-search-card"><span class="saved-search-icon"><Search/></span><div class="saved-search-info"><h3>{{item.name}}</h3><p>{{label(item.filters)}}</p><small>Saved {{new Date(item.createdAt).toLocaleDateString()}}</small></div><button type="button" class="alert-ready" :class="{off:!item.alertEnabled}" @click="toggleAlerts(item)"><Bell v-if="item.alertEnabled" :size="14"/><BellOff v-else :size="14"/>{{item.alertEnabled?'Email alerts on':'Email alerts off'}}</button><RouterLink class="button button-outline" :to="{path:'/search',query:item.filters}">Run search</RouterLink><button class="icon-danger" aria-label="Delete saved search" @click="remove(item.id)"><Trash2 :size="16"/></button></article></div></section></template>
