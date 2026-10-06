<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'
import type { Session } from '../types'
const email = ref('')
const password = ref('')
const passwordVisible = ref(false)
const error = ref('')
const loading = ref(false)
const rememberMe = ref(true)
const router = useRouter()
const route = useRoute()
const adminPortal = computed(() => route.query.portal === 'admin')
const session = useSessionStore()
async function signIn() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post<Session>('/auth/login', { email: email.value, password: password.value, rememberMe: rememberMe.value })
    if (adminPortal.value && data.user.role !== 'ADMIN') { error.value = 'This account does not have admin access. Sign in with an administrator account.'; return }
    session.setSession(data, rememberMe.value)
    await router.replace(String(route.query.next || (adminPortal.value ? '/admin' : '/')))
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not sign in. Check your email and password.' } finally { loading.value = false }
}
</script>

<template><div class="login-layout"><RouterLink to="/" class="back-link"><ArrowLeft :size="16"/> Back to PropSphere</RouterLink><div class="login-card"><img src="/propsphere-logo.svg" alt="PropSphere" class="login-logo"/><div class="eyebrow muted-eyebrow">{{adminPortal?'ADMINISTRATOR ACCESS':'WELCOME BACK'}}</div><h1>{{adminPortal?'Sign in as Admin':'Sign in to your account'}}</h1><p>{{adminPortal?'Access organization controls, approvals and every workspace team.':'Continue to your PropSphere workspace.'}}</p><div v-if="adminPortal" class="admin-login-badge"><ShieldCheck :size="16"/> Secure administrator portal</div><form class="auth-form" @submit.prevent="signIn"><label>Email address<input v-model="email" type="email" autocomplete="username" required placeholder="you@example.com"/></label><label>Password<span class="password-field"><input v-model="password" :type="passwordVisible?'text':'password'" autocomplete="current-password" required placeholder="Your password"/><button type="button" class="password-toggle" :aria-label="passwordVisible?'Hide password':'Show password'" :title="passwordVisible?'Hide password':'Show password'" @click="passwordVisible=!passwordVisible"><EyeOff v-if="passwordVisible" :size="17"/><Eye v-else :size="17"/></button></span></label><label class="remember-check"><input v-model="rememberMe" type="checkbox"/> Keep me signed in</label><div v-if="error" class="form-error">{{error}}</div><button class="button button-primary full-button" :disabled="loading"><LockKeyhole :size="16"/>{{loading?'Signing in…':'Sign in'}}</button></form><div class="auth-links"><RouterLink to="/forgot-password">Forgot password?</RouterLink><RouterLink v-if="!adminPortal" to="/login?portal=admin">Sign in as Admin</RouterLink><RouterLink v-else to="/login">Customer sign in</RouterLink><RouterLink to="/signup">Create an account</RouterLink></div><div class="demo-hint"><b>Demo admin</b><span>demo@propsphere.local</span><span>Phase1Demo!</span></div></div><small class="login-foot">Secure access to your properties and workspace.</small></div></template>
