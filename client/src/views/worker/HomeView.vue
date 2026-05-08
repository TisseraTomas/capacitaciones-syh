<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
      <div v-if="cargando" class="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg class="animate-spin h-8 w-8 mb-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
        <p>Cargando cuestionario...</p>
      </div>

      <template v-else-if="inactivo">
        <div class="text-center py-4">
          <div class="text-amber-500 text-6xl mb-4">&#128274;</div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">Cuestionario Inactivo</h2>
          <p class="text-slate-500 text-sm">Este cuestionario se encuentra inactivo o ha sido cerrado por el administrador.</p>
        </div>
      </template>

      <template v-else-if="aprobadoPerfecto">
        <div class="text-center py-4">
          <div class="text-emerald-500 text-6xl mb-4">&#9733;</div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">¡Felicitaciones!</h2>
          <p class="text-slate-500 text-sm">Ya aprobaste esta capacitación con el 100% de los puntos. No es necesario que vuelvas a realizarla.</p>
        </div>
      </template>

      <template v-else-if="!logueado">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-slate-800">{{ cuestionario.titulo }}</h1>
          <p class="text-slate-500 text-sm mt-1">{{ cuestionario.empresa }}</p>
          <p v-if="cuestionario.descripcion" class="text-slate-400 text-sm mt-3">{{ cuestionario.descripcion }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2 text-center">Ingrese su número de DNI</label>
            <input
              v-model="dni"
              type="text"
              inputmode="numeric"
              pattern="\d{7,8}"
              maxlength="8"
              class="w-full text-center text-2xl py-4 px-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="DNI"
              autocomplete="off"
              required
            />
          </div>

          <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>

          <button
            type="submit"
            class="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 focus:ring-4 focus:ring-blue-200 flex items-center justify-center gap-2"
            :disabled="loading"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            {{ loading ? 'Verificando...' : 'Comenzar' }}
          </button>
        </form>
      </template>

      <div v-else class="text-center py-4">
        <div class="text-emerald-500 text-5xl mb-3">&#10003;</div>
        <h2 class="text-xl font-bold text-slate-800 mb-1">¡Bienvenido, {{ nombre }}!</h2>
        <p v-if="esIlimitado" class="text-slate-500 text-sm mb-6">Intentos disponibles: Ilimitados</p>
        <p v-else class="text-slate-500 text-sm mb-6">Tienes {{ intentosRestantes }} intento(s) disponible(s)</p>
        <router-link
          :to="`/c/${route.params.token}/quiz`"
          class="block w-full py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl text-center hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md focus:ring-4 focus:ring-emerald-200"
        >
          Ir al Cuestionario
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const cuestionario = ref(null)
const cargando = ref(true)
const logueado = ref(false)
const inactivo = ref(false)
const dni = ref('')
const nombre = ref('')
const intentosRestantes = ref(0)
const esIlimitado = ref(false)
const aprobadoPerfecto = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''

  const dniLimpio = dni.value.trim()
  if (!/^\d{7,8}$/.test(dniLimpio)) {
    error.value = 'El DNI debe contener entre 7 y 8 dígitos numéricos'
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await axios.post(`/api/c/${route.params.token}/login`, { dni: dniLimpio })
    localStorage.setItem('worker_token', res.data.workerToken)
    localStorage.setItem('worker_info', JSON.stringify({
      nombre: res.data.nombre,
      dni: res.data.dni,
      titulo: res.data.titulo,
    }))
    nombre.value = res.data.nombre
    intentosRestantes.value = res.data.intentosRestantes
    esIlimitado.value = res.data.esIlimitado
    logueado.value = true
  } catch (e) {
    const errData = e.response?.data
    error.value = errData?.error || errData?.mensaje || 'Error al iniciar sesión'

    if (errData?.error === 'LIMITE_ALCANZADO') {
      localStorage.setItem('limite_alcanzado', 'true')
    }
    if (errData?.error === 'YA_APROBADO_PERFECTO') {
      aprobadoPerfecto.value = true
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await axios.get(`/api/c/${route.params.token}`)
    cuestionario.value = res.data
    cargando.value = false
  } catch (e) {
    const errData = e.response?.data
    if (errData?.error === 'CUESTIONARIO_INACTIVO') {
      inactivo.value = true
      cargando.value = false
    } else {
      error.value = 'Cuestionario no encontrado'
      cargando.value = false
    }
  }
})
</script>
