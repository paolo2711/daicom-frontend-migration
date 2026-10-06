<template>
  <v-container fluid class="down-top-padding pa-0">

    <!-- ═══════════════════════════════════════════════════
         FILTROS DE BÚSQUEDA
    ════════════════════════════════════════════════════ -->
    <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
      <div class="d-flex flex-wrap align-center" style="gap: 16px;">
        
        <v-text-field
          v-model="correlative"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          label="Buscar Cód. Equipo"
          type="number"
          min="0"
          clearable
          max="99999999"
          style="flex: 0 0 240px;"
        />

        <v-text-field
          v-model="equipment"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-toolbox-outline"
          variant="outlined"
          label="Buscar Equipo"
          clearable
          style="flex: 0 0 220px;"
        />

        <v-divider vertical class="mx-2 d-none d-md-block" style="height: 32px;"></v-divider>

        <filter-pill
          v-if="ver_bandeja_firmas"
          :active="filtro_firma_pendiente"
          :count="appStore.pendingSignaturesCount"
          color="primary"
          badge-color="error"
          icon="mdi-draw"
          tooltip="Filtrar certificados que requieren atención"
          @click="toggleFiltroFirma"
        >Pendientes de Firma</filter-pill>

        <filter-pill
          :active="filtro_excel_pendiente"
          :variant="filtro_excel_pendiente ? 'elevated' : 'tonal'"
          color="orange-darken-2"
          icon="mdi-file-excel-outline"
          tooltip="Filtrar certificados que aún no tienen archivo base"
          @click="toggleFiltroExcel"
        >Pendientes de Excel</filter-pill>

        <!-- ── TEMPORAL Antapacay — borrar esta píldora al terminar contrato (~ago 2026) ── -->
        <v-chip
          variant="flat"
          :class="['antapaccay-chip', 'font-weight-bold', 'cursor-pointer', 'ml-2', { 'antapaccay-chip--active': filtro_antapacay }]"
          @click="toggleFiltroAntapacay"
        >
          <v-icon start size="small" class="antapaccay-pico">mdi-pickaxe</v-icon>
          Antapaccay
          <v-tooltip activator="parent" location="top">Ver solo los certificados de Antapaccay (ocultos en el listado normal)</v-tooltip>
        </v-chip>
        <!-- ── FIN TEMPORAL Antapacay ── -->

        <v-spacer></v-spacer>

        <v-btn 
          :variant="mostrar_filtros_avanzados ? 'tonal' : 'text'" 
          color="primary"
          class="font-weight-bold text-none"
          @click="mostrar_filtros_avanzados = !mostrar_filtros_avanzados"
        >
          <v-icon start>{{ mostrar_filtros_avanzados ? 'mdi-filter-minus' : 'mdi-filter-plus' }}</v-icon>
          {{ mostrar_filtros_avanzados ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-show="mostrar_filtros_avanzados">
          <v-divider class="my-4 border-opacity-25"></v-divider>
          <v-row dense>
            
            <v-col cols="12" md="3">
              <date-range-filter
                v-model:desde="emission_date__gt"
                v-model:hasta="emission_date__lt"
                label="Rango de Emisión"
                @apply="aplicarFiltroFechas"
              />
            </v-col>

            <v-col cols="12" md="3">
              <client-select v-model="client_id" />
            </v-col>

            <v-col cols="12" md="3">
              <v-autocomplete v-model="lab_id" v-model:search="search_lab" @update:menu="cargarLabs" hide-details="auto" density="compact" :loading="loading_labs" prepend-inner-icon="mdi-factory" :items="labs" item-title="name" item-value="id" placeholder="Buscar laboratorio..." clearable variant="outlined" label="Laboratorio" no-filter />
            </v-col>

            <v-col cols="12" md="2">
              <v-autocomplete v-model="certificate_type" hide-details="auto" density="compact" prepend-inner-icon="mdi-cog" :items="TIPOS_CERTIFICADO" clearable variant="outlined" label="Tipo" />
            </v-col>
            
          </v-row>
        </div>
      </v-expand-transition>
    </v-card>

    <selection-bar
      :count="certificados_seleccionados.length"
      label="seleccionado(s)"
      :acciones="accionesDe(certificados_seleccionados)"
      @accion="clave => ejecutarAccion(clave, certificados_seleccionados)"
      @clear="certificados_seleccionados = []"
    />

    <table-loading-overlay :loading="loading_list" :isEmpty="certificates.length === 0">
      <v-data-table-server
        :headers="headers"
        :items="certificates"
        class="elevation-0 rounded-lg tabla-mejorada tabla-certificados-interactiva bg-surface"
        :row-props="getRowProps"
        v-model="certificados_seleccionados"
        show-select
        :item-selectable="vivo"
        item-value="id"
        return-object
        :loading="loading_list"
        @click:row="handleRowClick"
        @contextmenu:row="alClickDerecho"
        :items-length="total_certificates"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
      >

        <template v-slot:bottom>
          <fluent-pagination
            v-model:page="options.page"
            v-model:itemsPerPage="options.itemsPerPage"
            :totalItems="total_certificates"
          />
        </template>

        <!-- ── Header: columna XLS ── -->
        <template v-slot:header.uploaded_xls>
          <v-tooltip location="bottom" color="info">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props">mdi-file-pdf-box</v-icon>
            </template>
            <span>¿EXCEL Subido?</span>
          </v-tooltip>
        </template>

        <!-- ── Header: columna QR ── -->
        <template v-slot:header.uploaded>
          <v-tooltip location="bottom" color="info">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props">mdi-qrcode</v-icon>
            </template>
            <span>¿QR y Firma Generado?</span>
          </v-tooltip>
        </template>

        <!-- ── Chip de código de registro ── -->
        <template v-slot:item.registry_code="{ item }">
          <v-chip :color="estadoDe(item).color" class="text-white font-weight-bold">
            {{ item.registry_code }}
          </v-chip>
        </template>

        <!-- ── Tipo abreviado ── -->
        <template v-slot:item.certificate_type_label="{ item }">
          <span class="text-no-wrap">
            <span :class="vivo(item) ? '' : 'anulado-atenuado'">
              {{ siglaDelTipo(item.certificate_type) }}
            </span>
            <numeros-anteriores :numeros="item.previous_numbers" />
          </span>
        </template>

        <!-- ── Cliente ── -->
        <template v-slot:item.client_data.name="{ item }">
          <span :class="vivo(item) ? '' : 'anulado-atenuado'">
            {{ item.client_data?.name }}
          </span>
        </template>

        <!-- ── Lab ── -->
        <template v-slot:item.lab_data.code="{ item }">
          <span :class="vivo(item) ? 'font-weight-medium' : 'anulado-atenuado font-weight-medium'">
            {{ item.lab_data?.code }}
          </span>
        </template>

        <!-- ── Nombre equipo ── -->
        <template v-slot:item.equipment="{ item }">
          <span :class="vivo(item) ? '' : 'anulado-atenuado'">
            {{ item.equipment }}
          </span>
        </template>

        <template v-slot:item.uploaded_xls="{ item }">
          <div class="d-flex align-center justify-center">
            <v-progress-circular v-if="estadoSubida(item.id, 'sheet') === 'subiendo'"
                                 indeterminate color="primary" size="24" width="3" />

            <!-- El manager solo deja descartar un Excel fallido, porque reintentar
                 el mismo archivo vuelve a fallar. Lo que resuelve es subir otro,
                 y eso se hace desde aca. -->
            <v-tooltip v-else-if="estadoSubida(item.id, 'sheet') === 'fallo'" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props" icon variant="text" density="comfortable" color="error"
                  :disabled="!puede('excel', item)" @click.stop="abrirLote('excel', [item])"
                >
                  <v-icon>mdi-file-alert</v-icon>
                </v-btn>
              </template>
              <span>Fallo la subida. Subir otro Excel</span>
            </v-tooltip>

            <!-- El PDF ya salio pero nadie lo aprobo: no hay nada guardado todavia. -->
            <v-tooltip v-else-if="estadoSubida(item.id, 'sheet') === 'revisando'" location="bottom">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" color="amber-darken-2">mdi-file-eye</v-icon>
              </template>
              <span>Listo para revisar en el panel de subidas</span>
            </v-tooltip>

            <v-tooltip v-else location="bottom">
              <template v-slot:activator="{ props }">
                <!-- El link sale del back ya armado. Los certificados viejos tienen
                     el Excel marcado pero sin ruta, y antes se les armaba /media/1
                     que no existe: ahora sin url, no hay boton de ver. -->
                <v-btn
                  v-if="item.uploaded_xls_url"
                  v-bind="props" icon variant="text" density="comfortable" color="primary"
                  :href="item.uploaded_xls_url" target="_blank"
                  :disabled="!vivo(item)" @click.stop
                >
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
                <!-- Termino pero la fila todavia no trae la ruta: se ve listo, sin link. -->
                <v-btn
                  v-else-if="estadoSubida(item.id, 'sheet') === 'logrado'"
                  v-bind="props" icon variant="text" density="comfortable" color="primary" disabled
                >
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
                <v-btn
                  v-else
                  v-bind="props" icon variant="text" density="comfortable" color="grey"
                  :disabled="!puede('excel', item)" @click.stop="abrirLote('excel', [item])"
                >
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
              </template>
              <span v-if="item.uploaded_xls_url">Ver PDF Base Local</span>
              <span v-else-if="estadoSubida(item.id, 'sheet') === 'logrado'">Listo, preparando el enlace</span>
              <span v-else>Subir Excel</span>
            </v-tooltip>
          </div>
        </template>

        <template v-slot:item.uploaded="{ item }">
          <div class="d-flex align-center justify-center">
            <v-progress-circular v-if="estadoSubida(item.id, 'qr') === 'subiendo'"
                                 indeterminate color="primary" size="24" width="3"></v-progress-circular>

            <v-tooltip v-else-if="estadoSubida(item.id, 'qr') === 'fallo'" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props" icon variant="text" density="comfortable" color="error"
                  :disabled="!puede('qr', item)"
                  @click.stop="abrirLote('qr', [item])"
                >
                  <v-icon>mdi-cloud-alert</v-icon>
                </v-btn>
              </template>
              <span>Fallo. Volver a generar</span>
            </v-tooltip>

            <template v-else>
              <v-tooltip location="bottom" v-if="item.uploaded || estadoSubida(item.id, 'qr') === 'logrado'">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props" icon variant="text" density="comfortable" color="primary"
                    :href="linkDe(item)" target="_blank"
                    :disabled="!vivo(item)" @click.stop="onNubeClick($event, item)"
                  >
                    <v-icon>{{ estaEntregado(item) ? 'mdi-cloud-check' : 'mdi-cloud' }}</v-icon>
                  </v-btn>
                </template>
                <span>
                  Ver PDF en Nube Pública
                  <template v-if="estaEntregado(item)"><br>Entregado el {{ fechaCorta(item.sent_date) }}</template>
                  <br><small>Ctrl+clic: copiar link</small>
                </span>
              </v-tooltip>

              <v-tooltip location="bottom" v-else-if="item.status === NUBE_DESACTUALIZADA">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props" icon variant="text" density="comfortable" :color="ESTADOS[NUBE_DESACTUALIZADA].color"
                    :disabled="!puede('qr', item)"
                    @click.stop="abrirLote('qr', [item])"
                  >
                    <v-icon>mdi-cloud-sync</v-icon>
                  </v-btn>
                </template>
                <span>Archivo en nube desactualizado: firma para actualizarlo</span>
              </v-tooltip>

              <v-tooltip location="bottom" v-else>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props" icon variant="text" density="comfortable" color="grey"
                    :disabled="!puede('qr', item)"
                    @click.stop="abrirLote('qr', [item])"
                  >
                    <v-badge :model-value="item.signature_requested === true" color="warning" dot offset-x="2" offset-y="2">
                      <v-icon>mdi-qrcode-plus</v-icon>
                    </v-badge>
                  </v-btn>
                </template>
                <span>Generar QR y Firmar</span>
              </v-tooltip>
            </template>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn 
            icon 
            variant="text" 
            density="comfortable" 
            color="grey-darken-1"
            :disabled="!accionesDe([item]).length"
            @click.stop="alBotonDeFila($event, item)"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <!-- ── Número de orden ── -->
        <template v-slot:item.order="{ item }">
          <span v-if="item.order">
            <v-menu
              v-if="permiso_resumen"
              :model-value="menu_abierto_id === item.id"
              location="right"
              :close-on-content-click="false"
              transition="slide-x-transition"
              @update:model-value="(val) => {
                menu_abierto_id = val ? item.id : null;
                orden_resonancia = val ? item.order : null;
              }"
            >
              <template v-slot:activator="{ props: menuProps }">
                <v-tooltip location="top" :color="getSemaforoColor(item)">
                  <template v-slot:activator="{ props: tooltipProps }">
                    <v-badge
                      :color="getSemaforoColor(item)"
                      dot
                      :class="{
                        'boton-orden-atenuado': menu_abierto_id !== null
                          && menu_abierto_id !== item.id
                          && orden_resonancia === item.order
                      }"
                    >
                      <v-btn icon variant="text" density="comfortable" color="primary" v-bind="mergeProps(menuProps, tooltipProps)" @click.stop>
                        <v-icon>mdi-file-document-arrow-right-outline</v-icon>
                      </v-btn>
                    </v-badge>
                  </template>
                  <span class="font-weight-bold">{{ getSemaforoText(item) }}</span>
                </v-tooltip>
              </template>

              <order-summary-card
                v-if="menu_abierto_id === item.id"
                :orderId="item.order"
                :orderNumber="ordenDe(item).order_number"
                @cerrar-tarjeta="menu_abierto_id = null; orden_resonancia = null;"
                @seleccionar-orden="seleccionarTodaLaOrden(item.order)"
              />
            </v-menu>

            <v-tooltip location="bottom" color="black" v-else>
              <template v-slot:activator="{ props }">
                <v-icon size="small" color="grey-lighten-1" v-bind="props">mdi-paperclip</v-icon>
              </template>
              <span>Vinculado a una Orden</span>
            </v-tooltip>
          </span>
          <span v-else class="text-grey-lighten-1">---</span>
        </template>

        <!-- ── Fecha ── -->
        <template v-slot:item.created_at="{ item }">
          <span :class="vivo(item) ? '' : 'anulado-atenuado'">
            {{ fechaCorta(item.created_at) || '---' }}
          </span>
        </template>

      </v-data-table-server>
    </table-loading-overlay>

    <!-- ═══════════════════════════════════════════════════
         LEYENDA DE ESTADOS
    ════════════════════════════════════════════════════ -->
    <v-card
      variant="flat"
      class="border mt-4 py-4 px-4 rounded-lg"
    >
      <v-row align="center" justify="center" no-gutters>
        <span class="text-caption font-weight-bold mr-4 text-uppercase text-medium-emphasis">
          Estados del Código:
        </span>
        <div class="d-flex flex-wrap justify-center">
          <v-chip v-for="estado in ESTADOS" :key="estado.texto" size="small" :color="estado.color"
                  class="mr-3 mb-1 text-white">{{ estado.texto }}</v-chip>
        </div>
      </v-row>
    </v-card>

    <!-- ═══════════════════════════════════════════════════
         MODALES Y COMPONENTES EXTERNOS
    ════════════════════════════════════════════════════ -->
    
    
    
    
    
    <certificate-modal ref="certificateModal" />

    <batch-action-modal
      ref="batchActionModalRef"
      @clearSelection="certificados_seleccionados = []"
    />

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />

  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent, mergeProps } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/appStore'

import FluentPagination    from '@/components/commonComponents/FluentPagination.vue'
import SelectionBar         from '@/components/commonComponents/SelectionBar.vue'
import CertificateDataService from '@/services/certificates/certificateDataService.js'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { useUploadState }   from '@/composables/useUploadState'
import { debounce }         from '@/utils/debounce'
import OrderDataService    from '@/services/orders/orderDataService.js'
import CertificateMappers  from '@/mappers/certificateMappers'
import CertificateModal    from '@/views/certificates/components/CertificateModal.vue'
import LabDataService      from '@/services/labs/labDataService'
import LabMappers          from '@/mappers/labMappers'

import OrderSummaryCard    from './OrderSummaryCard.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import ClientSelect        from '@/components/shared/ClientSelect.vue'
import { tieneExcelBase }  from '@/utils/certificates/excelBase'
import { estaEntregado } from '@/utils/certificates/entrega'
import { NUBE_DESACTUALIZADA, ESTADOS, estadoDe, vivo } from '@/utils/certificates/estado'
import { ANULADA } from '@/utils/orders/estado'
import { TIPOS_CERTIFICADO, siglaDelTipo } from '@/utils/certificates/tipos'
import { ACCIONES_CERTIFICADO } from '@/utils/certificates/acciones'
import { accionesPara } from '@/utils/actions'
import { usePermissions } from '@/composables/usePermissions'
import NumerosAnteriores from '@/components/shared/NumerosAnteriores.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { fechaCorta, fechaISO, hoyISO } from '@/utils/dates'
import FilterPill          from '@/components/shared/FilterPill.vue'
import DateRangeFilter     from '@/components/shared/DateRangeFilter.vue'
import { decidirRefresco } from '@/utils/changedRows'
import { useCertificateActions } from '@/composables/useCertificateActions'

// Componentes async (lazy-loading igual que en Vue 2)
// carga diferida de LoadSheet movida a BatchActionModal
const BatchActionModal = defineAsyncComponent(() => import('./BatchActionModal.vue'))

// ─── Composables ──────────────────────────────────────────────────────────────
const route  = useRoute()

const appStore = useAppStore()
const { estadoSubida, confirmarFila } = useUploadState()
const { hasAction } = usePermissions()

// ─── Template refs ────────────────────────────────────────────────────────────
const certificateModal     = ref(null)
const batchActionModalRef  = ref(null)
// uploadSheetModalRef eliminado, ahora se maneja desde batch


// ─── Estado de la tabla ───────────────────────────────────────────────────────
const certificados_seleccionados = ref([])
const certificates             = ref([])
// Lo de cada orden de la pagina, por id: llega una vez aunque la compartan varias filas.
const ordenes                  = ref({})
const ordenDe                  = (item) => ordenes.value[item.order] || {}
const total_certificates       = ref(0)
const loading_list             = ref(false)
const options                  = ref({ page: 1, itemsPerPage: 30 })

const filtro_firma_pendiente   = ref(false) // Estado del Smart Chip
const filtro_excel_pendiente   = ref(false) // Estado del Smart Chip Excel
const filtro_antapacay         = ref(false) // TEMPORAL Antapacay — borrar al terminar contrato (~ago 2026)
const mostrar_filtros_avanzados = ref(false) // Toggle de la UI

// ─── Filtros de fecha ─────────────────────────────────────────────────────────
const emission_date__gt = ref((() => {
  const d = new Date()
  d.setMonth(d.getMonth() - 8) // ventana por defecto: últimos 8 meses
  return fechaISO(d)
})())
const emission_date__lt = ref(hoyISO())


// ─── Laboratorios ─────────────────────────────────────────────────────────────
const lab_id = ref(null)

const { 
  items: labs, 
  loading: loading_labs, 
  searchQuery: search_lab, 
  retrieveData: retrieveLabs 
} = usePaginatedSearch(
  (page, size, query) => LabDataService.getFiltered(page, size, query),
  LabMappers.getMap,
  () => lab_id.value,
  'labs'
)

// El filtro vive dentro del panel plegado: la lista se pide al desplegarlo.
const labs_pedidos = ref(false)
const cargarLabs = (abierto) => {
  if (!abierto || labs_pedidos.value) return
  labs_pedidos.value = true
  retrieveLabs()
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
const client_id = ref(null)

// ─── Tipo de certificado ──────────────────────────────────────────────────────
const certificate_type  = ref(null)
const correlative = ref('')
const equipment = ref('')

// ─── Órdenes / menús ─────────────────────────────────────────────────────────
const menu_abierto_id = ref(null)
const orden_resonancia = ref(null)

// ─── Permisos ─────────────────────────────────────────────────────────────────
const is_admin                = ref(false)
const user_permissions        = ref([])
const permiso_resumen         = ref(false)

const accionesDe = (certs) => accionesPara(ACCIONES_CERTIFICADO, certs, hasAction)

// Los botones de Excel y QR de la fila siguen las reglas del menu.
const puede = (clave, cert) => accionesDe([cert]).some(a => a.clave === clave && !a.disabled)
//permisos pildora
const ver_bandeja_firmas = computed(() => {
  return is_admin.value || user_permissions.value.includes(1001) || user_permissions.value.includes(1005)
})

// ─── Headers de la tabla ──────────────────────────────────────────────────────
// Vuetify 3: "title" en lugar de "text", "key" en lugar de "value"
const baseHeaders = [
  { title: 'Cód. Registro',       key: 'registry_code',         align: 'start',  sortable: false },
  { title: 'Tipo',                key: 'certificate_type_label', align: 'start',  sortable: false },
  { title: 'Cliente Certificado', key: 'client_data.name',                        sortable: false },
  { title: 'Lab.',                key: 'lab_data.code',                            sortable: false },
  { title: 'Nombre',              key: 'equipment',                               sortable: false },
  { title: 'XLS',                 key: 'uploaded_xls',          align: 'center', sortable: false },
  { title: 'Firma/QR',            key: 'uploaded',              align: 'center', sortable: false },
  { title: 'Orden',               key: 'order',                                   sortable: false },
  { title: 'F. Agregado',         key: 'created_at',                              sortable: false },
  { title: 'Opciones',            key: 'actions',               align: 'center', sortable: false },
]

// Con el filtro Antapaccay todas las filas son el mismo cliente → ocultamos esa
// columna. TEMPORAL Antapaccay — al quitar el filtro, volver headers a baseHeaders.
const headers = computed(() =>
  filtro_antapacay.value
    ? baseHeaders.filter(h => h.key !== 'client_data.name')
    : baseHeaders
)



// ─── Row props (reemplaza item-class de Vuetify 2) ───────────────────────────
function getRowProps ({ item }) {
  const esResonancia = orden_resonancia.value && item.order === orden_resonancia.value;
  const esOpcionesAbiertas = estaEnElMenu(item);

  return {
    class: (esResonancia || esOpcionesAbiertas) ? 'resonancia-activa' : ''
  }
}

// Guard de secuencia: si dos cargas se solapan, solo se aplica la mas reciente
// (evita que la carga sin filtro pise la busqueda enlazada).
const { begin: beginCertLoad, isLatest: isLatestCertLoad } = useLatestRequest()

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(options, () => retrieveAllCertificates(), { deep: true })

// Busqueda enlazada: si llega/cambia ?correlativo (incluso ya estando en la
// pestana), lo aplicamos y el watch de `correlative` dispara la busqueda.
watch(() => route.query.correlativo, (v) => { correlative.value = v || '' })

// Igual para ?firma_pendiente (notificacion de firma solicitada): activa el filtro.
watch(() => route.query.firma_pendiente, (v) => {
  if (v) { filtro_firma_pendiente.value = true; options.value.page = 1; retrieveAllCertificates() }
})

// Desde Inicio ("Ver los N" de por elaborar) llega ?excel_pendiente=1.
watch(() => route.query.excel_pendiente, (v) => {
  if (v) { filtro_excel_pendiente.value = true; options.value.page = 1; retrieveAllCertificates() }
})

watch(correlative,       () => { options.value.page = 1; retrieveAllCertificates() })
// Texto libre: espera a que termine de escribir en vez de consultar por letra.
watch(equipment, debounce(() => { options.value.page = 1; retrieveAllCertificates() }))
watch(certificate_type,  () => { options.value.page = 1; retrieveAllCertificates() })
watch(client_id,         () => { options.value.page = 1; retrieveAllCertificates() })
watch(lab_id,            () => { options.value.page = 1; retrieveAllCertificates() })

// El modal de lote muestra fila por fila que va a pasar. Con uno solo la fila
// va marcada aunque ya tenga lo suyo: elegirlo es pedir reemplazarlo.
function abrirLote (accion, certs) {
  batchActionModalRef.value?.open(accion, certs, certs.length === 1)
}

const { ejecutarAccion, copiarLinks, linkDe } = useCertificateActions({
  abrirLote,
  abrirFicha: (cert) => certificateModal.value?.open(cert),
})

// ─── Expose ───────────────────────────────────────────────────────────────────
defineExpose({
  certificateModal,
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  retrieveAllCertificates() 
  const user = JSON.parse(localStorage.getItem('user')) || {}
  
  is_admin.value         = user.kind !== undefined && user.kind < 1
  user_permissions.value = user.action_permissions || []
  permiso_resumen.value         = is_admin.value || user_permissions.value.includes(1002)

  if (route.query.correlativo) {
    correlative.value = route.query.correlativo
  }

  // Desde la notificacion de "firma solicitada": llega ?firma_pendiente=1 -> activa
  // el filtro de la pildora de pendientes de firma (el guard de secuencia evita
  // que la carga sin filtro pise este resultado).
  if (route.query.firma_pendiente) {
    filtro_firma_pendiente.value = true
    options.value.page = 1
    retrieveAllCertificates()
  }

  if (route.query.excel_pendiente) {
    filtro_excel_pendiente.value = true
    options.value.page = 1
    retrieveAllCertificates()
  }

  window.addEventListener('wss-reload-certificates', recargarPorWebSocket)
  window.addEventListener('wss-update-row',       fetchAndInjectSingleCert)
  window.addEventListener('wss-update-rows',      aplicarFilasCambiadas)
  window.addEventListener('wss-update-order-row', fetchAndInjectOrderUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('wss-reload-certificates', recargarPorWebSocket)
  window.removeEventListener('wss-update-row',       fetchAndInjectSingleCert)
  window.removeEventListener('wss-update-rows',      aplicarFilasCambiadas)
  window.removeEventListener('wss-update-order-row', fetchAndInjectOrderUpdate)
})

// ─── Métodos ──────────────────────────────────────────────────────────────────





function toggleFiltroFirma () {
  filtro_firma_pendiente.value = !filtro_firma_pendiente.value
  options.value.page = 1
  retrieveAllCertificates() // Ejecuta la búsqueda
}

function toggleFiltroExcel () {
  filtro_excel_pendiente.value = !filtro_excel_pendiente.value
  options.value.page = 1
  retrieveAllCertificates() // Ejecuta la búsqueda
}

// ── TEMPORAL Antapacay — borrar al terminar contrato (~ago 2026) ──
function toggleFiltroAntapacay () {
  filtro_antapacay.value = !filtro_antapacay.value
  options.value.page = 1
  retrieveAllCertificates()
}

function aplicarFiltroFechas () {
  options.value.page = 1    // Reinicia la paginación a la página 1
  retrieveAllCertificates() // Dispara 1 sola búsqueda limpia al backend
}

function seleccionarTodaLaOrden (orderId) {
  const certificadosDeOrden = certificates.value.filter(c => c.order === orderId && vivo(c))
  
  certificadosDeOrden.forEach(cert => {
    if (!certificados_seleccionados.value.find(s => s.id === cert.id)) {
      certificados_seleccionados.value.push(cert)
    }
  })
  
  // Apagamos la resonancia azul y cerramos el menú
  orden_resonancia.value = null
  menu_abierto_id.value = null
}

// ---  SEMAFORO INTELIGENTE (FINANCIERO + OPERATIVO) ---

const getSemaforoColor = (item) => {
  const orden = ordenDe(item)
  if (orden.order_status === ANULADA) return 'grey-darken-3'
  // Sin cargo va en verde: no hay nada que facturar ni cobrar, o sea que por el
  // lado del dinero esta cerrado igual que una pagada.
  if (orden.order_requiere_pago === false) return 'success'

  const hasInv = orden.order_has_invoices
  const hasPay = orden.order_has_payments

  if (orden.order_vence) return 'teal'    // A credito: no se cobra hasta que vence
  if (hasInv && hasPay) return 'success'  // Verde: Facturado y pagado
  if (hasInv || hasPay) return 'warning'  // Amarillo: Hay plata moviéndose (falta factura o falta pago)
  
  // Si llegamos aquí, es porque NO hay factura y NO hay pago
  if (tieneExcelBase(item)) return 'red'  // Rojo Alerta: Trabajo técnico hecho, pero no han cobrado
  return 'primary'                        // Azul: Borrador recién creado, nadie ha trabajado ni cobrado
}

const getSemaforoText = (item) => {
  const orden = ordenDe(item)
  if (orden.order_status === ANULADA) return 'Orden Anulada'
  if (orden.order_requiere_pago === false) return 'Sin cargo, no se cobra'

  const hasInv = orden.order_has_invoices
  const hasPay = orden.order_has_payments

  if (orden.order_vence) return `A crédito · vence ${fechaCorta(orden.order_vence)}`
  if (hasInv && hasPay) return 'Facturación y Liquidación Completadas'
  if (hasInv && !hasPay) return 'Facturada (Pendiente de Liquidación)'
  if (!hasInv && hasPay) return 'Liquidación en Proceso (Pendiente de Facturación)'
  
  // Si llegamos aquí, es porque NO hay factura y NO hay pago
  if (tieneExcelBase(item)) return 'Trabajo técnico listo, falta Facturar y Cobrar'
  return 'Pendiente de Trabajo Técnico y Cobro'
}
// --------------------------------------

// Un anulado no se marca: su menu es de el solo.
const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } =
  useContextMenu(certificados_seleccionados, { seMarca: vivo })

function handleRowClick (event, { item }) {
  // Prevenir selección si el clic fue en un botón, enlace o ícono interactivo
  if (event.target.closest('button, a, .v-btn, .v-icon')) return

  // Vuetify 3 a veces envuelve el objeto en 'raw' durante los eventos
  const cert = item.raw || item 
  
  // No permitir selección de elementos anulados
  if (!vivo(cert)) return

  // Verificar si ya está seleccionado para agregarlo o quitarlo del array
  const index = certificados_seleccionados.value.findIndex(c => c.id === cert.id)
  if (index === -1) {
    certificados_seleccionados.value.push(cert)
  } else {
    certificados_seleccionados.value.splice(index, 1)
  }
}



// `silencioso` lo usa la recarga que llega por WebSocket: la disparo otro, el
// usuario no esta esperando nada, y un "cargando" ahi es una interrupcion.
function retrieveAllCertificates (opciones) {
  const silencioso = opciones?.silencioso === true

  // AL RECARGAR DATOS: Reiniciamos las selecciones para evitar filas fantasma (filtros o paginación)
  certificados_seleccionados.value = []

  if (!silencioso) loading_list.value = true
  const token = beginCertLoad()   // guard de secuencia: solo aplica la carga más reciente
  const pedidoEn = Date.now()     // lo que termine despues de esto, esta carga no lo vio
  const itemsPerPage       = options.value.itemsPerPage > 0 ? options.value.itemsPerPage : 100000
  const correlativeNumber  = correlative.value > 0 ? Number(correlative.value) : ''

  // Pasamos los parámetros al final
  CertificateDataService.getFiltered({
    page: options.value.page,
    page_size: itemsPerPage,
    correlative: correlativeNumber,
    equipment: equipment.value || '',
    client: client_id.value || '',
    lab: lab_id.value || '',
    emission_date__gt: emission_date__gt.value,
    emission_date__lt: emission_date__lt.value,
    certificate_type: certificate_type.value || '',
    signature_requested: filtro_firma_pendiente.value,
    pending_excel: filtro_excel_pendiente.value,
    antapacay: filtro_antapacay.value ? 1 : '', // TEMPORAL Antapacay — borrar al terminar contrato
  }).then((response) => {
    if (!isLatestCertLoad(token)) return   // llegó una carga más nueva → no pisar
    certificates.value = response.data.results.map(cert => CertificateMappers.getMap(cert))
    ordenes.value = response.data.ordenes || {}
    total_certificates.value = response.data.count
    // La lista viene del server, asi que manda ella sobre cualquier tarea terminada.
    certificates.value.forEach(c => confirmarFila(c.id, pedidoEn))
  }).catch(() => {}).finally(() => {
    if (isLatestCertLoad(token)) loading_list.value = false
  })
}

const recargarPorWebSocket = () => retrieveAllCertificates({ silencioso: true })

function traerFilaCert (certId) {
  const pedidoEn = Date.now()
  CertificateDataService.get(certId).then(response => {
    if (response?.data) updateSingleCertificateInList(response.data, pedidoEn)
  }).catch(() => {})
}

function fetchAndInjectSingleCert (event) { traerFilaCert(event.detail) }

// Cambio una tanda entera: solo se toca lo que hay en pantalla.
function aplicarFilasCambiadas (event) {
  const visibles = certificates.value.map(c => c.id)
  const { accion, ids } = decidirRefresco(event.detail || [], visibles)
  if (accion === 'parchear') ids.forEach(traerFilaCert)
  else if (accion === 'refrescar') recargarPorWebSocket()
}

function updateSingleCertificateInList (updatedCert, pedidoEn) {
  // Llego el dato del server: la tarea ya no tiene que suplir a la fila.
  confirmarFila(updatedCert.id, pedidoEn)

  const index = certificates.value.findIndex(c => c.id === updatedCert.id)
  if (index !== -1) {
    // Al tener el mapper actualizado, obtenemos el objeto limpio.
    // Object.assign muta el proxy reactivo directamente para que Vue 3 repinte solo esta fila.
    Object.assign(certificates.value[index], CertificateMappers.getMap(updatedCert))
    // El detalle trae su orden: sirve aunque recien lo hayan vinculado a una que no estaba en la pagina.
    if (updatedCert.order) ordenes.value = { ...ordenes.value, [updatedCert.order]: CertificateMappers.getOrden(updatedCert) }
  }
}

// El semaforo llega calculado desde el back, con la misma regla que la lista.
function fetchAndInjectOrderUpdate (event) {
  if (!(event.detail in ordenes.value)) return
  OrderDataService.getEstado(event.detail).then(response => {
    const estado = response?.data
    if (estado) ordenes.value = { ...ordenes.value, [event.detail]: estado }
  }).catch(() => {})
}

// Clic normal en el botón de nube: abre el PDF (href). Ctrl/Cmd+clic: copia el link.
function onNubeClick(event, cert) {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    copiarLinks([cert])
  }
}

</script>

<style>

/* ── TEMPORAL Antapaccay — borrar este bloque al terminar contrato (~ago 2026) ── */
.antapaccay-chip {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(184, 115, 51, 0.45) !important;
  background: rgba(184, 115, 51, 0.10) !important;
  color: #8a5a2b !important;
  transition: transform .2s ease, box-shadow .25s ease, background .25s ease;
}
.antapaccay-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(184, 115, 51, 0.35) !important;
}
.antapaccay-chip--active {
  background: linear-gradient(120deg, #6d3810, #b87333 42%, #e6b483 52%, #b87333 62%, #6d3810) !important;
  color: #fff !important;
  border-color: transparent !important;
  box-shadow: 0 3px 14px rgba(184, 115, 51, 0.55) !important;
}
/* Brillo metálico que barre de lado a lado */
.antapaccay-chip--active::after {
  content: "";
  position: absolute;
  top: 0;
  left: -70%;
  width: 45%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transform: skewX(-20deg);
  pointer-events: none;
  animation: antapaccay-shine 2.6s ease-in-out infinite;
}
.antapaccay-chip .v-chip__content {
  position: relative;
  z-index: 1;
}
@keyframes antapaccay-shine {
  0%   { left: -70%; }
  55%  { left: 130%; }
  100% { left: 130%; }
}
/* El pico "pica" mientras está activa */
.antapaccay-chip--active .antapaccay-pico {
  transform-origin: 65% 65%;
  animation: antapaccay-pick 1.5s ease-in-out infinite;
}
@keyframes antapaccay-pick {
  0%, 100% { transform: rotate(0deg); }
  40%      { transform: rotate(-22deg); }
  55%      { transform: rotate(8deg); }
  70%      { transform: rotate(0deg); }
}
/* ── FIN TEMPORAL Antapaccay ── */


/* =========================================================
   ESTADO ANULADO
   ========================================================= */
.anulado-atenuado {
  opacity: 0.3 !important;
  pointer-events: none;
}



/* =========================================================
   BOTÓN DE ORDEN: HERMANOS ATENUADOS
   Cuando un menú de orden está abierto, los botones de las
   otras filas de la MISMA orden se apagan y no son clicables.
   La transición es suave para no ser brusca.
   ========================================================= */
.boton-orden-atenuado {
  opacity: 0.2 !important;
  pointer-events: none !important;
  transition: opacity 0.25s ease !important;
}



/* =========================================================
   EFECTO RESONANCIA (Fila activa por orden o por opciones)
   ========================================================= */
.tabla-certificados-interactiva tbody tr.resonancia-activa,
.tabla-certificados-interactiva tbody tr.resonancia-activa td {
  background-color: #E3F2FD !important;
  transition: background-color 0.2s ease-in-out;
}
.v-theme--dark .tabla-certificados-interactiva tbody tr.resonancia-activa,
.v-theme--dark .tabla-certificados-interactiva tbody tr.resonancia-activa td {
  background-color: #0f1d31 !important;
}

/* La píldora de selección flotante vive ahora en el componente común
   @/components/commonComponents/SelectionBar.vue (estilos incluidos). */

/* =========================================================
   EFECTO GMAIL: CHECKBOXES INVISIBLES Y FILAS CLIQUEABLES
   ========================================================= */
/* Cursor de puntero para toda la fila */
.tabla-certificados-interactiva tbody tr {
  cursor: pointer;
}

/* Hover NORMAL (Aplica SOLO si la fila NO está en resonancia azul) */
.tabla-certificados-interactiva tbody tr:not(.resonancia-activa):hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-certificados-interactiva tbody tr:not(.resonancia-activa):hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* Hover EN RESONANCIA (Intensifica el azul ligeramente al pasar el mouse por la fila activa) */
.tabla-certificados-interactiva tbody tr.resonancia-activa:hover,
.tabla-certificados-interactiva tbody tr.resonancia-activa:hover td {
  background-color: #BBDEFB !important; /* Azul claro más intenso (Modo Claro) */
}
.v-theme--dark .tabla-certificados-interactiva tbody tr.resonancia-activa:hover,
.v-theme--dark .tabla-certificados-interactiva tbody tr.resonancia-activa:hover td {
  background-color: #152945 !important; /* Azul noche más intenso (Modo Oscuro) */
}

/* Checkboxes con opacidad baja (efecto marca de agua) por defecto */
.tabla-certificados-interactiva tbody tr td:first-child .v-selection-control {
  opacity: 0.25; /* 25% crea la pista visual sin generar ruido */
  transition: opacity 0.2s ease-in-out;
}

/* Mostrar checkbox al hacer hover, o si el checkbox ya está marcado/sucio */
.tabla-certificados-interactiva tbody tr:hover td:first-child .v-selection-control,
.tabla-certificados-interactiva tbody tr td:first-child .v-selection-control--dirty,
.tabla-certificados-interactiva tbody tr td:first-child .v-selection-control[aria-checked="true"] {
  opacity: 1 !important;
}
</style>