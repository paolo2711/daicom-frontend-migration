<template>
  <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
    <div class="d-flex flex-wrap align-center ga-2">
      <v-text-field
        v-model="search"
        hide-details
        density="compact"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        label="Buscar equipo"
        clearable
        style="max-width: 18.75rem;"
      />
      <v-spacer />
      <template v-if="puedeEditar">
        <v-btn variant="tonal" prepend-icon="mdi-file-download-outline" @click="descargaModalRef?.open()">
          Descargar precios
        </v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-file-upload-outline" @click="preciosModalRef?.open()">
          Subir precios
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="equipoModalRef?.open()">
          Nuevo equipo
        </v-btn>
      </template>
    </div>
  </v-card>

  <resizable-split v-model:abierto="panelAbierto" clave="equipos.catalogo">
    <table-loading-overlay :loading="loading" :isEmpty="equipos.length === 0">
      <v-data-table-server
        :headers="headers"
        :items="equipos"
        :items-length="total_equipos"
        :loading="loading"
        item-value="id"
        class="elevation-0 rounded-lg tabla-mejorada bg-surface"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
        @click:row="(_, { item }) => elegir(item)"
        @contextmenu:row="alClickDerecho"
        :row-props="({ item }) => ({ class: {
          'fila-elegida': foco?.id === item.id, 'fila-en-menu': estaEnElMenu(item), 'cursor-pointer': true,
        } })"
      >
        <template v-slot:bottom>
          <fluent-pagination
            v-model:page="options.page"
            v-model:itemsPerPage="options.itemsPerPage"
            :totalItems="total_equipos"
          />
        </template>

        <template v-slot:item.nombre_tecnico="{ item }">
          <span class="font-weight-bold">{{ item.nombre_tecnico }}</span>
        </template>

        <template v-slot:item.laboratorio="{ item }">
          <span :class="{ 'text-medium-emphasis': !item.laboratorio_data }">{{ item.laboratorio_data?.name || '—' }}</span>
        </template>

        <template v-slot:item.servicios_count="{ item }">
          <span :class="{ 'text-medium-emphasis': !item.servicios_count }">{{ item.servicios_count }}</span>
        </template>

        <template v-slot:item.acciones="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 @click.stop="alBotonDeFila($event, item)" />
        </template>
      </v-data-table-server>
    </table-loading-overlay>

    <template #lado>
      <panel-equipment-services :equipo="foco" :recarga="recargas" :acciones-de="accionesDeServicio"
                                :puede-editar="puedeEditar" @cerrar="cerrar"
                                @accion="(clave, servicio) => accionEnElPanel(clave, servicio)" />
    </template>
  </resizable-split>

  <action-menu v-model:menu="menu" :acciones="accionesDeEquipo(menu.filas)"
               @accion="clave => accionDeEquipo(clave, menu.filas)" />
  <equipo-maestro-modal ref="equipoModalRef" @reload="recargar" />
  <servicio-catalogo-modal ref="servicioModalRef" @reload="recargar" />
  <descargar-precios-modal ref="descargaModalRef" />
  <subir-precios-modal ref="preciosModalRef" @reload="recargar" />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Swal from 'sweetalert2'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import ResizableSplit from '@/components/shared/ResizableSplit.vue'
import EquipoMaestroModal from './EquipoMaestroModal.vue'
import PanelEquipmentServices from './PanelEquipmentServices.vue'
import ServicioCatalogoModal from './ServicioCatalogoModal.vue'
import DescargarPreciosModal from './DescargarPreciosModal.vue'
import SubirPreciosModal from './SubirPreciosModal.vue'

import EquipmentDataService from '@/services/equipments/equipmentDataService'
import { useCatalogActions } from '@/composables/useCatalogActions'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePermissions } from '@/composables/usePermissions'
import { usePage } from '@/composables/usePage'
import { EDITAR_CATALOGO } from '@/utils/equipments/catalogo'
import { debounce } from '@/utils/debounce'
import { mensajeDeError } from '@/utils/errors'
import { leerPagina } from '@/utils/pagination'

const search = ref('')
const loading = ref(false)
const equipos = ref([])
const total_equipos = ref(0)
const { opciones: options, alInicio } = usePage(() => retrieveAll())

const equipoModalRef = ref(null)
const servicioModalRef = ref(null)
const preciosModalRef = ref(null)
const descargaModalRef = ref(null)

// Ver el catalogo es para todos; cambiarlo, con el permiso.
const puedeEditar = usePermissions().hasAction(EDITAR_CATALOGO)

const headers = [
  { title: 'Equipo', key: 'nombre_tecnico', sortable: false },
  { title: 'Laboratorio', key: 'laboratorio', sortable: false },
  { title: 'Servicios', key: 'servicios_count', align: 'center', sortable: false },
  ...(puedeEditar ? [{ title: 'Opciones', key: 'acciones', align: 'center', sortable: false }] : []),
]

// El equipo cuyos servicios muestra el panel; `recargas` le avisa que se guardo algo.
const foco = ref(null)
const panelAbierto = ref(false)
const recargas = ref(0)
const elegir = (equipo) => { foco.value = equipo; panelAbierto.value = true }
const cerrar = () => { foco.value = null; panelAbierto.value = false }

const { begin: beginLoad, isLatest: isLatestLoad } = useLatestRequest()

const retrieveAll = () => {
  loading.value = true
  const token = beginLoad()
  EquipmentDataService.getFiltered(options.value.page, options.value.itemsPerPage, search.value).then(res => {
    if (!isLatestLoad(token)) return
    const pagina = leerPagina(res.data)
    equipos.value = pagina.filas
    total_equipos.value = pagina.total
    // El elegido sigue elegido con lo que trajo la recarga (su nombre o su cuenta de servicios).
    if (foco.value) foco.value = equipos.value.find(e => e.id === foco.value.id) ?? foco.value
  }).catch((err) => {
    Swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, 'No se pudo leer el catálogo.') })
  }).finally(() => {
    if (isLatestLoad(token)) loading.value = false
  })
}

watch(search, debounce(alInicio))

function recargar (eliminado = null) {
  if (eliminado?.id === foco.value?.id) cerrar()
  retrieveAll()
  recargas.value++
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDeEquipo, accionesDeServicio,
        accionDeEquipo, accionDeServicio } = useCatalogActions(equipos, {
  editarEquipo: (equipo) => equipoModalRef.value?.open(equipo),
  editarServicio: (servicio, equipo) => servicioModalRef.value?.open(servicio, equipo.id),
  alCambiar: recargar,
})

const accionEnElPanel = (clave, servicio) => (clave === 'agregar'
  ? accionDeEquipo('servicio', [foco.value])
  : accionDeServicio(clave, [servicio], foco.value))

onMounted(() => { retrieveAll() })
</script>
