<template>
  <div class="d-flex flex-column ga-3">
    <section v-for="v in VINCULABLES" :key="v.campo" class="seccion">
      <div class="titulo-de-seccion">{{ v.plural }}</div>
      <div v-if="vinculados[v.campo].length || anteriorDe(v)">
        <attachment-row v-if="anteriorDe(v)" :titulo="v.anterior.texto" :pdf="anteriorDe(v)" />
        <attachment-row v-for="d in vinculados[v.campo]" :key="d.clave" :titulo="d.numero || 'S/N'" :detalle="d.detalle"
                        :pdf="d.pdf" :accion="d.id ? 'desvincular' : 'eliminar'" @quitar="quitar(d, v)" />
      </div>
      <paginated-autocomplete v-model="buscadas[v.campo]" :fetch="buscadores[v.campo]" :mapper="v.aOpcion"
                              :cache="false" :exclude-ids="vinculados[v.campo].map(d => d.id)" :return-object="false"
                              item-title="name" item-value="id" :disabled="!clienteId"
                              :label="clienteId ? `Vincular ${v.nombre}` : 'Elige primero el cliente'"
                              :no-data-text="v.sinResultados(tipo)" prepend-inner-icon="mdi-link-variant" v-bind="CAMPO"
                              @selected="d => vincular(v, d)">
        <template #item="{ item, props: opcion }">
          <v-list-item v-bind="opcion" :title="null">
            <v-list-item-title>
              <strong>{{ item.raw.name }}</strong><template v-if="item.raw.tipo"> · {{ item.raw.tipo }}</template>
            </v-list-item-title>
            <v-list-item-subtitle>{{ item.raw.detalle }}</v-list-item-subtitle>
          </v-list-item>
        </template>
        <template v-if="clienteId" #append>
          <add-new-button icono="mdi-upload" :texto="`Subir ${v.nombre} hecha fuera`" :loading="subiendo === v.tipo"
                          @click="subirHechaFuera(v)" />
        </template>
      </paginated-autocomplete>
    </section>
    <quote-upload-dialog ref="subida" :tipo-de-documento="subiendoDe.documento"
                         @subida="d => vincular(subiendoDe, subiendoDe.aOpcion(d))" />

    <template v-if="alquiler">
      <section class="seccion">
        <div class="titulo-de-seccion">Guía de retorno</div>
        <attachment-row v-bind="retorno">
          <add-new-button icono="mdi-upload" :texto="retorno.pdf ? 'Reemplazar la guía de retorno' : 'Subir la guía de retorno'"
                          :loading="subiendo === GUIA_DE_RETORNO" @click="elegir(GUIA_DE_RETORNO)" />
        </attachment-row>
      </section>

      <section class="seccion">
        <div class="titulo-de-seccion">Órdenes de compra</div>
        <div v-if="ordenesDeCompra.length">
          <attachment-row v-for="d in ordenesDeCompra" :key="d.clave" :titulo="d.numero || 'S/N'" :detalle="d.detalle"
                          :pdf="d.pdf" accion="eliminar" @quitar="quitar(d)" />
        </div>
        <v-text-field v-model="numeroDeOc" label="N.° (opcional)" v-bind="CAMPO">
          <template #append>
            <add-new-button icono="mdi-upload" texto="Subir orden de compra" :loading="subiendo === ORDEN_DE_COMPRA"
                            @click="elegir(ORDEN_DE_COMPRA)" />
          </template>
        </v-text-field>
      </section>
    </template>

    <input ref="selector" type="file" accept="application/pdf" hidden @change="alElegirArchivo">
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue'
import AddNewButton from '@/components/commonComponents/AddNewButton.vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import AttachmentRow from '@/components/shared/AttachmentRow.vue'
import { avisarHecho } from '@/utils/documents/avisos'
import OrderDataService from '@/services/orders/orderDataService'
import { ESTADOS } from '@/utils/billing/guias'
import { fechaCorta } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { CAMPO } from '@/utils/fields'
import {
  GUIA_DE_RETORNO, ORDEN_DE_COMPRA, VINCULABLES, sinPendientes, subirArchivo, vincularDocumento,
} from '@/utils/orders/documentos'
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

// Los PDF que van en la orden misma, de uno solo cada uno.
const deLaFila = ref({})
const anteriorDe = ({ anterior }) => anterior && deLaFila.value[anterior.campo]
const guardados = ref([])
const numeroDeOc = ref('')
const selector = ref(null)
const destino = ref(null)
const subiendo = ref(null)
const buscadas = reactive(Object.fromEntries(VINCULABLES.map(v => [v.campo, null])))
const subida = ref(null)
const subiendoDe = ref(VINCULABLES[0])

const fallo = (error, titulo) => $swal.fire(titulo, mensajeDeError(error, 'Intenta de nuevo.'), 'error')

const tipo = computed(() => (props.alquiler ? 'alquiler' : 'servicio'))
const buscadores = Object.fromEntries(VINCULABLES.map(v => [v.campo, (page, size, query) =>
  v.buscar({ cliente: props.clienteId, kind: tipo.value, query, page, size })]))

const conPdf = (numero, pdf, ...detalles) =>
  ({ numero, pdf, detalle: [...detalles, !pdf && 'sin PDF'].filter(Boolean).join(' · ') })

// Uno vinculado del sistema lleva `id`; uno subido en PDF, no.
function deLaOrden (d) {
  const fila = { clave: d.id, fila: d.id }
  if (d.documento) return { ...fila, id: d.documento, ...conPdf(d.documento_data.numero, d.documento_data.pdf) }
  if (d.guia) return { ...fila, id: d.guia, ...conPdf(d.guia_data.numero, d.guia_data.pdf, ESTADOS[d.guia_data.estado].texto) }
  return { ...fila, numero: d.numero, pdf: d.pdf, detalle: fechaCorta(d.created_at) }
}

const subidasPendientes = (destino) => pendientes.value.archivos.filter(a => a.destino === destino)
  .map(a => ({ clave: a, pendiente: a, numero: a.archivo.name, pdf: a.archivo, detalle: 'se sube al guardar' }))

const vinculados = computed(() => Object.fromEntries(VINCULABLES.map(v => [v.campo, props.orden
  ? guardados.value.filter(d => d.tipo === v.tipo).map(deLaOrden)
  : [...pendientes.value[v.campo].map(d => ({ ...d, clave: `p-${d.id}`, detalle: 'se vincula al guardar' })),
     ...subidasPendientes(v.tipo)]])))

const ordenesDeCompra = computed(() => (props.orden
  ? guardados.value.filter(d => d.tipo === ORDEN_DE_COMPRA).map(deLaOrden)
  : subidasPendientes(ORDEN_DE_COMPRA).map(d => ({ ...d, numero: d.pendiente.numero }))))

const retorno = computed(() => {
  const [pendiente] = subidasPendientes(GUIA_DE_RETORNO)
  if (pendiente) return { titulo: pendiente.numero, detalle: pendiente.detalle, pdf: pendiente.pdf }
  const pdf = deLaFila.value[GUIA_DE_RETORNO]
  return { titulo: pdf ? 'Guía de retorno' : '', detalle: pdf ? '' : 'Sin PDF', pdf }
})

async function cargar() {
  const [{ data: fila }, { data: lista }] = await Promise.all([
    OrderDataService.getFila(props.orden.id), OrderDataService.listDocuments(props.orden.id),
  ])
  deLaFila.value = fila
  guardados.value = lista
}

watch(() => props.orden?.id, (id) => {
  if (id) cargar().catch(e => fallo(e, 'No se cargaron los documentos'))
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
    fallo(error, `No se vinculó la ${vinculable.nombre}`)
  }
}

// Al crear la orden se saca de los pendientes; guardado, se pregunta. `vinculable`: su seccion, si es de una.
function quitar(d, vinculable = null) {
  if (d.pendiente) {
    pendientes.value.archivos = pendientes.value.archivos.filter(a => a !== d.pendiente)
  } else if (!props.orden) {
    pendientes.value[vinculable.campo] = pendientes.value[vinculable.campo].filter(p => p.id !== d.id)
  } else {
    quitarGuardado(d, vinculable)
  }
}

async function quitarGuardado(d, vinculable) {
  const [verbo, pasa] = d.id ? ['desvincular', `La ${vinculable.nombre} no se borra.`] : ['eliminar', 'Se borra el PDF.']
  const { isConfirmed } = await $swal.fire({
    title: `¿${verbo[0].toUpperCase()}${verbo.slice(1)} ${d.numero || 'el documento'}?`, text: pasa,
    icon: 'warning', showCancelButton: true, confirmButtonText: `Sí, ${verbo}`, cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return
  try {
    await OrderDataService.deleteDocument(d.fila)
    await cargar()
  } catch (error) {
    fallo(error, `No se pudo ${verbo}`)
  }
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
  // Los de OrderDocument van varios; la guia de retorno, una sola.
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
    const { data } = await subirArchivo(props.orden.id, pendiente)
    await cargar()
    avisarHecho('Documento subido', data)
  } catch (error) {
    fallo(error, 'No se subió el documento')
  } finally {
    subiendo.value = null
  }
}
</script>
