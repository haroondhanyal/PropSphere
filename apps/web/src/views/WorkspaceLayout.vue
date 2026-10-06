<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '../stores/session'
import { api } from '../api'
import { BriefcaseBusiness, CalendarDays, CircleDollarSign, ClipboardList, House, LayoutDashboard, Users, Wrench, Search, MessageCircle, Building2, Hotel, Receipt, BadgeCheck, ChartNoAxesCombined } from 'lucide-vue-next'
const route = useRoute()
const session = useSessionStore()
const switchingOrganization = ref(false)
const switchError = ref('')
async function switchOrganization(event: Event) {
  const organizationId = (event.target as HTMLSelectElement).value
  if (!organizationId || organizationId === session.session?.user.organizationId) return
  switchingOrganization.value = true
  switchError.value = ''
  try {
    const response = await api.post('/auth/switch-organization', { organizationId })
    session.setSession(response.data)
    window.location.assign('/workspace')
  } catch (error: any) {
    switchError.value = error.response?.data?.message || 'Could not switch organization.'
  } finally {
    switchingOrganization.value = false
  }
}
const links = [
  { to: '/workspace', label: 'Overview', icon: LayoutDashboard },
  { to: '/workspace/leads', label: 'Leads', icon: Users, roles: ['ADMIN', 'AGENT'] },
  { to: '/workspace/sales-team', label: 'Sales team', icon: ChartNoAxesCombined, roles: ['ADMIN', 'SALES_MANAGER'] },
  { to: '/workspace/viewings', label: 'Viewings', icon: CalendarDays },
  { to: '/workspace/searches', label: 'Saved searches', icon: Search },
  { to: '/workspace/inbox', label: 'Inbox', icon: MessageCircle },
  { to: '/workspace/deals', label: 'Offers & applications', icon: BriefcaseBusiness },
  { to: '/workspace/portfolio', label: 'Portfolio & units', icon: House, roles: ['ADMIN', 'OWNER', 'AGENT'] },
  { to: '/workspace/leases', label: 'Leases', icon: ClipboardList },
  { to: '/workspace/rent', label: 'Rent & payments', icon: CircleDollarSign },
  { to: '/workspace/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/workspace/developments', label: 'Developments', icon: Building2, roles: ['ADMIN', 'OWNER', 'AGENT', 'DEVELOPER'] },
  { to: '/workspace/stays', label: 'Short stays', icon: Hotel },
  { to: '/workspace/finance', label: 'Finance', icon: CircleDollarSign, roles: ['ADMIN', 'OWNER', 'FINANCE'] },
  { to: '/workspace/vendor-bills', label: 'Vendor bills', icon: Receipt, roles: ['ADMIN', 'OWNER', 'FINANCE', 'VENDOR'] },
  { to: '/admin', label: 'Admin', icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/admin/review', label: 'Listing review', icon: BadgeCheck, roles: ['ADMIN'] },
]
const visibleLinks = computed(() => links.filter((link) => !link.roles || link.roles.includes(session.session?.user.role || '')))
const title = computed(() => route.path.split('/').at(-1)?.replaceAll('-', ' ') || 'Overview')
</script>

<template><div class="workspace-page"><header class="workspace-heading"><div><div class="eyebrow muted-eyebrow">{{ session.session?.user.organizationName || 'YOUR WORKSPACE' }}</div><h1>{{ title === 'workspace' ? 'Workspace overview' : title.replace(/\b\w/g, (m) => m.toUpperCase()) }}</h1><p>One place to move your property work forward.</p><small v-if="switchError" class="form-error">{{ switchError }}</small></div><div class="workspace-heading-actions"><label v-if="(session.session?.user.organizations.length || 0) > 1" class="organization-switch"><span>Organization</span><select :value="session.session?.user.organizationId" :disabled="switchingOrganization" @change="switchOrganization"><option v-for="organization in session.session?.user.organizations" :key="organization.id" :value="organization.id">{{ organization.name }} · {{ organization.role }}</option></select></label><div class="role-chip"><span class="presence-dot"></span>{{ session.session?.user.role }}</div></div></header><nav class="workspace-nav"><RouterLink v-for="link in visibleLinks" :key="link.to" :to="link.to" :class="{ active: route.path === link.to || (link.to.startsWith('/workspace/') && route.path.startsWith(`${link.to}/`)) }"><component :is="link.icon" :size="16" />{{ link.label }}</RouterLink></nav><RouterView /></div></template>
