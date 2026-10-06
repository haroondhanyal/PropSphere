<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Camera, LogOut, Save, UserRound } from 'lucide-vue-next'
import { api, mediaUrl } from '../api'
import { useSessionStore } from '../stores/session'
import type { Session } from '../types'
const session = useSessionStore()
const form = ref({ name: session.session?.user.name || '', email: session.session?.user.email || '', phone: '', accountType: 'OWNER', avatarUrl: '' })
const photo = ref<File | null>(null)
const photoPreview = ref('')
const saving = ref(false)
const message = ref('')
const error = ref('')
onMounted(async () => { try { const { data } = await api.get('/auth/profile'); form.value = { ...form.value, ...data }; if (session.session) session.session.user = { ...session.session.user, ...data } } catch { error.value = 'Could not load your profile.' } })
function pickPhoto(event: Event) { if (photoPreview.value) URL.revokeObjectURL(photoPreview.value); photo.value = (event.target as HTMLInputElement).files?.[0] || null; photoPreview.value = photo.value ? URL.createObjectURL(photo.value) : '' }
async function save() {
  if (!session.session) return
  saving.value = true; error.value = ''; message.value = ''
  try {
    if (photo.value) {
      if (photo.value.size > 5 * 1024 * 1024) throw new Error('Profile photos must be smaller than 5 MB.')
      const body = new FormData(); body.append('files', photo.value); body.append('kind', 'avatar'); body.append('totalBytes', String(photo.value.size))
      const upload = await api.post('/properties/media', body); form.value.avatarUrl = upload.data.urls[0]; photo.value = null; photoPreview.value = ''
    }
    const { data } = await api.patch('/auth/profile', form.value)
    session.setSession({ ...session.session, user: { ...session.session.user, ...data } } as Session)
    message.value = 'Profile updated.'
  } catch (e: any) { error.value = e.response?.data?.message || e.message || 'Could not save your profile.' }
  finally { saving.value = false }
}
</script>
<template><div class="page-container profile-page"><div class="page-heading"><div><div class="eyebrow muted-eyebrow">YOUR ACCOUNT</div><h1>Profile settings</h1><p>Update your contact details and profile photo.</p></div><button class="button button-outline" @click="session.clear()"><LogOut :size="16"/> Sign out</button></div><form class="profile-card" @submit.prevent="save"><div class="profile-avatar"><img v-if="photoPreview" :src="photoPreview" alt="Selected profile photo"/><img v-else-if="form.avatarUrl" :src="mediaUrl(form.avatarUrl)" alt="Profile photo"/><UserRound v-else :size="32"/><label class="avatar-upload" title="Change profile photo"><Camera :size="16"/><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="pickPhoto"/></label></div><div v-if="error" class="form-error">{{ error }}</div><div v-if="message" class="notice">{{ message }}</div><div class="profile-fields"><label>Full name<input v-model="form.name" required maxlength="100"/></label><label>Email address<input v-model="form.email" type="email" disabled/><small>Email changes require account verification.</small></label><label>Phone number<input v-model="form.phone" type="tel" maxlength="40" placeholder="+92 300 1234567"/></label><label>Account type<select v-model="form.accountType"><option value="BUYER">Buyer</option><option value="TENANT">Tenant</option><option value="OWNER">Property owner / lister</option></select></label></div><div class="profile-actions"><span>Profile photos up to 5 MB.</span><button class="button button-primary" :disabled="saving"><Save :size="16"/>{{ saving ? 'Saving…' : 'Save profile' }}</button></div></form></div></template>
