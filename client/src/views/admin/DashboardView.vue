<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="card p-5">
        <p class="text-slate-500 text-sm">Empresas</p>
        <p class="text-3xl font-bold text-slate-800">{{ stats.empresas }}</p>
      </div>
      <div class="card p-5">
        <p class="text-slate-500 text-sm">Cuestionarios</p>
        <p class="text-3xl font-bold text-slate-800">{{ stats.cuestionarios }}</p>
      </div>
      <div class="card p-5">
        <p class="text-slate-500 text-sm">Trabajadores</p>
        <p class="text-3xl font-bold text-slate-800">{{ stats.trabajadores }}</p>
      </div>
    </div>

    <div class="card p-5">
      <h2 class="text-lg font-semibold text-slate-700 mb-4">Últimos Cuestionarios</h2>
      <DataTable
        :columns="[
          { key: 'titulo', label: 'Título' },
          { key: 'empresa', label: 'Empresa' },
          { key: 'contestaron', label: 'Contestaron' },
          { key: 'faltan', label: 'Faltan' },
        ]"
        :rows="ultimosCuestionarios"
      >
        <template #cell-empresa="{ row }">{{ row.empresa?.nombre || '-' }}</template>
        <template #cell-contestaron="{ row }">
          <span class="badge-green">{{ row.contestaronCount ?? 0 }}</span>
        </template>
        <template #cell-faltan="{ row }">
          <span class="badge-red">{{ row.faltanCount ?? 0 }}</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../composables/useApi'
import DataTable from '../../components/admin/DataTable.vue'

const stats = ref({ empresas: 0, cuestionarios: 0, trabajadores: 0 })
const ultimosCuestionarios = ref([])

onMounted(async () => {
  const [empresas, cuestionarios] = await Promise.all([
    api.get('/admin/empresas'),
    api.get('/admin/cuestionarios'),
  ])
  stats.value.empresas = empresas.length
  stats.value.cuestionarios = cuestionarios.length
  stats.value.trabajadores = empresas.reduce((acc, e) => acc + (e._count?.trabajadores || 0), 0)
  ultimosCuestionarios.value = cuestionarios.slice(0, 5)
})
</script>
