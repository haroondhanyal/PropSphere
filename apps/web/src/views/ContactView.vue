<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, CheckCircle2, Mail, MessageSquareText, Send } from 'lucide-vue-next'
import { api } from '../api'
const route = useRoute()
const form = ref({ name: '', email: '', topic: String(route.query.topic || ''), message: '' })
const sending = ref(false); const error = ref(''); const success = ref('')
watch(() => route.query.topic, (topic) => { if (topic) form.value.topic = String(topic) })
async function send() {
  sending.value = true; error.value = ''; success.value = ''
  try { const { data } = await api.post('/contact', form.value); success.value = data.message; form.value.message = '' }
  catch (e: any) { error.value = e.response?.data?.message || 'We could not send your message. Please try again later.' }
  finally { sending.value = false }
}
</script>
<template><div class="marketing-page page-container contact-page"><section class="marketing-intro contact-intro"><div class="eyebrow muted-eyebrow">CONTACT PROPSPHERE</div><h1>Tell us what you’re looking for.</h1><p>Questions about listings, a team workspace, notifications, or subscriptions? Send a note and our team can follow up.</p></section><div class="contact-layout"><form class="contact-form" @submit.prevent="send"><div v-if="success" class="contact-success"><CheckCircle2 :size="19"/>{{success}}</div><div v-if="error" class="form-error">{{Array.isArray(error)?error.join(', '):error}}</div><div class="contact-fields"><label>Your name<input v-model="form.name" required maxlength="100" autocomplete="name" placeholder="Your name"/></label><label>Email address<input v-model="form.email" required type="email" maxlength="254" autocomplete="email" placeholder="you@example.com"/></label><label class="contact-wide">What can we help with?<select v-model="form.topic" required><option value="" disabled>Select a topic</option><option>Property listing</option><option>Buyer or renter support</option><option>Workspace plans</option><option>Email notifications</option><option>Subscriptions</option><option>Other</option></select></label><label class="contact-wide">Your message<textarea v-model="form.message" required maxlength="2000" rows="6" placeholder="Share a little context so we can point you in the right direction."></textarea></label></div><button class="button button-primary" :disabled="sending"><Send :size="16"/>{{sending?'Sending…':'Send message'}}</button><small class="contact-privacy">Your message is emailed to the PropSphere team when SMTP delivery is configured.</small></form><aside class="contact-side"><article><span><MessageSquareText :size="18"/></span><h2>Property support</h2><p>For a specific listing, open its page and use the contact form to create a property-linked inquiry.</p><RouterLink to="/search">Browse listings <ArrowRight :size="14"/></RouterLink></article><article><span><Mail :size="18"/></span><h2>Workspace help</h2><p>Ask about team access, listing review, email delivery, or the available property workflows.</p><RouterLink to="/features">Explore platform features <ArrowRight :size="14"/></RouterLink></article><div class="contact-hours"><b>Email notifications</b><p>Inbox and saved-search emails require the PropSphere server to have SMTP configured.</p></div></aside></div></div></template>
