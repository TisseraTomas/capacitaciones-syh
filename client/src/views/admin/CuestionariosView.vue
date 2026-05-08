<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Cuestionarios</h1>
      <router-link to="/admin/cuestionarios/nuevo" class="btn-primary text-sm">
        + Nuevo Cuestionario
      </router-link>
    </div>

    <div class="relative mb-4">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">&#128269;</span>
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por título o empresa..."
        class="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>

    <div class="card">
      <div v-if="cargandoDatos" class="flex items-center justify-center py-12 text-slate-400">
        <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
        <span>Cargando cuestionarios...</span>
      </div>
      <DataTable
        v-if="!cargandoDatos"
        :columns="[
          { key: 'titulo', label: 'Título' },
          { key: 'empresa', label: 'Empresa' },
          { key: 'progreso', label: 'Progreso' },
          { key: 'estado', label: 'Estado' },
          { key: 'minAprob', label: '% Aprob.' },
          { key: 'preguntas', label: 'Preguntas' },
          { key: 'activo', label: 'Activo' },
        ]"
        :rows="cuestionarios"
        :row-class="rowClass"
      >
        <template #cell-empresa="{ row }">{{ row.empresa?.nombre || '-' }}</template>
        <template #cell-progreso="{ row }">
          <span class="text-slate-700 font-medium">{{ row.contestaronCount ?? 0 }} / {{ row.totalTrabajadores ?? 0 }}</span>
        </template>
        <template #cell-estado="{ row }">
          <span v-if="row.faltanCount === 0" class="badge-green">Completado</span>
          <span v-else class="badge-amber">En curso</span>
        </template>
        <template #cell-minAprob="{ row }">{{ row.porcentajeAprobacion }}%</template>
        <template #cell-preguntas="{ row }">{{ row._count?.preguntas || 0 }}</template>
        <template #cell-activo="{ row }">
          <span :class="row.activo ? 'badge-green' : 'badge-red'" class="text-xs">
            {{ row.activo ? 'Sí' : 'No' }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-2 justify-end">
            <button @click="abrirCompartir(row)" title="Compartir" class="p-1.5 rounded-md transition-colors duration-200 cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
            <router-link :to="`/admin/cuestionarios/${row.id}`" title="Editar" class="p-1.5 rounded-md transition-colors duration-200 cursor-pointer bg-slate-50 text-slate-700 hover:bg-slate-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </router-link>
            <router-link :to="`/admin/cuestionarios/${row.id}/resultados`" title="Resultados" class="p-1.5 rounded-md transition-colors duration-200 cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </router-link>
            <button @click="toggleActivo(row)" :title="row.activo ? 'Desactivar' : 'Activar'" class="p-1.5 rounded-md transition-colors duration-200 cursor-pointer bg-orange-50 text-orange-700 hover:bg-orange-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
            <button @click="confirmDelete(row)" title="Eliminar" class="p-1.5 rounded-md transition-colors duration-200 cursor-pointer bg-red-50 text-red-700 hover:bg-red-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </template>
      </DataTable>
      <div v-if="cargandoMas" class="text-center py-4 text-slate-400 text-sm">Cargando más...</div>
      <div v-if="!hayMas && total > 0" class="text-center py-4 text-slate-400 text-xs">Todos los cuestionarios cargados</div>
    </div>

    <div v-if="compartirModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="compartirModal = false">
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 class="text-lg font-semibold mb-1">Compartir Cuestionario</h2>
        <p class="text-sm text-slate-500 mb-4">{{ compartirData?.titulo }}</p>

        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">URL de acceso</label>
          <div class="flex items-center gap-2">
            <input :value="compartirUrl" readonly class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" @focus="$event.target.select()" />
            <button @click="copiarUrl" class="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-600 transition whitespace-nowrap">Copiar</button>
          </div>
        </div>

        <div v-if="qrSvg" class="flex flex-col items-center gap-3 pt-2 border-t border-slate-100">
          <div v-html="qrSvg" class="w-32 flex justify-center mx-auto"></div>
          <button @click="descargarQR" class="btn-primary text-sm">
            Descargar QR
          </button>
        </div>
        <div v-else class="text-center text-slate-400 text-sm py-4">
          Cargando QR...
        </div>

        <div class="flex justify-end mt-4">
          <button @click="compartirModal = false" class="btn-ghost text-sm">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import api from '../../composables/useApi'
import DataTable from '../../components/admin/DataTable.vue'

const PAGE_SIZE = 15

const cuestionarios = ref([])
const total = ref(0)
const offset = ref(0)
const cargandoMas = ref(false)
const cargandoDatos = ref(true)
const hayMas = ref(true)

const busqueda = ref('')
let debounceTimer = null
let scrollEl = null

const compartirModal = ref(false)
const compartirData = ref(null)
const qrSvg = ref('')

function rowClass(row) {
  return row.faltanCount === 0 ? 'border-l-4 border-l-emerald-500 bg-emerald-50/40' : ''
}

const compartirUrl = computed(() => {
  if (!compartirData.value) return ''
  return `${window.location.origin}/c/${compartirData.value.urlToken || compartirData.value.id}`
})

async function cargarBloque(reset) {
  if (reset) {
    offset.value = 0
    cuestionarios.value = []
    hayMas.value = true
  }
  if (!hayMas.value || cargandoMas.value) return

  cargandoMas.value = true
  try {
    const params = `?limit=${PAGE_SIZE}&offset=${offset.value}${busqueda.value ? `&search=${encodeURIComponent(busqueda.value)}` : ''}`
    const resp = await api.get(`/admin/cuestionarios${params}`)
    if (Array.isArray(resp)) {
      cuestionarios.value = resp
      hayMas.value = false
    } else {
      const nuevos = resp.data || []
      cuestionarios.value = [...cuestionarios.value, ...nuevos]
      total.value = resp.total ?? 0
      offset.value += nuevos.length
      hayMas.value = nuevos.length >= PAGE_SIZE
    }
  } finally {
    cargandoMas.value = false
  }
}

function onScroll() {
  if (!scrollEl || cargandoMas.value || !hayMas.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollEl
  if (scrollTop + clientHeight >= scrollHeight - 300) {
    cargarBloque(false)
  }
}

watch(busqueda, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => cargarBloque(true), 400)
})

onMounted(async () => {
  scrollEl = document.querySelector('.ml-64')
  if (scrollEl) scrollEl.addEventListener('scroll', onScroll)
  try {
    await cargarBloque(true)
  } finally {
    cargandoDatos.value = false
  }
})

onUnmounted(() => {
  if (scrollEl) scrollEl.removeEventListener('scroll', onScroll)
  clearTimeout(debounceTimer)
})

async function abrirCompartir(row) {
  compartirData.value = row
  qrSvg.value = ''
  compartirModal.value = true
  try {
    const qr = await api.get(`/admin/cuestionarios/${row.id}/qr`)
    qrSvg.value = qr.qrSvg
  } catch {}
}

async function descargarQR() {
  try {
    const blob = await api.get(`/admin/cuestionarios/${compartirData.value.id}/qr/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr_capacitacion.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('Error al descargar QR')
  }
}

async function copiarUrl() {
  try {
    await navigator.clipboard.writeText(compartirUrl.value)
    alert('URL copiada al portapapeles')
  } catch {
    prompt('Copiar esta URL:', compartirUrl.value)
  }
}

async function toggleActivo(row) {
  try {
    await api.put(`/admin/cuestionarios/${row.id}`, { activo: !row.activo })
    await cargarBloque(true)
  } catch (e) {
    alert(e.message)
  }
}

async function confirmDelete(row) {
  if (!confirm(`¿Eliminar "${row.titulo}"?`)) return
  try {
    await api.delete(`/admin/cuestionarios/${row.id}`)
    await cargarBloque(true)
  } catch (e) {
    alert(e.message)
  }
}
</script>