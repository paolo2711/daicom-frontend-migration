<template>
  <div>
    <filter-bar>
      <v-text-field v-model="filtros.document_number" hide-details density="compact" prepend-inner-icon="mdi-magnify"
                    variant="outlined" label="Buscar N.° de documento" clearable />
      <v-select v-if="variantes.length" v-model="filtros.kind" :items="variantes" prepend-inner-icon="mdi-shape-outline"
                label="Tipo" clearable density="compact" variant="outlined" hide-details />

      <template #avanzados>
        <v-col cols="12" sm="6" md="3">
          <date-range-filter v-model:desde="fechas.desde" v-model:hasta="fechas.hasta" label="Rango de fechas" clearable
                             @apply="aplicarFechas" @clear="limpiarFechas" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <client-select v-model="filtros.client" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select v-model="filtros.status" :items="FILTRO_DE_ESTADO" item-title="name" item-value="id"
                    prepend-inner-icon="mdi-list-status" label="Estado" clearable
                    density="compact" variant="outlined" hide-details="auto" />
        </v-col>
        <v-col v-if="conTotal" cols="12" sm="6" md="3">
          <v-select v-model="filtros.currency" :items="MONEDAS" prepend-inner-icon="mdi-cash" label="Moneda" clearable
                    density="compact" variant="outlined" hide-details="auto" />
        </v-col>
      </template>
    </filter-bar>

    <pdf-split-view v-model="vista" :items="documentos" :pdf-de="d => d.pdf_file" :titulo-de="tituloDe" clave="documentos">
    <table-loading-overlay :loading="cargando" :isEmpty="documentos.length === 0">
      <v-data-table-server
        :headers="columnas"
        :items="documentos"
        :items-length="total"
        :loading="cargando"
        item-value="id"
        class="elevation-0 rounded-lg tabla-mejorada bg-surface"
        v-model:page="opciones.page"
        v-model:items-per-page="opciones.itemsPerPage"
        hide-default-footer
        @click:row="(_, { item }) => { if (item.pdf_file) vista = item.id }"
        @contextmenu:row="alClickDerecho"
        :row-props="({ item }) => ({ class: {
          'fila-en-menu': estaEnElMenu(item), 'fila-con-pdf': item.pdf_file, 'fila-en-vista': item.id === vista,
        } })"
      >
        <template #bottom>
          <fluent-pagination v-model:page="opciones.page" v-model:itemsPerPage="opciones.itemsPerPage" :totalItems="total" />
        </template>

        <!-- El color de la pildora es el estado; la leyenda va debajo de la tabla. -->
        <template #item.document_number="{ item }">
          <v-chip :color="ESTADOS[item.status]?.color" class="text-white font-weight-bold">
            {{ item.document_number }}
          </v-chip>
        </template>

        <template #item.issue_date="{ item }">
          <span :class="{ 'anulado-atenuado': !vivo(item) }">{{ fechaCorta(item.issue_date || item.created_at) }}</span>
        </template>

        <template #item.kind="{ item }">
          <span :class="{ 'anulado-atenuado': !vivo(item) }">{{ siglaDeVariante(item.kind) }}</span>
        </template>

        <template #item.client_name="{ item }">
          <span :class="{ 'anulado-atenuado': !vivo(item) }">{{ item.client_name || '—' }}</span>
        </template>

        <template #item.total_amount="{ item }">
          <span class="text-no-wrap" :class="{ 'anulado-atenuado': !vivo(item) }">{{ montoDe(item) }}</span>
        </template>

        <template #item.acciones="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 @click.stop="alBotonDeFila($event, item)" />
        </template>
      </v-data-table-server>
    </table-loading-overlay>
    </pdf-split-view>

    <state-legend titulo="Estados del documento:" :estados="ESTADOS" />

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import DocumentsDataService from '@/services/documents/documentsDataService'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import ClientSelect from '@/components/shared/ClientSelect.vue'
import DateRangeFilter from '@/components/shared/DateRangeFilter.vue'
import FilterBar from '@/components/shared/FilterBar.vue'
import StateLegend from '@/components/shared/StateLegend.vue'
import PdfSplitView from '@/components/shared/PdfSplitView.vue'
import { useDocumentActions } from '@/composables/useDocumentActions'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { debounce } from '@/utils/debounce'
import { fechaCorta } from '@/utils/dates'
import { ESTADOS, FILTRO_DE_ESTADO, vivo } from '@/utils/documents/estado'
import { MONEDAS, monto } from '@/utils/money'

// La lista de un tipo de documento. Columnas y filtros leen campos del
// documento, no su JSON: sirven igual para cualquier pestaña.
const props = defineProps({
  tipo: { type: String, required: true },
  conTotal: { type: Boolean, default: false },
  // Las variantes del tipo ([{ value, title, sigla }]): con ellas sale la
  // columna "Tipo" (en sigla) y su filtro a la vista.
  variantes: { type: Array, default: () => [] },
})

const emit = defineEmits(['editar'])

// Con un PDF a la vista, la tabla se angosta: quedan numero, fecha, cliente y total.
const EN_LA_LISTA_ANGOSTA = ['document_number', 'issue_date', 'client_name', 'total_amount']
const columnas = computed(() => [
  { title: 'Documento', key: 'document_number', sortable: false },
  ...(props.variantes.length ? [{ title: 'Tipo', key: 'kind', sortable: false }] : []),
  { title: 'Fecha', key: 'issue_date', sortable: false },
  { title: 'Cliente', key: 'client_name', sortable: false },
  ...(props.conTotal ? [{ title: 'Total', key: 'total_amount', align: 'end', sortable: false }] : []),
  { title: 'Opciones', key: 'acciones', align: 'center', sortable: false },
].filter(c => vista.value === null || EN_LA_LISTA_ANGOSTA.includes(c.key)))

const documentos = ref([])
const total = ref(0)
const cargando = ref(false)
const opciones = ref({ page: 1, itemsPerPage: 30 })
const filtros = ref({
  document_number: '', kind: null, client: null, status: null, currency: null, date_gt: '', date_lt: '',
})

const siglaDeVariante = (valor) => props.variantes.find(v => v.value === valor)?.sigla || '—'

// El rango se edita aparte y entra a los filtros con Aplicar.
const fechas = ref({ desde: '', hasta: '' })

const montoDe = (documento) => monto(documento.total_amount, documento.currency)

const aplicarFechas = () => Object.assign(filtros.value, { date_gt: fechas.value.desde, date_lt: fechas.value.hasta })
const limpiarFechas = () => {
  fechas.value = { desde: '', hasta: '' }
  aplicarFechas()
}

const { begin, isLatest } = useLatestRequest()

async function recargar () {
  cargando.value = true
  const turno = begin()
  // Los vacios no viajan: el back los tomaria como un filtro mas.
  const conValor = Object.fromEntries(Object.entries(filtros.value).filter(([, v]) => v))
  try {
    const { data } = await DocumentsDataService.getAll({
      document_type: props.tipo,
      ...conValor,
      page: opciones.value.page,
      itemsPerPage: opciones.value.itemsPerPage,
    })
    if (!isLatest(turno)) return
    documentos.value = data.results
    total.value = data.totalItems
  } catch {
    if (!isLatest(turno)) return
    documentos.value = []
    total.value = 0
  } finally {
    if (isLatest(turno)) cargando.value = false
  }
}

// Cambio un documento: se reemplaza su fila, si esta en la pagina.
async function refrescarFila (event) {
  const posicion = documentos.value.findIndex(d => d.id === event.detail)
  if (posicion === -1) return
  try {
    const { data } = await DocumentsDataService.get(event.detail)
    documentos.value.splice(posicion, 1, data)
  } catch {
    recargar()
  }
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, ejecutarAccion } =
  useDocumentActions({ editar: documento => emit('editar', documento) })

// El documento cuyo PDF se ve al lado de la lista (PdfSplitView).
const vista = ref(null)
const tituloDe = (documento) => `${documento.document_number} · ${documento.client_name || '—'}`

// La recarga de su tipo, o la de todos los documentos (sin tipo).
const alRecargar = (event) => {
  if (!event.detail || event.detail === props.tipo) recargar()
}

watch(opciones, recargar, { deep: true })
watch(filtros, debounce(() => {
  if (opciones.value.page === 1) recargar()
  else opciones.value.page = 1
}), { deep: true })

onMounted(() => {
  recargar()
  window.addEventListener('wss-reload-documents', alRecargar)
  window.addEventListener('wss-update-document-row', refrescarFila)
})

onUnmounted(() => {
  window.removeEventListener('wss-reload-documents', alRecargar)
  window.removeEventListener('wss-update-document-row', refrescarFila)
})
</script>
