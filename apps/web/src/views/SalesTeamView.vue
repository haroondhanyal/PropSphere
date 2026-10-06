<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChartNoAxesCombined, CircleDollarSign, Users, Trophy } from 'lucide-vue-next'
import { api } from '../api'

const team = ref<any[]>([])
const leads = ref<any[]>([])
const error = ref('')
const loading = ref(true)
const totalWon = computed(() => team.value.reduce((sum, member) => sum + member.won, 0))
const wonValue = computed(() => team.value.reduce((sum, member) => sum + member.estimatedWonValue, 0))
function money(value: number) { return `PKR ${Number(value).toLocaleString()}` }
onMounted(async () => {
  try {
    const [sales, pipeline] = await Promise.all([api.get('/sales/team'), api.get('/leads')])
    team.value = sales.data
    leads.value = pipeline.data
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not load team sales.' }
  finally { loading.value = false }
})
</script>

<template><section class="workspace-content"><div v-if="error" class="notice error-notice">{{ error }}</div><div v-if="loading" class="loading-row">Loading sales team…</div><template v-else>
  <div class="sales-kpis"><article><span><Users /></span><small>Salespeople</small><b>{{ team.length }}</b></article><article><span><ChartNoAxesCombined /></span><small>Active leads</small><b>{{ team.reduce((sum, member) => sum + member.openLeads, 0) }}</b></article><article><span><Trophy /></span><small>Won deals</small><b>{{ totalWon }}</b></article><article><span><CircleDollarSign /></span><small>Estimated won value</small><b>{{ money(wonValue) }}</b></article></div>
  <section class="panel-card sales-team-panel"><div class="section-toolbar"><div><h2>Team performance</h2><p>Sales activity for this organization. Deal value uses the linked listing price.</p></div><span class="count-pill">{{ team.length }} teammates</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>SALESPERSON</th><th>OPEN LEADS</th><th>WON</th><th>LOST</th><th>EST. WON VALUE</th></tr></thead><tbody><tr v-for="person in team" :key="person.id"><td><b>{{ person.name }}</b><small class="sales-email">{{ person.email }}</small></td><td>{{ person.openLeads }}</td><td>{{ person.won }}</td><td>{{ person.lost }}</td><td>{{ money(person.estimatedWonValue) }}</td></tr></tbody></table></div><div v-if="!team.length" class="small-empty">No salespeople are assigned to this organization yet.</div></section>
  <section class="panel-card sales-team-panel"><div class="section-toolbar"><div><h2>Organization sales pipeline</h2><p>Customer contact and property information for team leads.</p></div><span class="count-pill">{{ leads.length }} leads</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>CUSTOMER</th><th>CONTACT</th><th>PROPERTY / PRICE</th><th>SALESPERSON</th><th>STAGE</th></tr></thead><tbody><tr v-for="lead in leads" :key="lead.id"><td><b>{{ lead.name }}</b></td><td><a :href="`mailto:${lead.email}`">{{ lead.email }}</a><small v-if="lead.phone" class="sales-email"><a :href="`tel:${lead.phone}`">{{ lead.phone }}</a></small></td><td>{{ lead.property?.title || 'General inquiry' }}<small class="sales-email">{{ lead.property ? money(lead.property.price) : '—' }}</small></td><td>{{ team.find((person) => person.id === lead.assignedToId)?.name || 'Unassigned' }}</td><td><span class="status-pill">{{ lead.stage }}</span></td></tr></tbody></table></div><div v-if="!leads.length" class="small-empty">New customer inquiries will appear here.</div></section>
</template></section></template>
