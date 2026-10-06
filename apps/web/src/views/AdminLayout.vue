<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ArrowLeft, Building2, ClipboardCheck, CreditCard, Gauge, Headset, Home, Inbox, Landmark, Settings2, ShieldCheck, Users, WalletCards, Wrench, Search, BedDouble, ReceiptText, FileClock } from 'lucide-vue-next'
import { useSessionStore } from '../stores/session'

const route = useRoute()
const session = useSessionStore()
const groups = [
  { title: 'ADMINISTRATION', links: [
    { label: 'Overview & controls', to: '/admin', icon: Gauge, match: '/admin' },
    { label: 'Listing approvals', to: '/admin/review', icon: ClipboardCheck, match: '/admin/review' },
  ] },
  { title: 'WORKSPACE', links: [
    { label: 'Workspace dashboard', to: '/workspace', icon: Home },
    { label: 'Properties & portfolio', to: '/workspace/portfolio', icon: Building2 },
    { label: 'Sales team', to: '/workspace/sales-team', icon: Users },
    { label: 'Customer leads', to: '/workspace/leads', icon: Users },
    { label: 'Customer inbox', to: '/workspace/inbox', icon: Inbox },
    { label: 'Viewings', to: '/workspace/viewings', icon: ClipboardCheck },
    { label: 'Offers & deals', to: '/workspace/deals', icon: FileClock },
    { label: 'Leases', to: '/workspace/leases', icon: Landmark },
    { label: 'Rent & payments', to: '/workspace/rent', icon: CreditCard },
    { label: 'Finance', to: '/workspace/finance', icon: WalletCards },
    { label: 'Vendor bills', to: '/workspace/vendor-bills', icon: ReceiptText },
    { label: 'Maintenance', to: '/workspace/maintenance', icon: Wrench },
    { label: 'Developments', to: '/workspace/developments', icon: Building2 },
    { label: 'Short stays', to: '/workspace/stays', icon: BedDouble },
    { label: 'Saved searches', to: '/workspace/searches', icon: Search },
  ] },
]
const pageName = computed(() => route.path === '/admin/review' ? 'Listing approvals' : 'Administration')
function isSelected(item: { to: string; match?: string }) { return item.match ? (item.match === '/admin' ? route.path === '/admin' : route.path.startsWith(item.match)) : route.path === item.to || route.path.startsWith(item.to + '/') }
</script>

<template>
  <div class="admin-portal">
    <aside class="admin-sidebar">
      <RouterLink class="admin-brand" to="/admin"><span class="admin-brand-mark"><ShieldCheck :size="20"/></span><span><b>PropSphere</b><small>ADMIN CONSOLE</small></span></RouterLink>
      <div class="admin-org"><span class="admin-org-icon"><Building2 :size="16"/></span><span><small>ORGANIZATION</small><b>{{ session.session?.user.organizationName || 'Your workspace' }}</b></span></div>
      <nav aria-label="Admin portal navigation" class="admin-side-nav">
        <section v-for="group in groups" :key="group.title"><small class="admin-nav-label">{{ group.title }}</small><RouterLink v-for="item in group.links" :key="item.to" :to="item.to" :class="{ selected: isSelected(item) }"><component :is="item.icon" :size="16"/><span>{{ item.label }}</span></RouterLink></section>
      </nav>
      <div class="admin-sidebar-bottom"><RouterLink to="/profile"><Settings2 :size="16"/> Account settings</RouterLink><RouterLink to="/"><ArrowLeft :size="16"/> Back to marketplace</RouterLink><div class="admin-user"><span class="admin-avatar">{{ (session.session?.user.name || 'A').slice(0,1).toUpperCase() }}</span><span><b>{{ session.session?.user.name || 'Administrator' }}</b><small>Organization admin</small></span></div></div>
    </aside>
    <section class="admin-main"><header class="admin-topbar"><div><span>ADMIN CONSOLE</span><b>{{ pageName }}</b></div><div class="admin-top-actions"><span class="admin-secure"><ShieldCheck :size="15"/> Admin access</span><RouterLink to="/admin" aria-label="Open admin overview"><Gauge :size="17"/></RouterLink><RouterLink to="/workspace" aria-label="Open workspace"><Headset :size="17"/></RouterLink></div></header><div class="admin-page-content"><RouterView /></div></section>
  </div>
</template>
