<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, LockKeyhole } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'
import type { Session } from '../types'
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const route = useRoute()
const session = useSessionStore()
async function signIn() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post<Session>('/auth/login', { email: email.value, password: password.value })
    session.setSession(data)
    await router.replace(String(route.query.next || '/'))
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not sign in. Check your email and password.' } finally { loading.value = false }
}
</script>

<template><div class="login-layout"><RouterLink to="/" class="back-link"><ArrowLeft :size="16" /> Back to PropSphere</RouterLink><div class="login-card"><img src="/propsphere-logo.svg" alt="PropSphere" class="login-logo" /><div class="eyebrow muted-eyebrow">WELCOME BACK</div><h1>Sign in to your account</h1><p>Continue to your PropSphere workspace.</p><form @submit.prevent="signIn"><label>Email address<input v-model="email" type="email" autocomplete="username" required placeholder="you@example.com" /></label><label>Password<input v-model="password" type="password" autocomplete="current-password" required placeholder="Your password" /></label><div v-if="error" class="form-error">{{ error }}</div><button class="button button-primary full-button" :disabled="loading"><LockKeyhole :size="16" /> {{ loading ? 'Signing in…' : 'Sign in' }}</button></form><div class="auth-links"><RouterLink to="/forgot-password">Forgot password?</RouterLink><RouterLink to="/signup">Create a workspace</RouterLink></div><div class="demo-hint"><b>Demo admin</b><span>demo@propsphere.local</span><span>Phase1Demo!</span></div></div><small class="login-foot">Secure access to your properties and workspace.</small></div></template>
