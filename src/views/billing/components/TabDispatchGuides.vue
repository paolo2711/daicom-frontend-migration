<template>
  <div>
    <filter-bar>
      <v-text-field v-model="filtros.q" hide-details density="compact" prepend-inner-icon="mdi-magnify"
                    variant="outlined" label="Buscar N.° de guía" clearable />
      <template #pildoras>
        <filter-pill :active="filtros.sunat" color="warning" icon="mdi-alert-outline"
                     tooltip="No enviadas, sin respuesta de SUNAT, por revisar o con la baja en SOL pendiente"
                     @click="filtros.sunat = !filtros.sunat">Pendiente en SUNAT</filter-pill>
      </template>
      <template #avanzados>
        <v-col cols="12" md="4">
          <date-range-filter v-model:desde="rango.desde" v-model:hasta="rango.hasta" label="Fecha de emisión"
                             clearable @apply="aplicarRango" @clear="limpiarRango" />
        </v-col>
        <v-col cols="12" md="4">
          <client-select v-model="filtros.cliente" />
        </v-col>
        <v-col cols="12" md="4">
          <v-select v-model="filtros.estado" :items="FILTRO_DE_ESTADO" item-title="name" item-value="id"
                    prepend-inner-icon="mdi-list-status" label="Estado" clearable
                    density="compact" variant="outlined" hide-details />
        </v-col>
      </template>
    </filter-bar>

    <pdf-split-view v-model="vista" :items="guias" :pdf-de="g => g.pdf" :titulo-de="tituloDe" clave="guias">
      <table-loading-overlay :loading="cargando" :isEmpty="guias.length === 0">
        <v-data-table-server :headers="columnas" :items="guias" :items-length="total" :loading="cargando"
                             item-value="id" class="elevation-0 rounded-lg tabla-mejorada bg-surface"
                             v-model:page="opciones.page" v-model:items-per-page="opciones.itemsPerPage"
                             hide-default-footer
                             @click:row="(_, { item }) => abrir(item)"
                             @contextmenu:row="alClickDerecho"
                             :row-props="({ item }) => ({ class: {
                               'fila-en-menu': estaEnElMenu(item), 'fila-con-pdf': true,
                               'fila-en-vista': item.id === vista,
                             } })">
          <template #bottom>
            <fluent-pagination v-model:page="opciones.page" v-model:itemsPerPage="opciones.itemsPerPage"
                               :totalItems="total" />
          </template>
          <!-- El color de la pildora es el estado; la leyenda va debajo de la tabla. -->
          <template #item.numero="{ item }">
            <v-chip :color="ESTADOS[item.estado].color" class="text-white font-weight-bold">{{ item.numero }}</v-chip>
            <div v-if="bajaPendienteEnSol(item)" class="text-caption text-error">Baja pendiente en SOL</div>
          </template>
          <template #item.fecha_emision="{ item }">{{ fechaCorta(item.fecha_emision) }}</template>
          <template #item.cliente="{ item }">{{ item.cliente_data.name }}</template>
          <template #item.acciones="{ item }">
            <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                   @click.stop="alBotonDeFila($event, item)" />
          </template>
        </v-data-table-server>
      </table-loading-overlay>
    </pdf-split-view>

    <state-legend titulo="Estados de la guía:" :estados="ESTADOS" />

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />
    <dialog-dispatch-guide ref="formulario" @emitida="alEmitir" />
    <dialog-cancel-dispatch-guide v-model="porAnular" @anulada="reemplazar" />
    <panel-info-dispatch-guide v-model="abierta" :corregible="corregible" :acciones="abierta ? accionesDe([abierta]) : []"
                               @corregir="corregir" @accion="clave => ejecutarAccion(clave, [abierta])"
                               @cambiada="reemplazar" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import ClientSelect from '@/components/shared/ClientSelect.vue'
import DateRangeFilter from '@/components/shared/DateRangeFilter.vue'
import FilterBar from '@/components/shared/FilterBar.vue'
import FilterPill from '@/components/shared/FilterPill.vue'
import PdfSplitView from '@/components/shared/PdfSplitView.vue'
import StateLegend from '@/components/shared/StateLegend.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { useDateRangeFilter } from '@/composables/useDateRangeFilter'
import { useDownload } from '@/composables/useDownload'
import { useEmissionPanel } from '@/composables/useEmissionPanel'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePage } from '@/composables/usePage'
import { useRouteFilters } from '@/composables/useRouteFilters'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { accionesPara } from '@/utils/actions'
import { debounce } from '@/utils/debounce'
import { fechaCorta } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { ACCIONES_GUIA } from '@/utils/billing/acciones'
import { preguntarGuia, registrarBajaEnSol, reintentarEnvio } from '@/utils/billing/pendientes'
import { ESTADOS, FILTRO_DE_ESTADO, bajaPendienteEnSol } from '@/utils/billing/guias'
import { leerPagina, porPagina } from '@/utils/pagination'
import { abrirEnOtraPestana } from '@/utils/pdf'
import DialogCancelDispatchGuide from './DialogCancelDispatchGuide.vue'
import DialogDispatchGuide from './DialogDispatchGuide.vue'
import PanelInfoDispatchGuide from './PanelInfoDispatchGuide.vue'

const swal = useSwal()
const route = useRoute()
const router = useRouter()

const EN_LA_LISTA_ANGOSTA = ['numero', 'fecha_emision', 'cliente']
const columnas = computed(() => [
  { title: 'Guía', key: 'numero', sortable: false },
  { title: 'Fecha', key: 'fecha_emision', sortable: false },
  { title: 'Destinatario', key: 'cliente', sortable: false },
  { title: 'Opciones', key: 'acciones', align: 'center', sortable: false },
].filter(c => vista.value === null || EN_LA_LISTA_ANGOSTA.includes(c.key)))

const guias = ref([])
const total = ref(0)
const cargando = ref(false)
const { opciones, alInicio } = usePage(() => recargar())
const filtros = ref({ q: '', sunat: false, cliente: null, desde: '', hasta: '', estado: null })
useRouteFilters(({ sunat }) => { filtros.value.sunat = Boolean(sunat) })
const { rango, aplicarRango, limpiarRango } = useDateRangeFilter(filtros)
const vista = ref(null)
const formulario = ref(null)
const tituloDe = (guia) => `${guia.numero} · ${guia.cliente_data.name}`

const { begin, isLatest } = useLatestRequest()

async function recargar () {
  cargando.value = true
  const turno = begin()
  const conValor = Object.fromEntries(Object.entries(filtros.value).filter(([, v]) => v))
  try {
    const { page, itemsPerPage } = opciones.value
    const { data } = await BillingDataService.listDispatchGuides({ ...conValor, ...porPagina(page, itemsPerPage) })
    if (!isLatest(turno)) return
    const pagina = leerPagina(data)
    guias.value = pagina.filas
    total.value = pagina.total
  } catch {
    if (!isLatest(turno)) return
    guias.value = []
    total.value = 0
  } finally {
    if (isLatest(turno)) cargando.value = false
  }
}

// La que se mira en su panel: la de Ver informacion o la recien emitida.
const { abierta, corregible, alEmitir, corregir } = useEmissionPanel(formulario, recargar, guias)

// Lo que vuelve reemplaza su fila y la del panel, que puede no estar en la pagina.
function reemplazar (guia) {
  const posicion = guias.value.findIndex(g => g.id === guia.id)
  if (posicion !== -1) guias.value.splice(posicion, 1, guia)
  if (abierta.value?.id === guia.id) abierta.value = guia
}

// Abrir una guia en espera le pregunta de nuevo a SUNAT (el back lo hace al leerla).
async function abrirFormulario (ordenIds = [], plantilla = null) {
  try {
    const { data: nueva } = await BillingDataService.newDispatchGuide(ordenIds)
    const { data: base } = plantilla ? await BillingDataService.getDispatchGuide(plantilla.id) : { data: null }
    formulario.value?.open(nueva, base)
  } catch (error) {
    swal.fire({ icon: 'error', title: 'No se abrió la guía',
                text: mensajeDeError(error, 'No se pudieron leer los datos.') })
  }
}

const porAnular = ref(null)

// Con PDF se ve al costado; sin PDF (rechazada, en espera) se abre lo que le pasa.
function abrir (guia) {
  if (guia.pdf) vista.value = guia.id
  else abierta.value = guia
}

async function resolver (accion, guia) {
  const resuelta = await accion(guia.id, guia.numero)
  if (resuelta) reemplazar(resuelta)
}


const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(guias)
const { descargar } = useDownload()
const accionesDe = (filas) => accionesPara(ACCIONES_GUIA, filas, () => true)
function ejecutarAccion (clave, [guia]) {
  switch (clave) {
    case 'pdf': return abrirEnOtraPestana(guia.pdf)
    case 'descargar': return descargar(guia.pdf, guia.nombre_pdf, 'el PDF')
    case 'xml': return abrirEnOtraPestana(guia.xml)
    case 'cdr': return abrirEnOtraPestana(guia.cdr)
    case 'consultar': return resolver(preguntarGuia, guia)
    case 'plantilla': return abrirFormulario([], guia)
    case 'anular':
      porAnular.value = guia
      break
    case 'baja-en-sol': return resolver(registrarBajaEnSol, guia)
    case 'reintentar': return resolver(reintentarEnvio, guia)
    case 'info':
      abierta.value = guia
      break
  }
}

watch(filtros, debounce(alInicio), { deep: true })

// Desde Órdenes llega con ?ordenes=1,2: el formulario se abre lleno con sus equipos.
onMounted(() => {
  // Despues de la lista: las que no llegaron van en segundo plano y la lista se refresca sola al guardarse.
  recargar()
  window.addEventListener('wss-reload-dispatch-guides', recargar)
  const ids = String(route.query.ordenes || '').split(',').filter(Boolean)
  if (!ids.length) return
  router.replace({ query: {} })
  abrirFormulario(ids)
})
onUnmounted(() => window.removeEventListener('wss-reload-dispatch-guides', recargar))

defineExpose({ nuevo: () => abrirFormulario() })
</script>
