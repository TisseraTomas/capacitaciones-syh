<template>
  <div v-if="data">
    <router-link to="/admin/cuestionarios" class="text-blue-600 text-sm hover:underline">&larr; Cuestionarios</router-link>
    <h1 class="text-2xl font-bold text-slate-800 mt-1 mb-2">{{ data.cuestionario.titulo }}</h1>
    <p class="text-slate-500 text-sm mb-6">{{ data.cuestionario.empresa }} &middot; {{ data.cuestionario.totalPreguntas }} preguntas &middot; {{ data.cuestionario.porcentajeAprobacion }}% para aprobar</p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card p-5">
        <p class="text-slate-500 text-sm">Total Trabajadores</p>
        <p class="text-3xl font-bold text-slate-800">{{ data.resultados.length }}</p>
      </div>
      <div class="card p-5">
        <p class="text-emerald-600 text-sm font-medium">Aprobados</p>
        <p class="text-3xl font-bold text-emerald-600">{{ aprobados }}</p>
      </div>
      <div class="card p-5">
        <p class="text-red-500 text-sm font-medium">Desaprobados</p>
        <p class="text-3xl font-bold text-red-500">{{ desaprobados }}</p>
      </div>
    </div>

    <div class="card p-5">
      <h2 class="text-lg font-semibold text-slate-700 mb-4">Resultados por Trabajador</h2>

      <DataTable
        :columns="[
          { key: 'nombre', label: 'Trabajador' },
          { key: 'dni', label: 'DNI' },
          { key: 'intentosCount', label: 'Intentos' },
          { key: 'estado', label: 'Estado' },
        ]"
        :rows="resultadosFlat"
      >
        <template #cell-nombre="{ row }">{{ row.trabajador.nombreCompleto }}</template>
        <template #cell-dni="{ row }">{{ row.trabajador.dni }}</template>
        <template #cell-intentosCount="{ row }">{{ row.intentos.length }}</template>
        <template #cell-estado="{ row }">
          <span v-if="row.ultimoEstado === true" class="badge-green">Aprobado</span>
          <span v-else-if="row.ultimoEstado === false" class="badge-red">Desaprobado</span>
          <span v-else class="text-slate-400 text-xs">Sin evaluar</span>
        </template>
      </DataTable>
    </div>
  </div>
  <div v-else class="text-center text-slate-400 py-12">Cargando...</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../composables/useApi'
import DataTable from '../../components/admin/DataTable.vue'

const route = useRoute()
const data = ref(null)

const resultadosFlat = computed(() => data.value?.resultados || [])

const aprobados = computed(() => resultadosFlat.value.filter(r => r.ultimoEstado === true).length)
const desaprobados = computed(() => resultadosFlat.value.filter(r => r.ultimoEstado === false).length)

onMounted(async () => {
  data.value = await api.get(`/admin/cuestionarios/${route.params.id}/resultados`)
})
</script>
