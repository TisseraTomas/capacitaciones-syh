<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Empresas</h1>
      <button @click="showModal = true" class="btn-primary text-sm">
        + Nueva Empresa
      </button>
    </div>

    <div class="relative mb-4">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">&#128269;</span>
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por nombre..."
        class="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>

    <div class="card">
      <div v-if="cargandoDatos" class="flex items-center justify-center py-12 text-slate-400">
        <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
        <span>Cargando empresas...</span>
      </div>
      <DataTable
        v-else
        :columns="[
          { key: 'nombre', label: 'Nombre' },
          { key: 'trabajadores', label: 'Trabajadores' },
          { key: 'cuestionarios', label: 'Cuestionarios' },
        ]"
        :rows="empresas"
      >
        <template #cell-trabajadores="{ row }">{{ row._count?.trabajadores || 0 }}</template>
        <template #cell-cuestionarios="{ row }">{{ row._count?.cuestionarios || 0 }}</template>
        <template #actions="{ row }">
          <div class="flex items-center gap-2 justify-end">
            <router-link :to="`/admin/empresas/${row.id}/trabajadores`" title="Ver trabajadores" class="p-1.5 rounded-md transition-colors duration-200 cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </router-link>
            <button @click="confirmDelete(row)" title="Eliminar" class="p-1.5 rounded-md transition-colors duration-200 cursor-pointer bg-red-50 text-red-700 hover:bg-red-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showModal = false">
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 class="text-lg font-semibold mb-4">Nueva Empresa</h2>
        <form @submit.prevent="handleCreate">
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input v-model="form.nombre" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required minlength="2" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../../composables/useApi'
import DataTable from '../../components/admin/DataTable.vue'

import { useToast } from '../../composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const empresas = ref([])
const showModal = ref(false)
const loading = ref(false)
const cargandoDatos = ref(true)
const error = ref('')
const form = ref({ nombre: '' })
const busqueda = ref('')
let debounceTimer = null

async function load() {
  const params = busqueda.value ? `?search=${encodeURIComponent(busqueda.value)}` : ''
  empresas.value = await api.get(`/admin/empresas${params}`)
}

watch(busqueda, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 400)
})

async function handleCreate() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/admin/empresas', { nombre: form.value.nombre })
    showModal.value = false
    form.value.nombre = ''
    await load()
    toastSuccess('Empresa creada correctamente')
  } catch (e) {
    error.value = e.message
    toastError(e.message)
  } finally {
    loading.value = false
  }
}

async function confirmDelete(row) {
  if (!confirm(`¿Eliminar "${row.nombre}"?`)) return
  try {
    await api.delete(`/admin/empresas/${row.id}`)
    await load()
    toastSuccess('Empresa eliminada')
  } catch (e) {
    toastError(e.message)
  }
}

onMounted(async () => {
  try {
    await load()
  } finally {
    cargandoDatos.value = false
  }
})
</script>