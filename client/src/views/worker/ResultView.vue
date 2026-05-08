<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">

      <div v-if="limiteAlcanzado">
        <div class="text-6xl mb-4 text-red-500">&#9888;</div>
        <h1 class="text-2xl font-bold text-slate-800 mb-3">Límite Alcanzado</h1>
        <p class="text-slate-500 mb-6">Has alcanzado el límite de intentos permitidos para esta capacitación.</p>
      </div>

      <template v-else-if="resultado">
        <div class="text-6xl mb-4" :class="resultado.aprobado ? 'text-emerald-500' : 'text-red-500'">
          {{ resultado.aprobado ? '&#10003;' : '&#10007;' }}
        </div>
        <h1 class="text-2xl font-bold mb-2" :class="resultado.aprobado ? 'text-emerald-600' : 'text-red-500'">
          {{ resultado.aprobado ? '¡Aprobado!' : 'Desaprobado' }}
        </h1>

        <div class="my-6">
          <div class="text-5xl font-bold text-slate-800 mb-1">{{ resultado.puntaje.toFixed(0) }}%</div>
          <p class="text-slate-500 text-sm">
            {{ resultado.totalCorrectas }} de {{ resultado.totalPreguntas }} respuestas correctas
          </p>
          <p class="text-slate-500 text-sm mt-1">
            Mínimo para aprobar: {{ resultado.porcentajeAprobacion }}%
          </p>
        </div>

        <div class="w-full bg-slate-200 rounded-full h-3 mb-6">
          <div
            class="h-full rounded-full transition-all duration-1000"
            :class="resultado.aprobado ? 'bg-emerald-500' : 'bg-red-500'"
            :style="{ width: resultado.puntaje + '%' }"
          ></div>
        </div>

        <div class="space-y-3 mt-6">
          <button
            v-if="resultado.aprobado"
            @click="descargarConstancia"
            class="w-full py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            Descargar Constancia
          </button>

          <router-link
            v-if="!resultado.aprobado && (resultado.esIlimitado || resultado.intentosRestantes > 0)"
            :to="`/c/${token}/quiz`"
            class="block w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl text-center hover:bg-blue-700 transition"
          >
            Intentar nuevamente{{ resultado.esIlimitado ? '' : ` (${resultado.intentosRestantes} restante${resultado.intentosRestantes !== 1 ? 's' : ''})` }}
          </router-link>
        </div>
      </template>

      <div v-else class="py-8 text-slate-400">
        <p>Cargando resultado...</p>
      </div>

      <p class="text-slate-400 text-xs mt-8">Capacitaciones SyH - Seguridad e Higiene</p>
    </div>

    <canvas ref="certCanvas" class="hidden"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const limiteAlcanzado = ref(false)
const resultado = ref(null)
const certCanvas = ref(null)
const token = route.params.token
const datosPersonales = ref(null)

function descargarConstancia() {
  const canvas = certCanvas.value
  if (!canvas || !resultado.value) return

  const ctx = canvas.getContext('2d')
  const w = 800, h = 600
  canvas.width = w
  canvas.height = h

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, w, h)

  const grad = ctx.createLinearGradient(0, 0, 0, 120)
  grad.addColorStop(0, '#1e293b')
  grad.addColorStop(1, '#334155')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, 120)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Constancia de Capacitación', w / 2, 50)
  ctx.font = '16px Arial'
  ctx.fillText('Seguridad e Higiene', w / 2, 80)

  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 150)
  ctx.lineTo(w - 80, 150)
  ctx.stroke()

  ctx.fillStyle = '#1e293b'
  ctx.font = '14px Arial'
  ctx.textAlign = 'left'
  const data = [
    { label: 'Trabajador', value: datosPersonales.value?.nombre || '-' },
    { label: 'DNI', value: datosPersonales.value?.dni || '-' },
    { label: 'Capacitación', value: datosPersonales.value?.titulo || '-' },
    { label: 'Resultado', value: resultado.value.aprobado ? 'Aprobado' : 'Desaprobado' },
    { label: 'Puntaje', value: `${resultado.value.puntaje.toFixed(0)}%` },
    { label: 'Fecha', value: new Date().toLocaleDateString('es-AR') },
  ]
  data.forEach((d, i) => {
    const y = 190 + i * 40
    ctx.fillStyle = '#64748b'
    ctx.font = 'bold 12px Arial'
    ctx.fillText(d.label, 100, y)
    ctx.fillStyle = '#0f172a'
    ctx.font = '16px Arial'
    ctx.fillText(d.value, 100, y + 22)
  })

  ctx.strokeStyle = '#cbd5e1'
  ctx.beginPath()
  ctx.moveTo(100, 440)
  ctx.lineTo(400, 440)
  ctx.stroke()
  ctx.fillStyle = '#64748b'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Firma del Licenciado', 250, 460)

  const link = document.createElement('a')
  link.download = `constancia-${datosPersonales.value?.dni || 'cert'}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  localStorage.removeItem('worker_info')
}

onMounted(() => {
  if (localStorage.getItem('limite_alcanzado')) {
    limiteAlcanzado.value = true
    localStorage.removeItem('limite_alcanzado')
  }

  const stored = localStorage.getItem('worker_result')
  if (stored) {
    resultado.value = JSON.parse(stored)
    localStorage.removeItem('worker_result')
  }

  const info = localStorage.getItem('worker_info')
  if (info) {
    datosPersonales.value = JSON.parse(info)
  }

  const workerToken = localStorage.getItem('worker_token')
  if (resultado.value?.aprobado) {
    localStorage.removeItem('worker_token')
  } else if (resultado.value && !resultado.value.aprobado && !resultado.value.esIlimitado && resultado.value.intentosRestantes <= 0) {
    localStorage.removeItem('worker_token')
  }
})
</script>
