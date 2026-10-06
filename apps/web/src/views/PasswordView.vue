<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, KeyRound, Mail } from 'lucide-vue-next'
import { api } from '../api'

const route = useRoute()
const router = useRouter()
const token = computed(() => String(route.query.token || ''))
const email = ref('')
const password = ref('')
const message = ref('')
const error = ref('')
const loading = ref(false)
async function submit() {
  loading.value = true; message.value = ''; error.value = ''
  try {
    if (token.value) {
      const { data } = await api.post('/auth/reset-password', { token: token.value, password: password.value })
      message.value = data.message
      window.setTimeout(() => router.replace('/login'), 1200)
    } else {
      const { data } = await api.post('/auth/forgot-password', { email: email.value })
      message.value = data.message
    }
  } catch (e: any) { error.value = e.response?.data?.message || 'Could not complete the password request.' }
  finally { loading.value = false }
}
</script>

<template><div class="login-layout"><RouterLink to="/login" class="back-link"><ArrowLeft :size="16" /> Back to sign in</RouterLink><div class="login-card"><img src="/propsphere-logo.svg" alt="PropSphere" class="login-logo" /><div class="eyebrow muted-eyebrow">ACCOUNT RECOVERY</div><h1>{{ token ? 'Choose a new password' : 'Forgot your password?' }}</h1><p>{{ token ? 'Set a new password for your account.' : 'Enter your account email. If it exists, we will email you a secure reset link.' }}</p><form @submit.prevent="submit"><label v-if="!token">Email address<input v-model="email" required type="email" autocomplete="email" placeholder="you@example.com" /></label><label v-else>New password<input v-model="password" required type="password" minlength="10" autocomplete="new-password" placeholder="At least 10 characters" /></label><div v-if="error" class="form-error">{{ error }}</div><div v-if="message" class="notice">{{ message }}</div><button class="button button-primary full-button" :disabled="loading"><Mail v-if="!token" :size="16"/><KeyRound v-else :size="16"/>{{ loading ? 'Please wait…' : token ? 'Update password' : 'Send reset link' }}</button></form></div></div></template>
