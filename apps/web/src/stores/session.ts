import { defineStore } from 'pinia'
import type { Session } from '../types'

const saved = localStorage.getItem('propsphere-session')
export const useSessionStore = defineStore('session', {
  state: () => ({ session: (saved ? JSON.parse(saved) : null) as Session | null }),
  getters: { isAdmin: (state) => state.session?.user.role === 'ADMIN' },
  actions: {
    setSession(session: Session) {
      this.session = session
      localStorage.setItem('propsphere-session', JSON.stringify(session))
      localStorage.setItem('propsphere-token', session.token)
    },
    clear() {
      this.session = null
      localStorage.removeItem('propsphere-session')
      localStorage.removeItem('propsphere-token')
    },
  },
})
