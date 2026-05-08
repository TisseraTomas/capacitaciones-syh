<template>
  <div>
    <router-link to="/admin/cuestionarios" class="text-blue-600 text-sm hover:underline">&larr; Cuestionarios</router-link>
    <h1 class="text-2xl font-bold text-slate-800 mt-1 mb-6">{{ esEdicion ? 'Editar' : 'Nuevo' }} Cuestionario</h1>

    <form @submit.prevent="handleSubmit" class="max-w-3xl space-y-6">
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-slate-700">Información General</h2>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Título *</label>
          <input v-model="form.titulo" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <textarea v-model="form.descripcion" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Empresa *</label>
            <select v-model="form.empresaId" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
              <option value="" disabled>Seleccionar...</option>
              <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">% Aprobación *</label>
            <input v-model.number="form.porcentajeAprobacion" type="number" min="0" max="100" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
        </div>
        <div>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-slate-700 mb-1">Intentos permitidos</label>
              <input v-model.number="form.intentosPermitidos" type="number" min="1" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400" :disabled="intentosIlimitados" />
            </div>
            <div class="pt-5">
              <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" v-model="intentosIlimitados" @change="alternarIlimitado" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Intentos Ilimitados
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-slate-700">Preguntas</h2>
          <div class="flex gap-2">
            <button type="button" @click="abrirImportar" class="text-amber-600 text-sm font-medium hover:underline">Importar Preguntas</button>
            <button type="button" @click="agregarPregunta" class="text-blue-600 text-sm font-medium hover:underline">+ Agregar pregunta</button>
          </div>
        </div>

        <input ref="importInput" type="file" accept=".csv,.docx" class="hidden" @change="handleImportar" />

        <div v-if="importError" class="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{{ importError }}</div>
        <div v-if="importOk" class="p-3 bg-emerald-100 text-emerald-700 rounded-lg text-sm">{{ importOk }}</div>

        <div v-for="(p, idx) in form.preguntas" :key="idx" class="border border-slate-200 rounded-lg p-4 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Pregunta {{ idx + 1 }}</span>
            <button type="button" @click="form.preguntas.splice(idx, 1)" class="text-red-400 hover:text-red-600 text-sm">&times;</button>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Texto</label>
            <input v-model="p.texto" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <select v-model="p.tipo" class="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="MC">Multiple Choice</option>
                <option value="TF">Verdadero / Falso</option>
              </select>
            </div>
          </div>

          <div v-if="p.tipo === 'TF'" class="space-y-2">
            <label class="block text-xs font-medium text-slate-500 mb-1">Opciones</label>
            <div v-for="(o, oi) in opcionesTF" :key="oi" class="flex items-center gap-2">
              <input v-model="p.opciones[oi].texto" class="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <label class="flex items-center gap-1 text-sm">
                <input type="radio" :name="'correcta-' + idx" :checked="p.opciones[oi].esCorrecta" @change="setCorrecta(p, oi)" />
                Correcta
              </label>
            </div>
          </div>

          <div v-else class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-slate-500">Opciones</label>
              <button type="button" @click="agregarOpcion(p)" class="text-blue-600 text-xs hover:underline">+ Opción</button>
            </div>
            <div v-for="(o, oi) in p.opciones" :key="oi" class="flex items-center gap-2">
              <input v-model="o.texto" class="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Opción..." required />
              <label class="flex items-center gap-1 text-sm whitespace-nowrap">
                <input type="radio" :name="'correcta-' + idx" :checked="o.esCorrecta" @change="setCorrecta(p, oi)" />
                Correcta
              </label>
              <button type="button" @click="p.opciones.splice(oi, 1)" class="text-red-400 hover:text-red-600 text-sm" v-if="p.opciones.length > 2">&times;</button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <div class="flex justify-end gap-3 pb-8">
        <router-link to="/admin/cuestionarios" class="btn-ghost text-sm">Cancelar</router-link>
        <button type="submit" class="btn-primary text-sm disabled:opacity-50" :disabled="loading">
          {{ loading ? 'Guardando...' : 'Guardar Cuestionario' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../composables/useApi'
import mammoth from 'mammoth'

const route = useRoute()
const router = useRouter()
const esEdicion = route.name === 'CuestionarioDetalle'
const empresas = ref([])
const loading = ref(false)
const error = ref('')
const importInput = ref(null)
const importError = ref('')
const importOk = ref('')

const opcionesTF = [
  { texto: 'Verdadero', esCorrecta: false },
  { texto: 'Falso', esCorrecta: false },
]

const intentosIlimitados = ref(false)

const form = ref({
  titulo: '',
  descripcion: '',
  empresaId: '',
  porcentajeAprobacion: 60,
  intentosPermitidos: 1,
  preguntas: [],
})

function agregarPregunta() {
  form.value.preguntas.push({
    texto: '',
    tipo: 'MC',
    orden: form.value.preguntas.length,
    opciones: [
      { texto: '', esCorrecta: false },
      { texto: '', esCorrecta: false },
    ],
  })
}

function agregarOpcion(pregunta) {
  pregunta.opciones.push({ texto: '', esCorrecta: false })
}

function setCorrecta(pregunta, idx) {
  pregunta.opciones.forEach((o, i) => { o.esCorrecta = i === idx })
}

function abrirImportar() {
  importError.value = ''
  importOk.value = ''
  importInput.value?.click()
}

function alternarIlimitado() {
  if (intentosIlimitados.value) {
    form.value.intentosPermitidos = 0
  } else {
    form.value.intentosPermitidos = 1
  }
}

async function leerArchivo(file, encoding) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, encoding)
  })
}

async function leerArchivoBinario(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

async function leerConFallback(file) {
  let text = await leerArchivo(file, 'UTF-8')
  if (/[\uFFFD\uFFFE\u0000]/.test(text) || text.includes('\uFFFD')) {
    text = await leerArchivo(file, 'ISO-8859-1')
  }
  return text
}

function parsearCsvPreguntas(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) throw new Error('El CSV debe tener encabezado y al menos una pregunta')

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const idxPregunta = headers.indexOf('pregunta')
  const idxTipo = headers.indexOf('tipo')
  const idxOpc1 = headers.indexOf('opcion1')
  const idxOpc2 = headers.indexOf('opcion2')
  const idxOpc3 = headers.indexOf('opcion3')
  const idxCorrecta = headers.indexOf('respuestacorrecta')

  if (idxPregunta === -1) throw new Error('Columna "pregunta" requerida')

  const preguntas = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'))
    if (!cols[idxPregunta]) continue

    const tipo = (idxTipo !== -1 ? cols[idxTipo]?.toUpperCase() : '') || 'MC'
    const esTF = tipo === 'TF'

    const opciones = []
    if (esTF) {
      opciones.push({ texto: 'Verdadero', esCorrecta: false })
      opciones.push({ texto: 'Falso', esCorrecta: false })
    } else {
      if (idxOpc1 !== -1 && cols[idxOpc1]) opciones.push({ texto: cols[idxOpc1], esCorrecta: false })
      if (idxOpc2 !== -1 && cols[idxOpc2]) opciones.push({ texto: cols[idxOpc2], esCorrecta: false })
      if (idxOpc3 !== -1 && cols[idxOpc3]) opciones.push({ texto: cols[idxOpc3], esCorrecta: false })
      while (opciones.length < 2) opciones.push({ texto: '', esCorrecta: false })
    }

    if (idxCorrecta !== -1 && cols[idxCorrecta]) {
      const correctaIdx = parseInt(cols[idxCorrecta], 10) - 1
      if (!isNaN(correctaIdx) && opciones[correctaIdx]) {
        opciones[correctaIdx].esCorrecta = true
      }
    }

    preguntas.push({
      texto: cols[idxPregunta],
      tipo: esTF ? 'TF' : 'MC',
      orden: preguntas.length,
      opciones,
    })
  }

  if (preguntas.length === 0) throw new Error('No se encontraron preguntas válidas en el CSV')
  return preguntas
}

function parsearDocxPreguntas(text) {
  const opcionRegex = /^([A-D])\)\s*(.+)/
  const correctaRegex = /Correcta:\s*([A-D])/i
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const preguntas = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (opcionRegex.test(line)) { i++; continue }
    if (correctaRegex.test(line)) { i++; continue }
    if (/^\d+[\.\)]\s*/.test(line)) { i++; continue }

    const textoPregunta = line.replace(/^\d+[\.\)]\s*/, '')
    if (!textoPregunta) { i++; continue }

    i++
    const opciones = []
    let tipo = 'MC'

    while (i < lines.length) {
      const opMatch = lines[i].match(opcionRegex)
      if (opMatch) {
        opciones.push({ texto: opMatch[2], esCorrecta: false })
        i++
        continue
      }
      const corMatch = lines[i].match(correctaRegex)
      if (corMatch) {
        const letra = corMatch[1].toUpperCase()
        const idx = letra.charCodeAt(0) - 65
        if (opciones[idx]) opciones[idx].esCorrecta = true
        i++
        continue
      }
      if (/^\d+[\.\)]\s*/.test(lines[i])) break
      if (opciones.length > 0) break
      i++
    }

    if (opciones.length === 0) {
      opciones.push({ texto: 'Verdadero', esCorrecta: false })
      opciones.push({ texto: 'Falso', esCorrecta: false })
      tipo = 'TF'
    }

    while (opciones.length < 2) opciones.push({ texto: '', esCorrecta: false })

    preguntas.push({
      texto: textoPregunta,
      tipo,
      orden: preguntas.length,
      opciones,
    })
  }

  if (preguntas.length === 0) throw new Error('No se pudieron extraer preguntas del archivo. Verificá el formato.')
  return preguntas
}

async function handleImportar(e) {
  importError.value = ''
  importOk.value = ''
  const file = e.target.files[0]
  if (!file) return

  const ext = file.name.split('.').pop().toLowerCase()

  try {
    let preguntas = []

    if (ext === 'csv') {
      const text = await leerConFallback(file)
      preguntas = parsearCsvPreguntas(text)
    } else if (ext === 'docx') {
      const buffer = await leerArchivoBinario(file)
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      preguntas = parsearDocxPreguntas(result.value)
    } else {
      throw new Error('Formato no soportado. Usá CSV o DOCX.')
    }

    form.value.preguntas = preguntas
    importOk.value = `Se importaron ${preguntas.length} pregunta(s) correctamente.`
  } catch (err) {
    importError.value = err.message
  }

  e.target.value = ''
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (esEdicion) {
      await api.put(`/admin/cuestionarios/${route.params.id}`, {
        titulo: form.value.titulo,
        descripcion: form.value.descripcion,
        porcentajeAprobacion: form.value.porcentajeAprobacion,
        intentosPermitidos: form.value.intentosPermitidos,
      })
    } else {
      await api.post('/admin/cuestionarios', form.value)
    }
    router.push('/admin/cuestionarios')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  empresas.value = await api.get('/admin/empresas')
  if (esEdicion && route.params.id) {
    const c = await api.get(`/admin/cuestionarios/${route.params.id}`)
    intentosIlimitados.value = c.intentosPermitidos === 0
    form.value = {
      titulo: c.titulo,
      descripcion: c.descripcion || '',
      empresaId: c.empresaId,
      porcentajeAprobacion: c.porcentajeAprobacion,
      intentosPermitidos: c.intentosPermitidos,
      preguntas: c.preguntas.map(p => ({
        texto: p.texto,
        tipo: p.tipo,
        orden: p.orden,
        opciones: p.opciones.map(o => ({
          texto: o.texto,
          esCorrecta: o.esCorrecta,
        })),
      })),
    }
  }
})
</script>
