<script setup lang="ts">
import { useSessionStore } from '../stores/session'
const session = useSessionStore()
</script>
<template><main class="page-container route-message"><div class="eyebrow muted-eyebrow">ACCESS LIMITED</div><h1>This workspace needs another role</h1><p>Your current account doesn’t have access to this screen. Switch to an account with the right organization role.</p><RouterLink class="button button-primary" :to="session.session ? '/workspace' : '/login'">{{ session.session ? 'Open my workspace' : 'Sign in' }}</RouterLink></main></template>
