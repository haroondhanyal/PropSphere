import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import SearchView from './views/SearchView.vue'
import PropertyView from './views/PropertyView.vue'
import FavoritesView from './views/FavoritesView.vue'
import ReviewView from './views/ReviewView.vue'
import LoginView from './views/LoginView.vue'
import SubmitListingView from './views/SubmitListingView.vue'
import WorkspaceLayout from './views/WorkspaceLayout.vue'
import WorkspaceHomeView from './views/WorkspaceHomeView.vue'
import LeadsView from './views/LeadsView.vue'
import ViewingsView from './views/ViewingsView.vue'
import DealsView from './views/DealsView.vue'
import PortfolioView from './views/PortfolioView.vue'
import LeasesView from './views/LeasesView.vue'
import RentView from './views/RentView.vue'
import MaintenanceView from './views/MaintenanceView.vue'
import SavedSearchesView from './views/SavedSearchesView.vue'
import InboxView from './views/InboxView.vue'
import DevelopmentsView from './views/DevelopmentsView.vue'
import FinanceView from './views/FinanceView.vue'
import StaysView from './views/StaysView.vue'
import AdminView from './views/AdminView.vue'
import AdminLayout from './views/AdminLayout.vue'
import VendorBillsView from './views/VendorBillsView.vue'
import SignupView from './views/SignupView.vue'
import PasswordView from './views/PasswordView.vue'
import SalesTeamView from './views/SalesTeamView.vue'
import ProfileView from './views/ProfileView.vue'
import AboutView from './views/AboutView.vue'
import FeaturesView from './views/FeaturesView.vue'
import PlansView from './views/PlansView.vue'
import ContactView from './views/ContactView.vue'

declare module 'vue-router' {
  interface RouteMeta { auth?: boolean; admin?: boolean; roles?: string[] }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/about', component: AboutView },
    { path: '/features', component: FeaturesView },
    { path: '/plans', component: PlansView },
    { path: '/contact', component: ContactView },
    { path: '/search', component: SearchView },
    { path: '/property/:slug', component: PropertyView },
    { path: '/favorites', component: FavoritesView },
    { path: '/stays', component: StaysView },
    { path: '/list-property', component: SubmitListingView, meta: { auth: true } },
    { path: '/profile', component: ProfileView, meta: { auth: true } },
    { path: '/workspace', component: WorkspaceLayout, meta: { auth: true }, children: [
      { path: '', component: WorkspaceHomeView },
      { path: 'leads', component: LeadsView, meta: { roles: ['ADMIN', 'AGENT'] } },
      { path: 'sales-team', component: SalesTeamView, meta: { roles: ['ADMIN', 'SALES_MANAGER'] } },
      { path: 'viewings', component: ViewingsView },
      { path: 'deals', component: DealsView },
      { path: 'portfolio', component: PortfolioView, meta: { roles: ['ADMIN', 'OWNER', 'AGENT'] } },
      { path: 'leases', component: LeasesView },
      { path: 'rent', component: RentView },
      { path: 'maintenance', component: MaintenanceView },
      { path: 'searches', component: SavedSearchesView },
      { path: 'inbox', component: InboxView },
      { path: 'developments', component: DevelopmentsView, meta: { roles: ['ADMIN', 'OWNER', 'AGENT', 'DEVELOPER'] } },
      { path: 'stays', component: StaysView },
      { path: 'finance', component: FinanceView, meta: { roles: ['ADMIN', 'OWNER', 'FINANCE'] } },
      { path: 'vendor-bills', component: VendorBillsView, meta: { roles: ['ADMIN', 'OWNER', 'FINANCE', 'VENDOR'] } },
    ] },
    { path: '/admin', component: AdminLayout, meta: { admin: true }, children: [
      { path: '', component: AdminView },
      { path: 'review', component: ReviewView },
    ] },
    { path: '/login', component: LoginView },
    { path: '/signup', component: SignupView },
    { path: '/forgot-password', component: PasswordView },
    { path: '/reset-password', component: PasswordView },
    { path: '/:pathMatch(.*)*', redirect: '/not-found' },
    { path: '/not-found', component: () => import('./views/NotFoundView.vue') },
    { path: '/unauthorized', component: () => import('./views/UnauthorizedView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const session = localStorage.getItem('propsphere-session') || sessionStorage.getItem('propsphere-session')
  if (to.meta.auth && !session) return `/login?next=${encodeURIComponent(to.fullPath)}`
  if (to.meta.admin && !session) return `/login?portal=admin&next=${encodeURIComponent(to.fullPath)}`
  if (session) {
    try {
      const role = JSON.parse(session).user.role as string
      if (to.meta.admin && role !== 'ADMIN') return '/unauthorized'
      if (to.meta.roles && !to.meta.roles.includes(role)) return '/unauthorized'
    } catch { localStorage.removeItem('propsphere-session'); localStorage.removeItem('propsphere-token'); sessionStorage.removeItem('propsphere-session'); sessionStorage.removeItem('propsphere-token'); return '/login' }
  }
})

export default router
