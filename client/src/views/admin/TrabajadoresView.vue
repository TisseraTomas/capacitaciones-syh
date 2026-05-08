<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <router-link to="/admin/empresas" class="text-blue-600 text-sm hover:underline">&larr; Empresas</router-link>
        <h1 class="text-2xl font-bold text-slate-800 mt-1">{{ empresa?.nombre || 'Trabajadores' }}</h1>
      </div>
      <div class="flex gap-2">
        <button @click="showCsvModal = true" class="btn-ghost text-sm border border-slate-300">
          Cargar CSV
        </button>
        <button @click="showModal = true" class="btn-primary text-sm">
          + Nuevo Trabajador
        </button>
      </div>
    </div>

    <div v-if="csvResultado" class="mb-4 p-4 rounded-lg" :class="csvResultado.tipo === 'ok' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'">
      {{ csvResultado.mensaje }}
    </div>

    <div class="relative mb-4">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">&#128269;</span>
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por nombre o DNI..."
        class="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>

    <div class="card">
      <div v-if="cargandoDatos" class="flex items-center justify-center py-12 text-slate-400">
        <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
        <span>Cargando trabajadores...</span>
      </div>
      <DataTable
        v-else
        :columns="[
          { key: 'nombreCompleto', label: 'Nombre Completo' },
          { key: 'dni', label: 'DNI' },
        ]"
        :rows="trabajadores"
      >
        <template #actions="{ row }">
          <div class="flex items-center gap-2 justify-end">
            <button @click="confirmDelete(row)" title="Eliminar" class="p-1.5 rounded-md transition-colors duration-200 cursor-pointer bg-red-50 text-red-700 hover:bg-red-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showModal = false">
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 class="text-lg font-semibold mb-4">Nuevo Trabajador</h2>
        <form @submit.prevent="handleCreate">
          <div class="mb-3">
            <label class="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
            <input v-model="form.nombreCompleto" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">DNI</label>
            <input v-model="form.dni" type="text" inputmode="numeric" pattern="\d{7,8}" maxlength="8" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" @click="showModal = false" class="btn-ghost text-sm">Cancelar</button>
            <button type="submit" class="btn-primary text-sm" :disabled="loading">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showCsvModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showCsvModal = false">
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 class="text-lg font-semibold mb-4">Cargar CSV</h2>
        <p class="text-sm text-slate-500 mb-4">El archivo debe tener las columnas: <code class="bg-slate-100 px-1 rounded">nombreCompleto</code>, <code class="bg-slate-100 px-1 rounded">dni</code></p>
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          @change="handleCsv"
          class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p v-if="csvError" class="text-red-500 text-sm mt-3">{{ csvError }}</p>
        <div class="flex justify-end gap-3 mt-4">
          <button type="button" @click="showCsvModal = false; csvError = ''" class="btn-ghost text-sm">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../composables/useApi'
import DataTable from '../../components/admin/DataTable.vue'
import { useToast } from '../../composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const route = useRoute()
const empresa = ref(null)
const trabajadores = ref([])
const showModal = ref(false)
const showCsvModal = ref(false)
const loading = ref(false)
const cargandoDatos = ref(true)
const error = ref('')
const form = ref({ nombreCompleto: '', dni: '' })
const fileInput = ref(null)
const csvError = ref('')
const csvResultado = ref(null)
const busqueda = ref('')
let debounceTimer = null

async function load() {
  const [emp, trabs] = await Promise.all([
    api.get('/admin/empresas').then(list => list.find(e => e.id === Number(route.params.empresaId))),
    api.get(`/admin/empresas/${route.params.empresaId}/trabajadores${busqueda.value ? `?search=${encodeURIComponent(busqueda.value)}` : ''}`),
  ])
  empresa.value = emp
  trabajadores.value = trabs
}

watch(busqueda, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 400)
})

async function handleCreate() {
  error.value = ''

  const dniLimpio = form.value.dni.trim()
  if (!/^\d{7,8}$/.test(dniLimpio)) {
    error.value = 'El DNI debe contener entre 7 y 8 dígitos numéricos'
    toastError(error.value)
    return
  }

  loading.value = true
  try {
    await api.post(`/admin/empresas/${route.params.empresaId}/trabajadores`, { ...form.value, dni: dniLimpio })
    showModal.value = false
    form.value = { nombreCompleto: '', dni: '' }
    await load()
    toastSuccess('Trabajador creado correctamente')
  } catch (e) {
    error.value = e.message
    toastError(e.message)
  } finally {
    loading.value = false
  }
}

async function confirmDelete(row) {
  if (!confirm(`¿Eliminar "${row.nombreCompleto}"?`)) return
  try {
    await api.delete(`/admin/trabajadores/${row.id}`)
    await load()
    toastSuccess('Trabajador eliminado')
  } catch (e) {
    toastError(e.message)
  }
}

function leerArchivo(file, encoding) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, encoding)
  })
}

async function leerConFallback(file) {
  let text = await leerArchivo(file, 'UTF-8')
  if (/[\uFFFD\uFFFE\u0000]/.test(text) || text.includes('\uFFFD')) {
    text = await leerArchivo(file, 'ISO-8859-1')
  }
  return text
}

function handleCsv(e) {
  csvError.value = ''
  csvResultado.value = null
  const file = e.target.files[0]
  if (!file) return

  ;(async () => {
    const text = await leerConFallback(file)
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      csvError.value = 'El archivo debe tener un encabezado y al menos una fila de datos'
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const idxNombre = headers.indexOf('nombrecompleto')
    const idxDni = headers.indexOf('dni')

    if (idxNombre === -1 || idxDni === -1) {
      csvError.value = 'El CSV debe contener las columnas "nombreCompleto" y "dni"'
      return
    }

    const trabajadoresData = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      if (cols.length < 2) continue
      const nombreCompleto = cols[idxNombre]
      const dni = cols[idxDni]
      if (nombreCompleto && dni) {
        trabajadoresData.push({ nombreCompleto, dni })
      }
    }

    if (trabajadoresData.length === 0) {
      csvError.value = 'No se encontraron datos válidos en el CSV'
      return
    }

    try {
      const res = await api.post(`/admin/empresas/${route.params.empresaId}/trabajadores/bulk`, {
        trabajadores: trabajadoresData,
      })
      csvResultado.value = {
        tipo: 'ok',
        mensaje: `Se cargaron ${res.count} trabajador(es) correctamente.`,
      }
      showCsvModal.value = false
      await load()
    } catch (e) {
      csvError.value = e.message
    }
  })()
}

onMounted(async () => {
  try {
    await load()
  } finally {
    cargandoDatos.value = false
  }
})
</script>