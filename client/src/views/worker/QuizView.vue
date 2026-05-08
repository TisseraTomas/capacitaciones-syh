<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <header class="bg-white shadow-sm px-4 py-3">
      <div class="flex items-center justify-between max-w-md mx-auto">
        <span class="text-sm text-slate-500">Pregunta {{ currentIndex + 1 }} de {{ preguntas.length }}</span>
        <span class="text-sm font-medium" :class="puntajeColor">{{ Math.round(progreso) }}%</span>
      </div>
      <div class="mt-2 max-w-md mx-auto">
        <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600 rounded-full transition-all duration-300" :style="{ width: progreso + '%' }"></div>
        </div>
      </div>
    </header>

    <main class="flex-1 flex flex-col px-4 py-6 max-w-md mx-auto w-full">
      <div v-if="preguntas.length === 0" class="flex-1 flex items-center justify-center text-slate-400">
        <p>Cargando preguntas...</p>
      </div>

      <template v-else>
        <div class="flex-1 space-y-6">
          <h2 class="text-xl font-semibold text-slate-800">{{ preguntaActual.texto }}</h2>

          <div class="space-y-3">
            <button
              v-for="opcion in preguntaActual.opciones"
              :key="opcion.id"
              @click="seleccionarOpcion(opcion.id)"
              class="w-full py-4 px-4 text-left text-lg rounded-xl border-2 transition font-medium"
              :class="respuestaSeleccionada === opcion.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
            >
              {{ opcion.texto }}
            </button>
          </div>
        </div>

        <div class="mt-6">
          <button
            @click="siguientePregunta"
            class="w-full py-4 text-lg font-semibold rounded-xl transition"
            :class="respuestaSeleccionada
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'"
            :disabled="!respuestaSeleccionada"
          >
            {{ esUltima ? 'Finalizar' : 'Siguiente' }}
          </button>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const preguntas = ref([])
const currentIndex = ref(0)
const respuestas = ref({})

const preguntaActual = computed(() => preguntas.value[currentIndex.value] || {})
const respuestaSeleccionada = computed(() => respuestas.value[preguntaActual.value.id])
const progreso = computed(() => ((currentIndex.value + 1) / preguntas.value.length) * 100)
const esUltima = computed(() => currentIndex.value >= preguntas.value.length - 1)
const puntajeColor = computed(() => progreso.value < 50 ? 'text-red-500' : progreso.value < 80 ? 'text-amber-500' : 'text-emerald-500')

function seleccionarOpcion(opcionId) {
  respuestas.value = { ...respuestas.value, [preguntaActual.value.id]: opcionId }
}

async function siguientePregunta() {
  if (!respuestaSeleccionada.value) return

  if (esUltima.value) {
    await enviarIntento()
  } else {
    currentIndex.value++
  }
}

async function enviarIntento() {
  const token = localStorage.getItem('worker_token')
  if (!token) {
    router.replace(`/c/${route.params.token}`)
    return
  }

  const payload = {
    respuestas: Object.entries(respuestas.value).map(([preguntaId, opcionId]) => ({
      preguntaId: Number(preguntaId),
      opcionId,
    })),
  }

  try {
    const res = await axios.post(`/api/c/${route.params.token}/intento`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    localStorage.setItem('worker_result', JSON.stringify(res.data))
    router.replace(`/c/${route.params.token}/resultado`)
  } catch (e) {
    const errData = e.response?.data
    if (errData?.error === 'LIMITE_ALCANZADO') {
      localStorage.setItem('limite_alcanzado', 'true')
      router.replace(`/c/${route.params.token}/resultado`)
    } else {
      alert(errData?.mensaje || 'Error al enviar respuestas')
    }
  }
}

onMounted(async () => {
  const token = localStorage.getItem('worker_token')
  if (!token) {
    router.replace(`/c/${route.params.token}`)
    return
  }
  try {
    const res = await axios.get(`/api/c/${route.params.token}/preguntas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    preguntas.value = res.data
  } catch {
    router.replace(`/c/${route.params.token}`)
  }
})
</script>
