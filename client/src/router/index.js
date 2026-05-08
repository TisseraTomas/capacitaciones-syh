import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/LoginView.vue'),
  },
  {
    path: '/admin',
    component: () => import('../views/admin/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/admin/DashboardView.vue') },
      { path: 'empresas', name: 'Empresas', component: () => import('../views/admin/EmpresasView.vue') },
      { path: 'empresas/:empresaId/trabajadores', name: 'Trabajadores', component: () => import('../views/admin/TrabajadoresView.vue') },
      { path: 'cuestionarios', name: 'Cuestionarios', component: () => import('../views/admin/CuestionariosView.vue') },
      { path: 'cuestionarios/nuevo', name: 'CuestionarioNuevo', component: () => import('../views/admin/CuestionarioFormView.vue') },
      { path: 'cuestionarios/:id', name: 'CuestionarioDetalle', component: () => import('../views/admin/CuestionarioFormView.vue') },
      { path: 'cuestionarios/:id/resultados', name: 'Resultados', component: () => import('../views/admin/ResultadosView.vue') },
    ],
  },
  {
    path: '/c/:token',
    name: 'WorkerHome',
    component: () => import('../views/worker/HomeView.vue'),
  },
  {
    path: '/c/:token/quiz',
    name: 'WorkerQuiz',
    component: () => import('../views/worker/QuizView.vue'),
  },
  {
    path: '/c/:token/resultado',
    name: 'WorkerResult',
    component: () => import('../views/worker/ResultView.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/admin/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('admin_token')
    if (!token) return next('/admin/login')
  }
  next()
})

export default router
