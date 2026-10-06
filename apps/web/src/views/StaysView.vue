<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CalendarDays, MapPin, Moon, Plus, Users } from 'lucide-vue-next'
import { api } from '../api'
import { useSessionStore } from '../stores/session'

type Stay = { id: string; title: string; city: string; address: string; description: string; imageUrl: string; nightlyRate: number | string; maxGuests: number; bedrooms: number }
type Booking = { id: string; checkIn: string; checkOut: string; guests: number; totalAmount: number | string; status: string; stay: Stay }
const session = useSessionStore()
const stays = ref<Stay[]>([])
const bookings = ref<Booking[]>([])
const city = ref('')
const error = ref('')
const success = ref('')
const selected = ref('')
const busy = ref(false)
const isManager = computed(() => ['ADMIN', 'OWNER'].includes(session.session?.user.role || ''))
const listing = reactive({ title: '', city: 'Islamabad', address: '', description: '', imageUrl: '', nightlyRate: 0, maxGuests: 2, bedrooms: 1 })
const bookingForm = reactive({ checkIn: '', checkOut: '', guests: 1 })
const selectedStay = computed(() => stays.value.find((stay) => stay.id === selected.value))
const today = new Date().toISOString().slice(0, 10)
const bookingTotal = computed(() => { if (!selectedStay.value || !bookingForm.checkIn || !bookingForm.checkOut) return 0; const nights = Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / 86400000); return nights > 0 ? nights * Number(selectedStay.value.nightlyRate) : 0 })
const money = (amount: number | string) => `PKR ${Number(amount).toLocaleString()}`
async function load() {
  busy.value = true; error.value = ''
  try { const { data } = await api.get('/stays', { params: city.value ? { city: city.value } : {} }); stays.value = data; selected.value ||= stays.value[0]?.id || ''; if (session.session) bookings.value = (await api.get('/stay-bookings')).data }
  catch (e: any) { error.value = e.response?.data?.message || 'Could not load stays.' }
  finally { busy.value = false }
}
async function createStay() { try { await api.post('/stays', listing); Object.assign(listing, { title: '', city: 'Islamabad', address: '', description: '', imageUrl: '', nightlyRate: 0, maxGuests: 2, bedrooms: 1 }); success.value = 'Stay listing published.'; await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not publish this stay.' } }
async function bookStay() { if (!selected.value) return; try { await api.post('/stay-bookings', { ...bookingForm, stayId: selected.value, checkIn: new Date(`${bookingForm.checkIn}T12:00:00`).toISOString(), checkOut: new Date(`${bookingForm.checkOut}T12:00:00`).toISOString() }); success.value = 'Stay request sent. The host will confirm availability.'; Object.assign(bookingForm, { checkIn: '', checkOut: '', guests: 1 }); await load() } catch (e: any) { error.value = e.response?.data?.message || 'Those dates could not be booked.' } }
async function bookingStatus(item: Booking, status: string) { try { await api.patch(`/stay-bookings/${item.id}/status`, { status }); await load() } catch (e: any) { error.value = e.response?.data?.message || 'Could not update booking.' } }
onMounted(load)
</script>

<template>
  <main class="page-container stays-page">
    <div class="page-heading"><div><div class="eyebrow muted-eyebrow">A STAY THAT FEELS LIKE HOME</div><h1>Short stays</h1><p>Furnished homes for a few nights or a few weeks.</p></div><RouterLink v-if="!session.session" class="button button-outline" to="/login?next=/stays">Sign in to book</RouterLink></div>
    <div v-if="error" class="notice error-notice">{{ error }}</div><div v-if="success" class="notice">{{ success }}</div>
    <div class="stay-search"><MapPin :size="17"/><input v-model="city" placeholder="Search city" @keydown.enter="load"/><button class="button button-primary" @click="load">Find stays</button></div>
    <div v-if="busy" class="loading-row">Finding available homes…</div>
    <div v-else-if="stays.length" class="stay-layout"><div class="stay-grid"><button v-for="stay in stays" :key="stay.id" class="stay-card" :class="{ selected: selected === stay.id }" @click="selected = stay.id"><img :src="stay.imageUrl" :alt="stay.title"/><span class="stay-card-body"><small><MapPin :size="13"/>{{ stay.city }} · {{ stay.address }}</small><b>{{ stay.title }}</b><span>{{ stay.bedrooms }} bedrooms · up to {{ stay.maxGuests }} guests</span><strong>{{ money(stay.nightlyRate) }} <small>/ night</small></strong></span></button></div>
      <aside class="panel-card stay-booking-panel"><template v-if="selectedStay"><div class="eyebrow muted-eyebrow">BOOK YOUR DATES</div><h2>{{ selectedStay.title }}</h2><p>{{ selectedStay.description }}</p><form v-if="session.session" @submit.prevent="bookStay"><label>Check-in<input v-model="bookingForm.checkIn" type="date" :min="today" required /></label><label>Check-out<input v-model="bookingForm.checkOut" type="date" :min="bookingForm.checkIn || today" required /></label><label>Guests<select v-model="bookingForm.guests"><option v-for="n in selectedStay.maxGuests" :key="n" :value="n">{{ n }} guest{{ n > 1 ? 's' : '' }}</option></select></label><div class="stay-estimate"><span><Moon :size="15"/>Total for selected nights</span><b>{{ money(bookingTotal) }}</b></div><button class="button button-primary full-button" :disabled="!bookingTotal">Request booking</button></form><RouterLink v-else class="button button-primary full-button" to="/login?next=/stays">Sign in to request dates</RouterLink></template><div v-else class="small-empty">Select a home to view the booking details.</div></aside></div>
    <div v-else class="empty-state"><span class="empty-icon"><CalendarDays/></span><h3>No short stays listed yet</h3><p>Hosts can publish furnished homes from their workspace.</p></div>
    <section v-if="isManager" class="panel-card stay-create-panel"><div class="panel-heading"><div><h2>Publish a furnished stay</h2><p>Set a nightly price and guest capacity.</p></div><Plus :size="18"/></div><form class="stay-create-form" @submit.prevent="createStay"><label>Title<input v-model="listing.title" required maxlength="140"/></label><label>City<input v-model="listing.city" required/></label><label>Area / address<input v-model="listing.address" required/></label><label>Nightly price PKR<input v-model="listing.nightlyRate" type="number" min="1" required/></label><label>Max guests<input v-model="listing.maxGuests" type="number" min="1" required/></label><label>Bedrooms<input v-model="listing.bedrooms" type="number" min="0" required/></label><label class="wide">Photo URL<input v-model="listing.imageUrl" type="url" required placeholder="https://…"/></label><label class="wide">Description<textarea v-model="listing.description" required rows="3" maxlength="2000"/></label><button class="button button-primary"><Plus :size="14"/>Publish stay</button></form></section>
    <section v-if="session.session && bookings.length" class="stay-bookings"><div class="section-toolbar"><div><h2>{{ isManager ? 'Guest reservations' : 'My stay requests' }}</h2><p>Track requests and confirmations.</p></div><Users :size="18"/></div><article v-for="booking in bookings" :key="booking.id" class="stay-booking-row"><span><b>{{ booking.stay.title }}</b><small>{{ new Date(booking.checkIn).toLocaleDateString() }} – {{ new Date(booking.checkOut).toLocaleDateString() }} · {{ booking.guests }} guests · {{ money(booking.totalAmount) }}</small></span><em class="status-pill" :class="booking.status.toLowerCase()">{{ booking.status }}</em><button v-if="isManager && booking.status === 'REQUESTED'" class="button button-outline" @click="bookingStatus(booking, 'CONFIRMED')">Confirm</button><button v-if="['REQUESTED','CONFIRMED'].includes(booking.status)" class="button button-outline" @click="bookingStatus(booking, 'CANCELLED')">Cancel</button></article></section>
  </main>
</template>
