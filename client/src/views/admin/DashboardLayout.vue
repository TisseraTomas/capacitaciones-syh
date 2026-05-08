<template>
  <div class="min-h-screen">
    <aside class="fixed top-0 left-0 w-64 h-screen bg-slate-800 text-white flex flex-col z-40">
      <div class="p-5 border-b border-slate-700">
        <h2 class="text-lg font-bold">Capacitaciones</h2>
        <p class="text-slate-400 text-xs">Panel Admin</p>
      </div>
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition"
          :class="$route.path === item.path ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'"
        >
          <span v-html="item.icon"></span>
          {{ item.label }}
        </router-link>
      </nav>
      <div class="p-4 border-t border-slate-700">
        <button
          @click="handleLogout"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 w-full transition"
        >
          <span>&#9881;</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
    <main class="ml-64 h-screen overflow-y-auto p-6">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const menu = [
  { path: '/admin', label: 'Dashboard', icon: '&#9632;' },
  { path: '/admin/empresas', label: 'Empresas', icon: '&#9632;' },
  { path: '/admin/cuestionarios', label: 'Cuestionarios', icon: '&#9632;' },
]

function handleLogout() {
  auth.logout()
  router.push('/admin/login')
}
</script>
