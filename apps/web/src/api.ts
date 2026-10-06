import axios from 'axios'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api' })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('propsphere-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
