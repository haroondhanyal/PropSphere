<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { Heart, Home, Search, ShieldCheck, LogIn, Palette, UserRound, Plus, ShoppingCart, KeyRound, BedDouble, Compass, Building2, Mail, ArrowUpRight } from 'lucide-vue-next'
import { useSessionStore } from './stores/session'
import { api } from './api'

const session = useSessionStore()
const route = useRoute()
const router = useRouter()
const themeOptions = [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'ocean', label: 'Ocean' }, { id: 'forest', label: 'Forest' }]
const theme = ref(localStorage.getItem('propsphere-theme') || 'light')
watch(theme, (value) => { localStorage.setItem('propsphere-theme', value); document.documentElement.dataset.theme = value }, { immediate: true })
function cycleTheme() { const index = themeOptions.findIndex((option) => option.id === theme.value); theme.value = themeOptions[(index + 1) % themeOptions.length].id }
const compact = computed(() => ['/login', '/signup', '/forgot-password', '/reset-password'].includes(route.path))
const adminPortal = computed(() => route.path.startsWith('/admin') || (session.isAdmin && route.path.startsWith('/workspace')))
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
    <header v-if="!compact && !adminPortal" class="topbar">
      <RouterLink class="brand" to="/"><img src="/propsphere-logo.svg" alt="PropSphere" /><span>PropSphere</span></RouterLink>
      <nav class="main-nav" aria-label="Main navigation">
        <RouterLink to="/search?purpose=SALE" title="Buy"><ShoppingCart :size="16"/><span>Buy</span></RouterLink>
        <RouterLink to="/search?purpose=RENT" title="Rent"><KeyRound :size="16"/><span>Rent</span></RouterLink>
        <RouterLink to="/stays" title="Short stays"><BedDouble :size="16"/><span>Short stays</span></RouterLink>
        <RouterLink to="/search" title="Explore"><Compass :size="16"/><span>Explore</span></RouterLink>
        <RouterLink to="/workspace" title="Workspace"><Building2 :size="16"/><span>Workspace</span></RouterLink>
      </nav>
      <div class="top-actions">
        <select v-if="session.session && session.session.user.organizations.length > 1" class="organization-select" :value="session.session.user.organizationId" aria-label="Switch organization" @change="switchOrganization"><option v-for="organization in session.session.user.organizations" :key="organization.id" :value="organization.id">{{ organization.name }}</option></select>
        <label class="theme-picker"><Palette :size="16"/><select v-model="theme" class="theme-select" aria-label="Choose app theme"><option v-for="option in themeOptions" :key="option.id" :value="option.id">{{option.label}} theme</option></select></label>
        <RouterLink class="icon-link" to="/favorites"><Heart :size="17" /> Saved</RouterLink>
        <RouterLink class="list-link" to="/list-property"><Plus :size="15"/><span>List property</span></RouterLink>
        <RouterLink v-if="session.isAdmin" class="icon-link" to="/admin/review"><ShieldCheck :size="17" /> Review</RouterLink>
        <RouterLink v-if="session.isAdmin" class="icon-link" to="/admin">Admin</RouterLink>
        <template v-if="!session.session"><RouterLink class="icon-link signup-link" to="/signup"><UserRound :size="16"/><span>Sign up</span></RouterLink><RouterLink class="icon-link admin-login-entry" to="/login?portal=admin" title="Sign in as Admin"><ShieldCheck :size="17"/><span>Admin sign in</span></RouterLink><RouterLink class="button button-dark small" to="/login"><LogIn :size="16" /> Sign in</RouterLink></template>
        <RouterLink v-else class="avatar-button" title="Profile settings" to="/profile"><img v-if="session.session.user.avatarUrl" :src="session.session.user.avatarUrl" alt=""/><UserRound v-else :size="17" /></RouterLink>
      </div>
    </header>
    <label v-if="compact" class="theme-picker auth-theme-picker"><Palette :size="16"/><select v-model="theme" class="theme-select" aria-label="Choose app theme"><option v-for="option in themeOptions" :key="option.id" :value="option.id">{{option.label}} theme</option></select></label>
    <main :class="{ 'login-main': compact, 'admin-route-main': adminPortal }"><RouterView /></main>
    <footer v-if="!compact && !adminPortal" class="footer site-footer">
      <div class="footer-main"><div class="footer-brand-block"><RouterLink class="brand" to="/"><img src="/propsphere-logo.svg" alt=""/><span>PropSphere</span></RouterLink><p>One connected place to discover property, manage listings, and move deals forward.</p><RouterLink class="footer-contact-link" to="/contact"><Mail :size="15"/> Talk to our team <ArrowUpRight :size="14"/></RouterLink></div>
        <div class="footer-column"><b>Explore</b><RouterLink to="/search">Buy property</RouterLink><RouterLink to="/search?purpose=RENT">Find a rental</RouterLink><RouterLink to="/stays">Short stays</RouterLink><RouterLink to="/list-property">List a property</RouterLink></div>
        <div class="footer-column"><b>PropSphere</b><RouterLink to="/about">About us</RouterLink><RouterLink to="/features">Platform features</RouterLink><RouterLink to="/plans">Plans & subscriptions</RouterLink><RouterLink to="/contact">Contact & support</RouterLink></div>
        <div class="footer-column footer-updates"><b>Stay in the loop</b><p>Turn on saved-search email alerts for new listings that match your needs.</p><RouterLink to="/signup">Create your free account <ArrowUpRight :size="14"/></RouterLink></div>
      </div><div class="footer-bottom"><span>© 2026 PropSphere</span><span>Property, connected.</span><RouterLink to="/contact">Need help? Contact us</RouterLink></div>
    </footer>
    <nav v-if="!compact && !adminPortal" class="mobile-nav">
      <RouterLink to="/"><Home :size="18" />Home</RouterLink><RouterLink to="/search"><Search :size="18" />Search</RouterLink><RouterLink to="/favorites"><Heart :size="18" />Saved</RouterLink><RouterLink to="/list-property"><Plus :size="18" />List</RouterLink><RouterLink :to="session.session?'/profile':'/login'"><UserRound :size="18" />{{session.session?'Profile':'Account'}}</RouterLink><button class="dock-theme" :title="`Current theme: ${theme}. Click to change.`" @click="cycleTheme"><Palette :size="18"/><span>{{theme}}</span></button>
    </nav>
  </div>
</template>
