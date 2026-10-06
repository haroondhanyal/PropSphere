<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Eye, EyeOff, House, KeyRound, ShoppingBag, UserPlus } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'
import type { Session } from '../types'
const router = useRouter()
const session = useSessionStore()
const form = ref({ name: '', email: '', organizationName: '', password: '', accountType: 'BUYER' })
const passwordVisible = ref(false)
const accountTypes = [
  { id: 'BUYER', label: 'Buyer', help: 'Buy a property', icon: ShoppingBag },
  { id: 'TENANT', label: 'Tenant', help: 'Find a rental', icon: KeyRound },
  { id: 'OWNER', label: 'Owner', help: 'List a property', icon: House },
]
const loading = ref(false)
const error = ref('')
async function signUp() {
  loading.value = true; error.value = ''
  try { const { data } = await api.post<Session>('/auth/signup', form.value); session.setSession(data); await router.replace('/') }
  catch (e: any) { error.value = e.response?.data?.message || 'Could not create your account.' }
  finally { loading.value = false }
}
</script>
<template><div class="login-layout signup-layout"><RouterLink to="/" class="back-link"><ArrowLeft :size="16"/> Back to PropSphere</RouterLink><div class="login-card signup-card"><img src="/propsphere-logo.svg" alt="PropSphere" class="login-logo"/><div class="eyebrow muted-eyebrow">START YOUR WORKSPACE</div><h1>Create your account</h1><p>Your organization gets a private workspace. Choose how you plan to use PropSphere.</p><form class="signup-form" @submit.prevent="signUp"><label>Your name<input v-model="form.name" required maxlength="100" autocomplete="name" placeholder="Your name"/></label><label>Email address<input v-model="form.email" required type="email" autocomplete="email" placeholder="you@example.com"/></label><label class="signup-wide">Organization name<input v-model="form.organizationName" required maxlength="120" placeholder="Company, team, or personal"/></label><fieldset class="account-type-field signup-wide"><legend>Account type</legend><div class="account-type-options" role="radiogroup" aria-label="Choose account type"><label v-for="option in accountTypes" :key="option.id" class="account-type-option" :class="{'is-selected':form.accountType===option.id}"><input v-model="form.accountType" type="radio" name="accountType" :value="option.id"/><component :is="option.icon" :size="19"/><span><b>{{option.label}}</b><small>{{option.help}}</small></span></label></div></fieldset><label class="signup-wide">Password<span class="password-field"><input v-model="form.password" :type="passwordVisible?'text':'password'" required minlength="10" autocomplete="new-password" placeholder="At least 10 characters"/><button type="button" class="password-toggle" :aria-label="passwordVisible?'Hide password':'Show password'" :title="passwordVisible?'Hide password':'Show password'" @click="passwordVisible=!passwordVisible"><EyeOff v-if="passwordVisible" :size="17"/><Eye v-else :size="17"/></button></span><small>Use at least 10 characters.</small></label><div v-if="error" class="form-error signup-wide">{{Array.isArray(error)?error.join(', '):error}}</div><button class="button button-primary full-button signup-wide" :disabled="loading"><UserPlus :size="16"/>{{loading?'Creating…':'Create account'}}</button></form><div class="auth-links"><RouterLink to="/login">Already registered? Sign in</RouterLink></div></div></div></template>
