<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { FileText, Receipt } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'
type Job = { id: string; title: string; property: { title: string }; status: string }
type Bill = { id: string; invoiceReference: string; description: string; amount: string | number; status: string; submittedAt: string; vendor: { name: string }; maintenanceRequest: { id: string; title: string; property: { title: string } } }
const session = useSessionStore()
const bills = ref<Bill[]>([])
const jobs = ref<Job[]>([])
const form = reactive({ maintenanceRequestId: '', invoiceReference: '', description: '', amount: 0 })
const isVendor = computed(() => session.session?.user.role === 'VENDOR')
const error = ref('')
const success = ref('')
const loading = ref(false)
const money = (value: number | string) => `PKR ${Number(value).toLocaleString()}`
async function load() {
  loading.value = true; error.value = ''
  try {
    bills.value = (await api.get('/vendor-bills')).data
    if (isVendor.value) { const result = (await api.get('/maintenance')).data; jobs.value = result.filter((job: Job) => job.status === 'COMPLETED' && !bills.value.some((bill) => bill.maintenanceRequest.id === job.id)); form.maintenanceRequestId ||= jobs.value[0]?.id || '' }
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not load vendor invoices.' }
  finally { loading.value = false }
}
async function submit() { try { await api.post('/vendor-bills', form); Object.assign(form, { maintenanceRequestId: '', invoiceReference: '', description: '', amount: 0 }); success.value = 'Invoice submitted for review.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not submit invoice.' } }
async function update(bill: Bill, status: string) { try { await api.patch(`/vendor-bills/${bill.id}/status`, { status }); success.value = status === 'PAID' ? 'Vendor bill payment recorded.' : `Vendor bill ${status.toLowerCase()}.`; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not update invoice.' } }
onMounted(load)
</script>

<template>
  <section class="workspace-content phase-workspace"><div class="section-toolbar"><div><h2>Vendor invoices</h2><p>Submit completed maintenance jobs for approval and payment.</p></div><span class="count-pill"><Receipt :size="14"/>{{ bills.length }} invoices</span></div>
    <div v-if="error" class="notice error-notice">{{ error }}</div><div v-if="success" class="notice">{{ success }}</div>
    <form v-if="isVendor" class="panel-card vendor-bill-form" @submit.prevent="submit"><div class="eyebrow muted-eyebrow">COMPLETED WORK</div><h3>Submit an invoice</h3><div v-if="!jobs.length" class="small-empty">Complete an assigned maintenance job before invoicing it.</div><template v-else><label>Completed job<select v-model="form.maintenanceRequestId" required><option v-for="job in jobs" :key="job.id" :value="job.id">{{ job.property.title }} · {{ job.title }}</option></select></label><label>Invoice reference<input v-model="form.invoiceReference" required maxlength="80" placeholder="INV-2026-001"/></label><label>Description<input v-model="form.description" required maxlength="300" placeholder="Parts and labor"/></label><label>Total amount PKR<input v-model="form.amount" type="number" min="1" required/></label><button class="button button-primary"><FileText :size="15"/>Submit invoice</button></template></form>
    <div v-if="loading" class="loading-row">Loading vendor bills…</div><div v-else class="vendor-bills-list"><article v-for="bill in bills" :key="bill.id" class="vendor-bill-card"><div class="vendor-bill-icon"><Receipt/></div><div class="vendor-bill-main"><div><b>{{ bill.invoiceReference }} · {{ bill.vendor.name }}</b><span class="status-pill" :class="bill.status.toLowerCase()">{{ bill.status }}</span></div><p>{{ bill.maintenanceRequest.property.title }} · {{ bill.maintenanceRequest.title }}</p><small>{{ bill.description }} · Submitted {{ new Date(bill.submittedAt).toLocaleDateString() }}</small></div><strong>{{ money(bill.amount) }}</strong><div v-if="!isVendor && bill.status === 'PENDING'" class="vendor-bill-actions"><button class="button button-outline" @click="update(bill,'APPROVED')">Approve</button><button class="button button-outline" @click="update(bill,'REJECTED')">Reject</button></div><button v-if="!isVendor && bill.status === 'APPROVED'" class="button button-primary" @click="update(bill,'PAID')">Record paid</button></article><div v-if="!bills.length" class="empty-state compact-empty"><h3>No vendor invoices</h3><p>Invoices will appear here after a completed job is submitted.</p></div></div>
  </section>
</template>
