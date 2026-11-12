<template>
  <div class="d-flex flex-column ga-3">
    <div v-for="v in VINCULABLES" :key="v.campo">
      <div class="text-caption font-weight-bold text-medium-emphasis mb-1">
        {{ v.plural }} ({{ vinculados[v.campo].length }})
      </div>
      <div v-for="d in vinculados[v.campo]" :key="d.clave" class="d-flex align-center ga-1">
        <span class="text-body-2 flex-grow-1">
          {{ d.numero || 'S/N' }}
          <span v-if="d.detalle" class="text-caption text-medium-emphasis">· {{ d.detalle }}</span>
        </span>
        <v-btn v-if="d.pdf" icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
               @click="abrirEnOtraPestana(d.pdf)" />
        <v-btn :icon="d.id ? 'mdi-link-off' : 'mdi-delete-outline'" size="small" variant="text" color="error"
               title="Quitar" @click="desvincular(v, d)" />
      </div>
      <paginated-autocomplete v-model="buscadas[v.campo]" :fetch="buscadores[v.campo]" :mapper="v.aOpcion"
                              :exclude-ids="vinculados[v.campo].map(d => d.id)" :return-object="false"
                              item-title="name" item-value="id" :disabled="!clienteId"
                              :label="`Vincular ${v.nombre} del cliente`" :no-data-text="v.sinResultados(tipo)"
                              prepend-inner-icon="mdi-link-variant" density="compact" variant="outlined" rounded="lg"
                              hide-details class="mt-1" @selected="d => vincular(v, d)">
        <template #item="{ item, props: opcion }">
          <v-list-item v-bind="opcion" :title="null">
            <v-list-item-title>
              <strong>{{ item.raw.name }}</strong><template v-if="item.raw.tipo"> · {{ item.raw.tipo }}</template>
            </v-list-item-title>
            <v-list-item-subtitle>{{ item.raw.detalle }}</v-list-item-subtitle>
          </v-list-item>
        </template>
        <template v-if="clienteId" #append>
          <add-new-button :texto="`Subir ${v.nombre} hecha fuera`" @click="subirHechaFuera(v)" />
        </template>
      </paginated-autocomplete>
    </div>
    <quote-upload-dialog ref="subida" :tipo-de-documento="subiendoDe.documento"
                         @subida="d => vincular(subiendoDe, subiendoDe.aOpcion(d))" />

    <div v-if="alquiler">
      <div v-if="unicos.quote_pdf" class="d-flex align-center ga-1 py-1">
        <span class="text-body-2 flex-grow-1">Cotización en PDF (anterior)</span>
        <v-btn icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
               @click="abrirEnOtraPestana(unicos.quote_pdf)" />
      </div>
      <div v-for="g in GUIAS.filter(g => !g.anterior || unicos[g.campo])" :key="g.campo"
           class="d-flex align-center ga-1 py-1">
        <span class="text-body-2 flex-grow-1"
              :class="{ 'text-medium-emphasis': !unicos[g.campo] && !pendienteDe(g.campo) }">
          {{ g.texto }}<span v-if="pendienteDe(g.campo)" class="text-caption text-medium-emphasis">
            · {{ pendienteDe(g.campo).archivo.name }}</span>
        </span>
        <v-btn v-if="unicos[g.campo]" icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
               @click="abrirEnOtraPestana(unicos[g.campo])" />
        <v-btn v-if="!g.anterior" :icon="unicos[g.campo] || pendienteDe(g.campo) ? 'mdi-file-replace-outline' : 'mdi-upload'"
               size="small" variant="text" :title="unicos[g.campo] ? 'Reemplazar' : 'Subir'"
               :loading="subiendo === g.campo" @click="elegir(g.campo)" />
      </div>

      <div class="text-caption font-weight-bold text-medium-emphasis mt-2 mb-1">
        Órdenes de compra ({{ ordenesDeCompra.length }})
      </div>
      <div v-for="d in ordenesDeCompra" :key="d.clave" class="d-flex align-center ga-1">
        <span class="text-body-2 flex-grow-1">{{ d.numero || 'S/N' }}
          <span class="text-caption text-medium-emphasis">· {{ d.detalle }}</span></span>
        <v-btn v-if="d.pdf" icon="mdi-file-pdf-box" size="small" variant="text" title="Abrir"
               @click="abrirEnOtraPestana(d.pdf)" />
        <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" title="Quitar" @click="borrar(d)" />
      </div>
      <div class="d-flex align-center ga-1 mt-1">
        <v-text-field v-model="numeroDeOc" label="N.° (opcional)" density="compact" variant="outlined"
                      rounded="lg" hide-details />
        <v-btn icon="mdi-upload" size="small" variant="text" title="Subir PDF"
               :loading="subiendo === ORDEN_DE_COMPRA" @click="elegir(ORDEN_DE_COMPRA)" />
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
import OrderDataService from '@/services/orders/orderDataService'
import { useAppStore } from '@/stores/appStore'
import { ESTADOS } from '@/utils/billing/guias'
import { fechaCorta } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import {
  GUIAS, ORDEN_DE_COMPRA, VINCULABLES, sinPendientes, subirArchivo, vincularDocumento,
} from '@/utils/orders/documentos'
import { abrirEnOtraPestana } from '@/utils/pdf'
import QuoteUploadDialog from '@/views/documents/components/templates/QuoteUploadDialog.vue'

// Los documentos de una orden. Guardada, se suben, se vinculan y se quitan al momento; al crearla, quedan en
// `pendientes` (sinPendientes) y los guarda la orden.
const props = defineProps({
  orden: { type: Object, default: null },
  alquiler: { type: Boolean, default: false },
  clienteId: { type: Number, default: null },
})
const pendientes = defineModel('pendientes', { type: Object, default: sinPendientes })

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const appStore = useAppStore()

const unicos = reactive({})
const guardados = ref([])
const numeroDeOc = ref('')
const selector = ref(null)
const destino = ref(null)
const subiendo = ref(null)
const buscadas = reactive(Object.fromEntries(VINCULABLES.map(v => [v.campo, null])))
const subida = ref(null)
const subiendoDe = ref(VINCULABLES[0])

const fallo = (error, texto) => Toast.fire({ ...appStore.toastErrorRed, title: mensajeDeError(error, texto) })

const tipo = computed(() => (props.alquiler ? 'alquiler' : 'servicio'))
const buscadores = Object.fromEntries(VINCULABLES.map(v => [v.campo, (page, size, query) =>
  v.buscar({ cliente: props.clienteId, kind: tipo.value, query, page, size })]))

// Uno vinculado del sistema lleva `id`; uno subido en PDF, no.
function deLaOrden (d) {
  const fila = { clave: d.id, fila: d.id }
  if (d.documento) return { ...fila, id: d.documento, numero: d.documento_data.numero, pdf: d.documento_data.pdf }
  if (d.guia) {
    return { ...fila, id: d.guia, numero: d.guia_data.numero, pdf: d.guia_data.pdf,
             detalle: ESTADOS[d.guia_data.estado].texto }
  }
  return { ...fila, numero: d.numero, pdf: d.pdf, detalle: fechaCorta(d.created_at) }
}

const subidasPendientes = (destino) => pendientes.value.archivos.filter(a => a.destino === destino)
  .map(a => ({ clave: a, pendiente: a, numero: a.archivo.name, detalle: 'se sube al guardar' }))

const vinculados = computed(() => Object.fromEntries(VINCULABLES.map(v => [v.campo, props.orden
  ? guardados.value.filter(d => d.tipo === v.tipo).map(deLaOrden)
  : [...pendientes.value[v.campo].map(d => ({ ...d, clave: `p-${d.id}`, detalle: 'se vincula al guardar' })),
     ...subidasPendientes(v.tipo)]])))

const ordenesDeCompra = computed(() => (props.orden
  ? guardados.value.filter(d => d.tipo === ORDEN_DE_COMPRA).map(deLaOrden)
  : subidasPendientes(ORDEN_DE_COMPRA).map(d => ({ ...d, numero: d.pendiente.numero }))))

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

async function subirHechaFuera(vinculable) {
  if (vinculable.enPdf) return elegir(vinculable.tipo)
  subiendoDe.value = vinculable
  await nextTick()
  subida.value.open({ cliente: props.clienteId, tipoInicial: props.alquiler ? 'alquiler' : 'servicio' })
}

async function vincular(vinculable, documento) {
  if (!documento) return
  nextTick(() => { buscadas[vinculable.campo] = null })
  if (!props.orden) {
    pendientes.value[vinculable.campo].push({ id: documento.id, numero: documento.name, pdf: documento.pdf })
    return
  }
  try {
    await vincularDocumento(props.orden.id, vinculable, documento.id)
    await cargar()
  } catch (error) {
    fallo(error, `No se pudo vincular la ${vinculable.nombre}.`)
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

const preguntaAlQuitar = (d) => {
  if (d.id) return `¿Quitar ${d.numero} de la orden?`
  return d.numero ? `¿Quitar el documento ${d.numero}?` : '¿Quitar el documento?'
}

function desvincular(vinculable, d) {
  if (d.pendiente) return borrar(d)
  if (!props.orden) {
    pendientes.value[vinculable.campo] = pendientes.value[vinculable.campo].filter(p => p.id !== d.id)
    return
  }
  quitarGuardado(d.fila, preguntaAlQuitar(d))
}

function borrar(d) {
  if (d.pendiente) {
    pendientes.value.archivos = pendientes.value.archivos.filter(a => a !== d.pendiente)
    return
  }
  quitarGuardado(d.fila, preguntaAlQuitar(d))
}

function elegir(campoOTipo) {
  destino.value = campoOTipo
  selector.value.value = ''
  selector.value.click()
}

async function alElegirArchivo(evento) {
  const archivo = evento.target.files?.[0]
  if (!archivo) return
  const esOc = destino.value === ORDEN_DE_COMPRA
  // Los de OrderDocument van varios; un campo de GUIAS, uno solo.
  const varios = typeof destino.value === 'number'
  const pendiente = { destino: destino.value, numero: esOc ? numeroDeOc.value : '', archivo }
  if (esOc) numeroDeOc.value = ''
  if (!props.orden) {
    pendientes.value.archivos = [...pendientes.value.archivos.filter(a => a.destino !== pendiente.destino || varios),
      pendiente]
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
