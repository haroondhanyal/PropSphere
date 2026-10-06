import axios from 'axios'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:3002/api' : '/api') })
export function hasSessionToken() {
  return Boolean(localStorage.getItem('propsphere-token') || sessionStorage.getItem('propsphere-token'))
}
export function mediaUrl(value?: string | null) {
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return `${String(api.defaults.baseURL).replace(/\/api\/?$/, '')}${value.startsWith('/') ? value : `/${value}`}`
}
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('propsphere-token') || sessionStorage.getItem('propsphere-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
