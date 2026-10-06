<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Wallet } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'
type Owner = { id: string; name: string; email: string }
type PropertyOption = { id: string; title: string }
type Expense = { id: string; category: string; description: string; amount: string | number; incurredAt: string }
type Payout = { id: string; ownerId: string; amount: string | number; period: string; status: string; reference?: string }
const session = useSessionStore()
const report = ref({ income: 0, expenses: 0, payouts: 0, paymentCount: 0, expenseCount: 0, payoutCount: 0 })
const expenses = ref<Expense[]>([])
const payouts = ref<Payout[]>([])
const owners = ref<Owner[]>([])
const properties = ref<PropertyOption[]>([])
const filters = reactive({ from: '', to: '' })
const expenseForm = reactive({ category: 'Repairs', description: '', amount: 0, propertyId: '' })
const payoutForm = reactive({ ownerId: '', amount: 0, period: new Date().toISOString().slice(0, 7), reference: '' })
const error = ref('')
const success = ref('')
const loading = ref(false)
const canManagePayout = computed(() => ['ADMIN', 'FINANCE'].includes(session.session?.user.role || ''))
const money = (value: number | string) => `PKR ${Number(value).toLocaleString()}`
async function load() {
  loading.value = true; error.value = ''
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
    const [summary, expenseResult, payoutResult] = await Promise.all([api.get('/finance/report', { params }), api.get('/finance/expenses'), api.get('/finance/payouts')])
    report.value = summary.data; expenses.value = expenseResult.data; payouts.value = payoutResult.data
    if (canManagePayout.value) { owners.value = (await api.get('/finance/owners')).data; payoutForm.ownerId ||= owners.value[0]?.id || '' }
    if (session.session?.user.role === 'OWNER') properties.value = (await api.get('/portfolio/properties')).data
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not load finance report.' }
  finally { loading.value = false }
}
async function addExpense() { try { await api.post('/finance/expenses', { ...expenseForm, ...(expenseForm.propertyId ? {} : { propertyId: undefined }) }); Object.assign(expenseForm, { category: 'Repairs', description: '', amount: 0, propertyId: '' }); success.value = 'Expense recorded.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not record expense.' } }
async function addPayout() { try { await api.post('/finance/payouts', payoutForm); Object.assign(payoutForm, { amount: 0, reference: '' }); success.value = 'Owner payout recorded as pending.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not create owner payout.' } }
async function markPaid(item: Payout) { try { await api.patch(`/finance/payouts/${item.id}/paid`); success.value = 'Payout marked paid.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not update payout.' } }
onMounted(load)
</script>

<template>
  <section class="workspace-content phase-workspace"><div class="section-toolbar"><div><h2>Finance and reporting</h2><p>Track collected rent, operating costs, and owner distributions.</p></div><button class="button button-outline" @click="load">Refresh report</button></div>
    <div v-if="error" class="notice error-notice">{{ error }}</div><div v-if="success" class="notice">{{ success }}</div>
    <form class="report-filters" @submit.prevent="load"><label>From<input v-model="filters.from" type="date"/></label><label>To<input v-model="filters.to" type="date"/></label><button class="button button-primary">Apply dates</button><button type="button" class="button button-outline" @click="Object.assign(filters,{from:'',to:''});load()">All time</button></form>
    <div v-if="loading" class="loading-row">Updating finance data…</div>
    <div class="finance-kpis"><article><span class="kpi-icon green"><ArrowDownLeft/></span><small>Rent collected</small><b>{{ money(report.income) }}</b><span>{{ report.paymentCount }} recorded payments</span></article><article><span class="kpi-icon orange"><ArrowUpRight/></span><small>Property expenses</small><b>{{ money(report.expenses) }}</b><span>{{ report.expenseCount }} recorded costs</span></article><article><span class="kpi-icon blue"><Wallet/></span><small>Owner payouts</small><b>{{ money(report.payouts) }}</b><span>{{ report.payoutCount }} distributions</span></article><article><span class="kpi-icon purple"><CircleDollarSign/></span><small>Net before payouts</small><b>{{ money(report.income - report.expenses) }}</b><span>Collected rent less expenses</span></article></div>
    <div class="finance-columns"><form class="panel-card phase-form" @submit.prevent="addExpense"><div class="eyebrow muted-eyebrow">COST TRACKING</div><h3>Record an expense</h3><label>Category<select v-model="expenseForm.category"><option>Repairs</option><option>Utilities</option><option>Insurance</option><option>Tax</option><option>Vendor bill</option><option>Commission</option><option>Other</option></select></label><label v-if="session.session?.user.role === 'OWNER'">Property<select v-model="expenseForm.propertyId" required><option value="" disabled>Select property</option><option v-for="property in properties" :key="property.id" :value="property.id">{{ property.title }}</option></select></label><label>Description<input v-model="expenseForm.description" required maxlength="300" placeholder="Replace water pump"/></label><label>Amount PKR<input v-model="expenseForm.amount" type="number" min="1" required/></label><button class="button button-primary">Record expense</button></form>
      <section v-if="canManagePayout" class="panel-card phase-form"><div class="eyebrow muted-eyebrow">OWNER DISTRIBUTION</div><h3>Create a payout</h3><form @submit.prevent="addPayout"><label>Property owner<select v-model="payoutForm.ownerId" required><option v-for="owner in owners" :key="owner.id" :value="owner.id">{{ owner.name }} · {{ owner.email }}</option></select></label><label>Amount PKR<input v-model="payoutForm.amount" type="number" min="1" required/></label><label>Period<input v-model="payoutForm.period" type="month" required/></label><label>Reference<input v-model="payoutForm.reference" placeholder="Bank transfer reference"/></label><button class="button button-primary" :disabled="!owners.length">Create pending payout</button></form></section>
      <section class="panel-card finance-table"><div class="panel-heading"><div><h2>Recent expenses</h2><p>Most recent operating costs.</p></div></div><div v-for="expense in expenses.slice(0,12)" :key="expense.id" class="finance-row"><span><b>{{ expense.category }}</b><small>{{ expense.description }} · {{ new Date(expense.incurredAt).toLocaleDateString() }}</small></span><strong>{{ money(expense.amount) }}</strong></div><div v-if="!expenses.length" class="small-empty">No expenses recorded yet.</div></section>
    </div>
    <section class="panel-card payout-table"><div class="panel-heading"><div><h2>Owner payouts</h2><p>Pending and completed distributions.</p></div></div><div v-for="payout in payouts" :key="payout.id" class="finance-row"><span><b>{{ payout.period }} · {{ money(payout.amount) }}</b><small>{{ payout.reference || 'No payment reference' }}</small></span><span class="status-pill" :class="payout.status.toLowerCase()">{{ payout.status }}</span><button v-if="canManagePayout && payout.status === 'PENDING'" class="button button-outline" @click="markPaid(payout)">Mark paid</button></div><div v-if="!payouts.length" class="small-empty">No payouts recorded.</div></section>
  </section>
</template>
