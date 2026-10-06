<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Building2, Plus, Check, CalendarClock } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'

type Unit = { id: string; unitNumber: string; floor: number; bedrooms: number; areaSqft: number; price: string | number; status: string }
type Project = { id: string; name: string; city: string; address?: string; status: string; units: Unit[] }
type Installment = { id: string; title: string; amount: number | string; dueDate: string; status: string }
type Reservation = { id: string; customerName: string; customerEmail: string; deposit: number | string; status: string; unit: Unit & { project: { name: string } }; installments: Installment[] }
const projects = ref<Project[]>([])
const session = useSessionStore()
const canManage = computed(() => ['ADMIN', 'OWNER', 'DEVELOPER'].includes(session.session?.user.role || ''))
const reservations = ref<Reservation[]>([])
const busy = ref(false)
const error = ref('')
const success = ref('')
const activeProject = ref('')
const projectForm = reactive({ name: '', city: 'Islamabad', address: '', description: '' })
const unitForm = reactive({ unitNumber: '', floor: 1, bedrooms: 2, areaSqft: 1000, price: 0 })
const reservationForm = reactive({ unitId: '', customerName: '', customerEmail: '', customerPhone: '', deposit: 0 })
const installmentForms = reactive<Record<string, { title: string; amount: number; dueDate: string }>>({})
const activeProjectData = computed(() => projects.value.find((item) => item.id === activeProject.value))
const availableUnits = computed(() => projects.value.flatMap((project) => project.units.filter((unit) => unit.status === 'AVAILABLE').map((unit) => ({ ...unit, projectName: project.name }))))
const money = (value: number | string) => `PKR ${Number(value).toLocaleString()}`
async function load() {
  busy.value = true; error.value = ''
  try { const [p, r] = await Promise.all([api.get('/developments'), api.get('/reservations')]); projects.value = p.data; reservations.value = r.data; activeProject.value ||= projects.value[0]?.id || ''; for (const item of reservations.value) installmentForms[item.id] ||= { title: '', amount: 0, dueDate: '' } }
  catch (e: any) { error.value = e.response?.data?.message || 'Could not load development inventory.' }
  finally { busy.value = false }
}
async function createProject() {
  error.value = ''; try { const { data } = await api.post('/developments', projectForm); Object.assign(projectForm, { name: '', city: 'Islamabad', address: '', description: '' }); activeProject.value = data.id; success.value = 'Project created.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not create project.' }
}
async function createUnit() {
  if (!activeProject.value) return
  error.value = ''; try { await api.post('/development-units', { ...unitForm, projectId: activeProject.value }); Object.assign(unitForm, { unitNumber: '', floor: 1, bedrooms: 2, areaSqft: 1000, price: 0 }); success.value = 'Unit added to inventory.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not add unit.' }
}
async function reserve() {
  error.value = ''; try { await api.post('/reservations', reservationForm); Object.assign(reservationForm, { unitId: '', customerName: '', customerEmail: '', customerPhone: '', deposit: 0 }); success.value = 'Reservation created. The unit is now held.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not reserve this unit.' }
}
async function reservationStatus(item: Reservation, status: string) { try { await api.patch(`/reservations/${item.id}/status`, { status }); success.value = `Reservation ${status.toLowerCase()}.`; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not update reservation.' } }
async function addInstallment(item: Reservation) { const form = installmentForms[item.id]; try { await api.post(`/reservations/${item.id}/installments`, { ...form, dueDate: new Date(`${form.dueDate}T12:00:00`).toISOString() }); Object.assign(form, { title: '', amount: 0, dueDate: '' }); await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not add installment.' } }
async function markInstallmentPaid(installment: Installment) { try { await api.patch(`/installments/${installment.id}/paid`); await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not update installment.' } }
onMounted(load)
</script>

<template>
  <section class="workspace-content phase-workspace">
    <div class="section-toolbar"><div><h2>Development inventory</h2><p>Projects, unit availability, reservations, and installment plans.</p></div><span class="count-pill"><Building2 :size="14" />{{ projects.length }} projects</span></div>
    <div v-if="error" class="notice error-notice">{{ error }}</div><div v-if="success" class="notice">{{ success }}</div><div v-if="busy && !projects.length" class="loading-row">Loading development workspace…</div>
    <div class="phase-grid"><form v-if="canManage" class="panel-card phase-form" @submit.prevent="createProject"><div class="eyebrow muted-eyebrow">NEW DEVELOPMENT</div><h3>Create a project</h3><label>Project name<input v-model="projectForm.name" required maxlength="120" placeholder="Cedar Heights" /></label><label>City<input v-model="projectForm.city" required /></label><label>Address<input v-model="projectForm.address" /></label><label>Description<textarea v-model="projectForm.description" rows="2" /></label><button class="button button-primary"><Plus :size="15" />Create project</button></form>
      <section class="panel-card phase-panel"><div class="panel-heading"><div><h2>Projects</h2><p>Choose a project to manage its units.</p></div></div><div v-if="projects.length" class="project-picker"><button v-for="project in projects" :key="project.id" :class="{ selected: project.id === activeProject }" @click="activeProject = project.id"><b>{{ project.name }}</b><small>{{ project.city }} · {{ project.units.length }} units</small></button></div><div v-else class="small-empty">Create your first project to start inventory.</div>
        <form v-if="activeProjectData && canManage" class="phase-inline-form" @submit.prevent="createUnit"><h3>Add a unit to {{ activeProjectData.name }}</h3><label>Unit number<input v-model="unitForm.unitNumber" required placeholder="12B" /></label><label>Floor<input v-model="unitForm.floor" type="number" min="0" required /></label><label>Bedrooms<input v-model="unitForm.bedrooms" type="number" min="0" required /></label><label>Area sq ft<input v-model="unitForm.areaSqft" type="number" min="1" required /></label><label>Price PKR<input v-model="unitForm.price" type="number" min="1" required /></label><button class="button button-outline"><Plus :size="14" />Add unit</button></form>
        <div v-if="activeProjectData?.units.length" class="phase-unit-list"><article v-for="unit in activeProjectData.units" :key="unit.id"><span><b>{{ unit.unitNumber }}</b><small>Floor {{ unit.floor }} · {{ unit.bedrooms }} bed · {{ unit.areaSqft.toLocaleString() }} sq ft</small></span><strong>{{ money(unit.price) }}</strong><em :class="unit.status.toLowerCase()">{{ unit.status }}</em></article></div>
      </section></div>
    <section class="panel-card phase-panel"><div class="panel-heading"><div><h2>Reservations and installment plans</h2><p>Reserve an available unit, then schedule and record due payments.</p></div></div>
      <form v-if="availableUnits.length && ['ADMIN','OWNER','AGENT','DEVELOPER'].includes(session.session?.user.role || '')" class="phase-inline-form reservation-form" @submit.prevent="reserve"><label>Available unit<select v-model="reservationForm.unitId" required><option value="" disabled>Select unit</option><option v-for="unit in availableUnits" :key="unit.id" :value="unit.id">{{ unit.projectName }} · {{ unit.unitNumber }} · {{ money(unit.price) }}</option></select></label><label>Customer name<input v-model="reservationForm.customerName" required /></label><label>Email<input v-model="reservationForm.customerEmail" type="email" required /></label><label>Phone<input v-model="reservationForm.customerPhone" /></label><label>Deposit PKR<input v-model="reservationForm.deposit" type="number" min="1" required /></label><button class="button button-primary">Reserve unit</button></form>
      <div v-if="reservations.length" class="reservation-list"><article v-for="item in reservations" :key="item.id" class="reservation-card"><div class="reservation-head"><span><b>{{ item.customerName }}</b><small>{{ item.customerEmail }} · {{ item.unit.project.name }} / {{ item.unit.unitNumber }}</small></span><strong>{{ money(item.deposit) }} deposit</strong><span class="status-pill" :class="item.status.toLowerCase()">{{ item.status }}</span><div v-if="item.status === 'PENDING' && canManage" class="reservation-actions"><button class="button button-outline" @click="reservationStatus(item, 'CONFIRMED')"><Check :size="13" />Confirm</button><button class="button button-outline" @click="reservationStatus(item, 'CANCELLED')">Cancel</button></div></div><div v-if="item.status === 'CONFIRMED' && canManage" class="installment-tools"><form class="installment-add" @submit.prevent="addInstallment(item)"><input v-model="installmentForms[item.id].title" required placeholder="Installment label" /><input v-model="installmentForms[item.id].amount" type="number" min="1" required placeholder="Amount PKR" /><input v-model="installmentForms[item.id].dueDate" type="date" required /><button class="button button-outline"><Plus :size="13" />Add due</button></form><div v-for="due in item.installments" :key="due.id" class="installment-row"><CalendarClock :size="14" /><span>{{ due.title }} · {{ new Date(due.dueDate).toLocaleDateString() }}</span><b>{{ money(due.amount) }}</b><button v-if="due.status === 'DUE'" class="button button-outline" @click="markInstallmentPaid(due)">Mark paid</button><em v-else class="paid-mark">Paid</em></div></div></article></div><div v-else class="small-empty">Reservations and payment schedules will appear here.</div>
    </section>
  </section>
</template>
