<template>
  <div class="d-flex flex-column ga-3">
    <div>
      <div class="text-caption font-weight-bold text-medium-emphasis mb-1">
        Cotizaciones ({{ cotizaciones.length }})
      </div>
      <div v-for="c in cotizaciones" :key="c.clave" class="d-flex align-center ga-1">
        <span class="text-body-2 flex-grow-1">
          {{ c.numero }}
          <span v-if="c.pendiente" class="text-caption text-medium-emphasis">· se vincula al guardar</span>
        </span>
        <v-btn v-if="c.pdf" icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
               @click="abrirEnOtraPestana(c.pdf)" />
        <v-btn icon="mdi-link-off" size="small" variant="text" color="error" title="Quitar" @click="desvincular(c)" />
      </div>
      <paginated-autocomplete v-model="buscada" :fetch="fetchCotizaciones" :mapper="aCotizacion"
                              :exclude-ids="cotizaciones.map(c => c.id)" :return-object="false" item-title="name"
                              item-value="id" :disabled="!clienteId" label="Vincular cotización del cliente"
                              prepend-inner-icon="mdi-link-variant" density="compact" variant="outlined" rounded="lg"
                              hide-details class="mt-1" @selected="vincular">
        <template #item="{ item, props: opcion }">
          <v-list-item v-bind="opcion" :title="null">
            <v-list-item-title>
              <strong>{{ item.raw.name }}</strong><template v-if="item.raw.tipo"> · {{ item.raw.tipo }}</template>
            </v-list-item-title>
            <v-list-item-subtitle>{{ item.raw.detalle }}</v-list-item-subtitle>
          </v-list-item>
        </template>
        <template v-if="clienteId" #append>
          <add-new-button texto="Subir cotización hecha fuera" @click="subirCotizacion" />
        </template>
      </paginated-autocomplete>
      <quote-upload-dialog ref="subida" @subida="d => vincular(aCotizacion(d))" />
    </div>

    <div v-if="alquiler">
      <div v-if="unicos.quote_pdf" class="d-flex align-center ga-1 py-1">
        <span class="text-body-2 flex-grow-1">Cotización en PDF (anterior)</span>
        <v-btn icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
               @click="abrirEnOtraPestana(unicos.quote_pdf)" />
      </div>
      <div v-for="g in GUIAS" :key="g.campo" class="d-flex align-center ga-1 py-1">
        <span class="text-body-2 flex-grow-1"
              :class="{ 'text-medium-emphasis': !unicos[g.campo] && !pendienteDe(g.campo) }">
          {{ g.texto }}<span v-if="pendienteDe(g.campo)" class="text-caption text-medium-emphasis">
            · {{ pendienteDe(g.campo).archivo.name }}</span>
        </span>
        <v-btn v-if="unicos[g.campo]" icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
               @click="abrirEnOtraPestana(unicos[g.campo])" />
        <v-btn :icon="unicos[g.campo] || pendienteDe(g.campo) ? 'mdi-file-replace-outline' : 'mdi-upload'"
               size="small" variant="text" :title="unicos[g.campo] ? 'Reemplazar' : 'Subir'"
               :loading="subiendo === g.campo" @click="elegir(g.campo)" />
      </div>
    </div>

    <div v-for="s in secciones" :key="s.tipo">
      <div class="text-caption font-weight-bold text-medium-emphasis mb-1">
        {{ s.texto }} ({{ archivosDe(s.tipo).length }})
      </div>
      <div v-for="d in archivosDe(s.tipo)" :key="d.clave" class="d-flex align-center ga-1">
        <span class="text-body-2 flex-grow-1">{{ d.numero || 'S/N' }}
          <span class="text-caption text-medium-emphasis">· {{ d.detalle }}</span></span>
        <v-btn v-if="d.pdf" icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
               @click="abrirEnOtraPestana(d.pdf)" />
        <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" title="Quitar" @click="borrar(d)" />
      </div>
      <div class="d-flex align-center ga-1 mt-1">
        <v-text-field v-model="numeros[s.tipo]" label="N.° (opcional)" density="compact" variant="outlined"
                      rounded="lg" hide-details />
        <v-btn icon="mdi-upload" size="small" variant="text" title="Subir PDF" :loading="subiendo === s.tipo"
               @click="elegir(s.tipo)" />
      </div>
    </div>

    <input ref="selector" type="file" accept="application/pdf" hidden @change="alElegirArchivo">
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue'
import AddNewButton from '@/components/commonComponents/AddNewButton.vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import { Toast } from '@/plugins/alerts'
import DocumentsDataService from '@/services/documents/documentsDataService'
import OrderDataService from '@/services/orders/orderDataService'
import { useAppStore } from '@/stores/appStore'
import { fechaCorta } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import {
  COTIZACION, GUIAS, ORDEN_DE_COMPRA, VALORIZACION, subirArchivo, vincularCotizacion,
} from '@/utils/orders/documentos'
import { TIPOS_DE_COTIZACION } from '@/utils/documents/quoteDefaults'
import { monto } from '@/utils/money'
import { abrirEnOtraPestana } from '@/utils/pdf'
import QuoteUploadDialog from '@/views/documents/components/templates/QuoteUploadDialog.vue'

// Los documentos de una orden. Guardada, se suben y se quitan al momento; al crearla, quedan en `pendientes`
// ({ cotizaciones, archivos }) y los guarda la orden.
const props = defineProps({
  orden: { type: Object, default: null },
  alquiler: { type: Boolean, default: false },
  clienteId: { type: Number, default: null },
})
const pendientes = defineModel('pendientes', { type: Object, default: () => ({ cotizaciones: [], archivos: [] }) })

const secciones = computed(() => [
  ...(props.alquiler ? [{ tipo: ORDEN_DE_COMPRA, texto: 'Órdenes de compra' }] : []),
  { tipo: VALORIZACION, texto: 'Valorizaciones' },
])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const appStore = useAppStore()

const unicos = reactive({})
const guardados = ref([])
const numeros = reactive({ [ORDEN_DE_COMPRA]: '', [VALORIZACION]: '' })
const selector = ref(null)
const destino = ref(null)
const subiendo = ref(null)
const buscada = ref(null)
const subida = ref(null)

const fallo = (error, texto) => Toast.fire({ ...appStore.toastErrorRed, title: mensajeDeError(error, texto) })

const fetchCotizaciones = (page, size, query) => DocumentsDataService.getAll({
  document_type: 'COT', status: 'EMITIDO', client: props.clienteId, document_number: query || undefined,
  page, itemsPerPage: size,
})
const aCotizacion = (d) => ({
  id: d.id, name: d.document_number, pdf: d.pdf_file, tipo: TIPOS_DE_COTIZACION[d.kind]?.texto,
  detalle: `${fechaCorta(d.issue_date)} · ${monto(d.total_amount, d.currency)}`,
})

const subirCotizacion = () => subida.value.open({
  cliente: props.clienteId, tipoInicial: props.alquiler ? 'alquiler' : 'servicio',
})

const cotizaciones = computed(() => (props.orden
  ? guardados.value.filter(d => d.tipo === COTIZACION)
    .map(d => ({ clave: d.id, fila: d.id, id: d.documento, numero: d.documento_data.numero,
                 pdf: d.documento_data.pdf }))
  : pendientes.value.cotizaciones.map(c => ({ ...c, clave: `p-${c.id}`, pendiente: true }))))

function archivosDe(tipo) {
  if (props.orden) {
    return guardados.value.filter(d => d.tipo === tipo)
      .map(d => ({ clave: d.id, fila: d.id, numero: d.numero, pdf: d.pdf, detalle: fechaCorta(d.created_at) }))
  }
  return pendientes.value.archivos.filter(a => a.destino === tipo)
    .map(a => ({ clave: a, pendiente: a, numero: a.numero, detalle: 'se sube al guardar' }))
}

const pendienteDe = (campo) => pendientes.value.archivos.find(a => a.destino === campo)

async function cargar() {
  const [{ data: fila }, { data: lista }] = await Promise.all([
    OrderDataService.getFila(props.orden.id), OrderDataService.listDocuments(props.orden.id),
  ])
  unicos.quote_pdf = fila.quote_pdf
  GUIAS.forEach(g => { unicos[g.campo] = fila[g.campo] })
  guardados.value = lista
}

watch(() => props.orden?.id, (id) => {
  if (id) cargar().catch(e => fallo(e, 'No se pudieron traer los documentos.'))
}, { immediate: true })

async function vincular(cotizacion) {
  if (!cotizacion) return
  nextTick(() => { buscada.value = null })
  if (!props.orden) {
    pendientes.value.cotizaciones.push({ id: cotizacion.id, numero: cotizacion.name, pdf: cotizacion.pdf })
    return
  }
  try {
    await vincularCotizacion(props.orden.id, cotizacion.id)
    await cargar()
  } catch (error) {
    fallo(error, 'No se pudo vincular la cotización.')
  }
}

async function confirmar(texto) {
  const { isConfirmed } = await $swal.fire({ title: texto, icon: 'warning', showCancelButton: true,
                                             confirmButtonText: 'Sí, quitar', cancelButtonText: 'Cancelar' })
  return isConfirmed
}

async function quitarGuardado(fila, texto) {
  if (!(await confirmar(texto))) return
  try {
    await OrderDataService.deleteDocument(fila)
    await cargar()
  } catch (error) {
    fallo(error, 'No se pudo quitar.')
  }
}

function desvincular(c) {
  if (c.pendiente) {
    pendientes.value.cotizaciones = pendientes.value.cotizaciones.filter(p => p.id !== c.id)
    return
  }
  quitarGuardado(c.fila, `¿Quitar ${c.numero} de la orden?`)
}

function borrar(d) {
  if (d.pendiente) {
    pendientes.value.archivos = pendientes.value.archivos.filter(a => a !== d.pendiente)
    return
  }
  quitarGuardado(d.fila, d.numero ? `¿Quitar el documento ${d.numero}?` : '¿Quitar el documento?')
}

function elegir(campoOTipo) {
  destino.value = campoOTipo
  selector.value.value = ''
  selector.value.click()
}

async function alElegirArchivo(evento) {
  const archivo = evento.target.files?.[0]
  if (!archivo) return
  const pendiente = { destino: destino.value, numero: numeros[destino.value] || '', archivo }
  if (typeof destino.value === 'number') numeros[destino.value] = ''
  if (!props.orden) {
    pendientes.value.archivos = [...pendientes.value.archivos.filter(a => a.destino !== pendiente.destino
      || typeof a.destino === 'number'), pendiente]
    return
  }
  subiendo.value = destino.value
  try {
    await subirArchivo(props.orden.id, pendiente)
    await cargar()
    Toast.fire({ timer: 2000, icon: 'success', title: 'Documento subido' })
  } catch (error) {
    fallo(error, 'No se pudo subir el documento.')
  } finally {
    subiendo.value = null
  }
}
</script>
