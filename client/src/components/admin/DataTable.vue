<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th v-for="col in columns" :key="col.key" class="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" class="py-3 px-4 text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" :class="['border-b border-slate-100 hover:bg-slate-50 transition', rowClass?.(row) || '']">
          <td v-for="col in columns" :key="col.key" class="py-3 px-4">
            <slot :name="`cell-${col.key}`" :row="row">
              {{ row[col.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="py-3 px-4 text-right">
            <slot name="actions" :row="row" />
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length + 1" class="py-8 text-center text-slate-400">
            No hay datos disponibles
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowClass: { type: Function, default: null },
})
</script>
