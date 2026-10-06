<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarClock, FileSignature, Home, UserRound } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'
const session=useSessionStore()
const canEnd=computed(()=>['ADMIN','OWNER'].includes(session.session?.user.role||''))
const leases=ref<any[]>([])
const loading=ref(true)
const error=ref('')
const active=computed(()=>leases.value.filter((x)=>x.status==='ACTIVE').length)
const soon=computed(()=>leases.value.filter((x)=>new Date(x.endDate).getTime()-Date.now()<90*86400000&&x.status==='ACTIVE').length)
const money=(n:any)=>`PKR ${Number(n).toLocaleString()}`
async function load(){loading.value=true;try{leases.value=(await api.get('/leases')).data}catch(e:any){error.value=e.response?.data?.message||'Could not load leases.'}finally{loading.value=false}}
async function endLease(lease:any){if(!window.confirm(`End the lease for ${lease.tenant.name} and release its unit?`))return;try{await api.post(`/leases/${lease.id}/terminate`);await load()}catch(e:any){error.value=e.response?.data?.message||'Could not end this lease.'}}
onMounted(load)
</script>

<template><section class="workspace-content"><div class="section-toolbar"><div><h2>Lease register</h2><p>Current agreements, tenant details, rent schedules, and upcoming expirations.</p></div><span class="count-pill">{{active}} active</span></div><div v-if="error" class="notice error-notice">{{error}}</div><div class="lease-summary"><article><span class="kpi-icon green"><FileSignature/></span><small>Active leases</small><b>{{active}}</b></article><article><span class="kpi-icon orange"><CalendarClock/></span><small>Ending in 90 days</small><b>{{soon}}</b></article><article><span class="kpi-icon blue"><Home/></span><small>Leased spaces</small><b>{{leases.filter(x=>x.unitId).length}}</b></article><article><span class="kpi-icon purple"><UserRound/></span><small>Tenants</small><b>{{new Set(leases.map(x=>x.tenantId)).size}}</b></article></div><div v-if="loading" class="loading-row">Loading lease register…</div><div v-else-if="!leases.length" class="empty-state compact-empty"><h3>No active leases</h3><p>Review a rental application and approve it to create a lease and rent schedule.</p><RouterLink class="button button-outline" to="/workspace/deals">Open applications</RouterLink></div><div v-else class="table-scroll panel-card"><table class="data-table"><thead><tr><th>PROPERTY / UNIT</th><th>TENANT</th><th>TERM</th><th>MONTHLY RENT</th><th>INVOICES</th><th>STATUS</th><th v-if="canEnd">ACTIONS</th></tr></thead><tbody><tr v-for="lease in leases" :key="lease.id"><td><b>{{lease.property.title}}</b><small class="table-subline">{{lease.unit?.unitNumber||lease.property.community}}</small></td><td>{{lease.tenant.name}}<small class="table-subline">{{lease.tenant.email}}</small></td><td>{{new Date(lease.startDate).toLocaleDateString()}}<small class="table-subline">to {{new Date(lease.endDate).toLocaleDateString()}}</small></td><td><b>{{money(lease.monthlyRent)}}</b></td><td>{{lease.invoices.length}} scheduled</td><td><span class="status-pill" :class="lease.status.toLowerCase()">{{lease.status}}</span></td><td v-if="canEnd"><button v-if="lease.status==='ACTIVE'" class="button button-outline reject" @click="endLease(lease)">End lease</button><span v-else>—</span></td></tr></tbody></table></div></section></template>
