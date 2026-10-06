import { defineStore } from 'pinia'
import type { Session } from '../types'

function readSession(): Session | null {
  const saved = localStorage.getItem('propsphere-session') || sessionStorage.getItem('propsphere-session')
  if (!saved) return null
  try { return JSON.parse(saved) as Session } catch { return null }
}

export const useSessionStore = defineStore('session', {
  state: () => ({ session: readSession() }),
  getters: { isAdmin: (state) => state.session?.user.role === 'ADMIN' },
  actions: {
    setSession(session: Session, rememberMe = true) {
      this.session = session
      localStorage.removeItem('propsphere-session'); localStorage.removeItem('propsphere-token')
      sessionStorage.removeItem('propsphere-session'); sessionStorage.removeItem('propsphere-token')
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem('propsphere-session', JSON.stringify(session))
      storage.setItem('propsphere-token', session.token)
    },
    clear() {
      this.session = null
      localStorage.removeItem('propsphere-session'); localStorage.removeItem('propsphere-token')
      sessionStorage.removeItem('propsphere-session'); sessionStorage.removeItem('propsphere-token')
    },
  },
})
