<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, UserPlus } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'
import type { Session } from '../types'

const router = useRouter()
const session = useSessionStore()
const form = ref({ name: '', email: '', organizationName: '', password: '' })
const loading = ref(false)
const error = ref('')
async function signUp() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.post<Session>('/auth/signup', form.value)
    session.setSession(data)
    await router.replace('/workspace')
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not create your account.' }
  finally { loading.value = false }
}
</script>

<template><div class="login-layout"><RouterLink to="/" class="back-link"><ArrowLeft :size="16" /> Back to PropSphere</RouterLink><div class="login-card"><img src="/propsphere-logo.svg" alt="PropSphere" class="login-logo" /><div class="eyebrow muted-eyebrow">START YOUR WORKSPACE</div><h1>Create your account</h1><p>Your organization gets its own private workspace.</p><form @submit.prevent="signUp"><label>Your name<input v-model="form.name" required maxlength="100" autocomplete="name" placeholder="Your name" /></label><label>Work email<input v-model="form.email" required type="email" autocomplete="email" placeholder="you@example.com" /></label><label>Organization name<input v-model="form.organizationName" required maxlength="120" placeholder="Company or team" /></label><label>Password<input v-model="form.password" required type="password" minlength="10" autocomplete="new-password" placeholder="At least 10 characters" /></label><div v-if="error" class="form-error">{{ Array.isArray(error) ? error.join(', ') : error }}</div><button class="button button-primary full-button" :disabled="loading"><UserPlus :size="16" />{{ loading ? 'Creating…' : 'Create workspace' }}</button></form><div class="auth-links"><RouterLink to="/login">Already registered? Sign in</RouterLink></div></div></div></template>
