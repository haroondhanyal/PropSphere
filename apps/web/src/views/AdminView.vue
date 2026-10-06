<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api'

type Member = { id: string; name: string; email: string; role: string; joinedAt: string }
type Risk = { id: string; category: string; description: string; severity: string; status: string; createdAt: string }
type Audit = { id: string; actorId: string; action: string; entity: string; entityId?: string; createdAt: string }
const tabs = ['Users & roles', 'Risk review', 'Audit history', 'Settings']
const activeTab = ref(tabs[0])
const users = ref<Member[]>([])
const risks = ref<Risk[]>([])
const audit = ref<Audit[]>([])
const settings = ref<Record<string, string>>({ organizationName: '', supportEmail: '', timezone: 'Asia/Karachi' })
const riskForm = reactive({ category: '', description: '', severity: 'MEDIUM' })
const memberForm = reactive({ email: '', role: 'AGENT' })
const error = ref('')
const success = ref('')
const busy = ref(false)
const roles = ['ADMIN', 'SALES_MANAGER', 'AGENT', 'OWNER', 'BUYER', 'TENANT', 'DEVELOPER', 'FINANCE', 'VENDOR']
const roleLabel = (role: string) => ({ ADMIN: 'Admin', SALES_MANAGER: 'Sales manager', AGENT: 'Salesperson', OWNER: 'Owner', BUYER: 'Buyer', TENANT: 'Tenant', DEVELOPER: 'Developer', FINANCE: 'Finance', VENDOR: 'Vendor' }[role] || role)
async function load() {
  busy.value = true; error.value = ''
  try {
    const [members, flags, events, prefs] = await Promise.all([api.get('/admin/users'), api.get('/admin/risks'), api.get('/admin/audit'), api.get('/admin/settings')])
    users.value = members.data; risks.value = flags.data; audit.value = events.data
    for (const setting of prefs.data) settings.value[setting.key] = setting.value?.value ?? ''
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not load admin workspace.' }
  finally { busy.value = false }
}
async function setRole(member: Member, role: string) { try { await api.patch(`/admin/users/${member.id}/role`, { role }); member.role = role; success.value = `Role updated for ${member.name}.` } catch (e: any) { error.value = e.response?.data?.message || 'Could not update member role.'; await load() } }
async function addMember() { try { await api.post('/admin/users', memberForm); success.value = 'Existing account added to this organization.'; Object.assign(memberForm, { email: '', role: 'AGENT' }); await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not add this account.' } }
async function createRisk() { try { await api.post('/admin/risks', riskForm); Object.assign(riskForm, { category: '', description: '', severity: 'MEDIUM' }); success.value = 'Risk flag added to review queue.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not add risk flag.' } }
async function resolve(flag: Risk) { try { await api.patch(`/admin/risks/${flag.id}/resolve`); success.value = 'Risk flag resolved.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not resolve flag.' } }
async function saveSetting(key: string) { try { await api.patch(`/admin/settings/${key}`, { value: { value: settings.value[key] } }); success.value = 'Organization setting saved.' } catch (e: any) { error.value = e.response?.data?.message || 'Could not save setting.' } }
onMounted(load)
</script>

<template>
  <main class="page-container admin-page"><div class="page-heading"><div><div class="eyebrow muted-eyebrow">ORGANIZATION CONTROL</div><h1>Admin workspace</h1><p>Manage access, review risk, and track important changes.</p></div><button class="button button-outline" @click="load">Refresh</button></div>
    <div v-if="error" class="notice error-notice">{{ error }}</div><div v-if="success" class="notice">{{ success }}</div>
    <nav class="admin-tabs"><button v-for="tab in tabs" :key="tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }}</button></nav>
    <div v-if="busy" class="loading-row">Loading organization admin…</div>
    <section v-else-if="activeTab === 'Users & roles'" class="panel-card admin-panel"><div class="panel-heading"><div><h2>Team access</h2><p>Roles apply to this organization only.</p></div><span class="count-pill">{{ users.length }} members</span></div><form class="add-member-form" @submit.prevent="addMember"><input v-model="memberForm.email" type="email" required placeholder="Existing account email"/><select v-model="memberForm.role"><option v-for="role in roles.filter((item) => item !== 'ADMIN')" :key="role" :value="role">{{ roleLabel(role) }}</option></select><button class="button button-primary">Add account</button></form><p class="admin-note">The user must already have a PropSphere account. Role changes are written to the audit history. Your own role cannot be changed here.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>MEMBER</th><th>EMAIL</th><th>JOINED</th><th>ROLE</th></tr></thead><tbody><tr v-for="member in users" :key="member.id"><td><b>{{ member.name }}</b></td><td>{{ member.email }}</td><td>{{ new Date(member.joinedAt).toLocaleDateString() }}</td><td><select :value="member.role" @change="setRole(member, ($event.target as HTMLSelectElement).value)"><option v-for="role in roles" :key="role" :value="role">{{ roleLabel(role) }}</option></select></td></tr></tbody></table></div></section>
    <section v-else-if="activeTab === 'Risk review'" class="admin-risk-layout"><form class="panel-card phase-form" @submit.prevent="createRisk"><div class="eyebrow muted-eyebrow">REVIEW QUEUE</div><h3>Flag an item for review</h3><label>Category<input v-model="riskForm.category" required placeholder="Listing, payment, account…"/></label><label>Severity<select v-model="riskForm.severity"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label><label>Why it needs review<textarea v-model="riskForm.description" required rows="4" maxlength="1000"/></label><button class="button button-primary">Add risk flag</button></form><div class="admin-risk-list"><article v-for="flag in risks" :key="flag.id" class="risk-card"><div><span class="status-pill" :class="flag.severity.toLowerCase()">{{ flag.severity }}</span><em class="status-pill" :class="flag.status.toLowerCase()">{{ flag.status }}</em></div><h3>{{ flag.category }}</h3><p>{{ flag.description }}</p><small>{{ new Date(flag.createdAt).toLocaleString() }}</small><button v-if="flag.status === 'OPEN'" class="button button-outline" @click="resolve(flag)">Mark reviewed</button></article><div v-if="!risks.length" class="empty-state compact-empty"><h3>No risk flags</h3><p>New flags will appear in this review queue.</p></div></div></section>
    <section v-else-if="activeTab === 'Audit history'" class="panel-card admin-panel"><div class="panel-heading"><div><h2>Recent organization activity</h2><p>Administrative and financial actions are recorded here.</p></div><span class="count-pill">{{ audit.length }} records</span></div><div class="audit-list"><article v-for="event in audit" :key="event.id"><span><b>{{ event.action.replaceAll('.', ' ') }}</b><small>{{ event.entity }}{{ event.entityId ? ` · ${event.entityId}` : '' }} · User {{ event.actorId.slice(0, 8) }}</small></span><time>{{ new Date(event.createdAt).toLocaleString() }}</time></article><div v-if="!audit.length" class="small-empty">Actions that change organization data will appear here.</div></div></section>
    <section v-else class="panel-card admin-panel"><div class="panel-heading"><div><h2>Organization settings</h2><p>Basic contact and localization details.</p></div></div><form class="admin-settings" @submit.prevent><label>Organization display name<input v-model="settings.organizationName" placeholder="PropSphere Realty"/><button class="button button-outline" @click="saveSetting('organizationName')">Save</button></label><label>Support email<input v-model="settings.supportEmail" type="email" placeholder="support@example.com"/><button class="button button-outline" @click="saveSetting('supportEmail')">Save</button></label><label>Timezone<input v-model="settings.timezone" placeholder="Asia/Karachi"/><button class="button button-outline" @click="saveSetting('timezone')">Save</button></label></form></section>
  </main>
</template>
