<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { Building2, Heart, Home, Search, ShieldCheck, LogIn, LogOut } from 'lucide-vue-next'
import { useSessionStore } from './stores/session'
import { api } from './api'

const session = useSessionStore()
const route = useRoute()
const router = useRouter()
const compact = computed(() => ['/login', '/signup', '/forgot-password', '/reset-password'].includes(route.path))
async function switchOrganization(event: Event) {
  const organizationId = (event.target as HTMLSelectElement).value
  if (!organizationId || !session.session || organizationId === session.session.user.organizationId) return
  try {
    const { data } = await api.post('/auth/switch-organization', { organizationId })
    session.setSession(data)
    if (route.path === '/admin/review' && !session.isAdmin) await router.push('/')
  } catch { window.location.reload() }
}
</script>

<template>
  <div class="app-shell">
    <header v-if="!compact" class="topbar">
      <RouterLink class="brand" to="/"><img src="/propsphere-logo.svg" alt="PropSphere" /><span>PropSphere</span></RouterLink>
      <nav class="main-nav">
        <RouterLink to="/search?purpose=SALE">Buy</RouterLink>
        <RouterLink to="/search?purpose=RENT">Rent</RouterLink>
        <RouterLink to="/stays">Short stays</RouterLink>
        <RouterLink to="/search">Explore</RouterLink>
        <RouterLink to="/workspace">Workspace</RouterLink>
      </nav>
      <div class="top-actions">
        <select v-if="session.session && session.session.user.organizations.length > 1" class="organization-select" :value="session.session.user.organizationId" aria-label="Switch organization" @change="switchOrganization"><option v-for="organization in session.session.user.organizations" :key="organization.id" :value="organization.id">{{ organization.name }}</option></select>
        <RouterLink class="icon-link" to="/favorites"><Heart :size="17" /> Saved</RouterLink>
        <RouterLink class="list-link" to="/list-property">List property</RouterLink>
        <RouterLink v-if="session.isAdmin" class="icon-link" to="/admin/review"><ShieldCheck :size="17" /> Review</RouterLink>
        <RouterLink v-if="session.isAdmin" class="icon-link" to="/admin">Admin</RouterLink>
        <template v-if="!session.session"><RouterLink class="icon-link" to="/signup">Sign up</RouterLink><RouterLink class="button button-dark small" to="/login"><LogIn :size="16" /> Sign in</RouterLink></template>
        <button v-else class="avatar-button" title="Sign out" @click="session.clear()"><LogOut :size="17" /></button>
      </div>
    </header>
    <main :class="{ 'login-main': compact }"><RouterView /></main>
    <footer v-if="!compact" class="footer"><span>© 2026 PropSphere</span><span>Property, connected.</span></footer>
    <nav v-if="!compact" class="mobile-nav">
      <RouterLink to="/"><Home :size="18" />Home</RouterLink><RouterLink to="/search"><Search :size="18" />Search</RouterLink><RouterLink to="/favorites"><Heart :size="18" />Saved</RouterLink><RouterLink :to="session.session?'/workspace':'/login'"><Building2 :size="18" />{{session.session?'Workspace':'Account'}}</RouterLink>
    </nav>
  </div>
</template>
