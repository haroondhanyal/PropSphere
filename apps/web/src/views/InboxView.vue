<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowUpRight, MessageCircle, Send } from 'lucide-vue-next'
import { api } from '../api'
const conversations=ref<any[]>([])
const selectedId=ref('')
const reply=ref('')
const loading=ref(true)
const sending=ref(false)
const error=ref('')
const selected=computed(()=>conversations.value.find(x=>x.id===selectedId.value)||null)
async function load(){loading.value=true;try{conversations.value=(await api.get('/inquiries')).data;if(!selectedId.value&&conversations.value.length)selectedId.value=conversations.value[0].id}catch(e:any){error.value=e.response?.data?.message||'Could not load your inbox.'}finally{loading.value=false}}
async function send(){if(!reply.value.trim()||!selected.value)return;sending.value=true;error.value='';try{await api.post(`/inquiries/${selected.value.id}/messages`,{body:reply.value});reply.value='';await load()}catch(e:any){error.value=e.response?.data?.message||'Could not send this message.'}finally{sending.value=false}}
function initials(name:string){return name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function latest(item:any){return item.messages?.[item.messages.length-1]||null}
function previewBody(item:any){const message=latest(item);return message?message.body:item.message}
function previewDate(item:any){const message=latest(item);return new Date(message?message.createdAt:item.createdAt).toLocaleDateString()}
function messageDate(message:any){return new Date(message.createdAt).toLocaleString()}
onMounted(load)
</script>

<template><section class="workspace-content"><div class="section-toolbar"><div><h2>Inbox</h2><p>Property inquiries connect customers and the listing team in one thread.</p></div><span class="count-pill">{{conversations.length}} conversations</span></div><div v-if="error" class="notice error-notice">{{error}}</div><div v-if="loading" class="loading-row">Loading conversations…</div><div v-else class="inbox-layout"><aside class="inbox-list"><button v-for="item in conversations" :key="item.id" class="inbox-item" :class="{selected:selectedId===item.id}" @click="selectedId=item.id"><span class="inbox-avatar">{{initials(item.sender.name)}}</span><span class="inbox-preview"><b>{{item.sender.name}}</b><small>{{item.property.title}}</small><p>{{previewBody(item)}}</p></span><small class="inbox-time">{{previewDate(item)}}</small></button><div v-if="!conversations.length" class="inbox-empty"><MessageCircle/><b>No conversations yet</b><span>Send an inquiry from a property page to start one.</span><RouterLink to="/search">Explore homes <ArrowUpRight :size="13"/></RouterLink></div></aside><section v-if="selected" class="conversation-panel"><header class="conversation-header"><span class="inbox-avatar">{{initials(selected.sender.name)}}</span><span><b>{{selected.sender.name}}</b><small>{{selected.property.title}} · {{selected.property.community}}</small></span><RouterLink :to="`/property/${selected.property.slug}`" aria-label="View property"><ArrowUpRight :size="17"/></RouterLink></header><div class="conversation-messages"><div class="property-message-card"><b>{{selected.property.title}}</b><span>{{selected.property.community}}, {{selected.property.city}}</span><RouterLink :to="`/property/${selected.property.slug}`">View listing</RouterLink></div><article v-for="message in selected.messages" :key="message.id" class="message-row" :class="{ mine: message.senderId === selected.senderId }"><span class="inbox-avatar tiny">{{initials(message.sender.name)}}</span><div><small>{{message.sender.name}} · {{messageDate(message)}}</small><p>{{message.body}}</p></div></article></div><form class="conversation-compose" @submit.prevent="send"><textarea v-model="reply" required maxlength="1200" rows="2" placeholder="Write a reply…"></textarea><button class="button button-primary" :disabled="sending"><Send :size="15"/>{{sending?'Sending…':'Send'}}</button></form></section><section v-else class="conversation-empty"><MessageCircle/><h3>Select a conversation</h3><p>Messages and property context appear here.</p></section></div></section></template>
