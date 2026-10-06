<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import PropertyGrid from '../components/PropertyGrid.vue'
import { api } from '../api'
import type { Property } from '../types'
const properties = ref<Property[]>([])
const loading = ref(true)
async function load() {
  loading.value = true
  try {
    if (localStorage.getItem('propsphere-token')) properties.value = (await api.get('/properties/favorites')).data
    else {
      const ids: string[] = JSON.parse(localStorage.getItem('propsphere-favorites') || '[]')
      properties.value = ids.length ? (await api.get('/properties', { params: { ids: ids.join(',') } })).data : []
    }
  } catch { properties.value = [] } finally { loading.value = false }
}
onMounted(() => { load(); window.addEventListener('favorites-updated', load) })
onUnmounted(() => window.removeEventListener('favorites-updated', load))
</script>

<template><div class="page-container favorites-page"><div class="page-heading"><div><div class="eyebrow muted-eyebrow">YOUR SHORTLIST</div><h1>Saved properties</h1><p>Keep the homes you love close at hand.</p></div></div><PropertyGrid :properties="properties" :loading="loading" /></div></template>
