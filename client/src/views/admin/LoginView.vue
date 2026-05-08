<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900">
    <div class="card p-8 w-full max-w-sm">
      <h1 class="text-2xl font-bold text-slate-800 mb-2 text-center">Capacitaciones SyH</h1>
      <p class="text-slate-500 text-sm mb-6 text-center">Panel de Administración</p>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Ingrese la contraseña"
            required
          />
        </div>
        <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
        <button
          type="submit"
          class="w-full btn-primary py-2"
          :disabled="loading"
        >
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(password.value)
    router.push('/admin')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
