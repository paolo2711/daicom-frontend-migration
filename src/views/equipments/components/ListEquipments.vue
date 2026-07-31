<template>
  <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
    <div class="d-flex flex-wrap align-center mb-4">
      <v-text-field
        v-model="search"
        hide-details
        density="compact"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        label="Buscar Equipo Maestro..."
        clearable
        style="max-width: 300px;"
      />
      <v-spacer />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="equipoModalRef?.open()">
        NUEVO EQUIPO MAESTRO
      </v-btn>
    </div>

    <table-loading-overlay :loading="loading" :isEmpty="equipos.length === 0">
      <v-data-table-server
        v-model:expanded="expanded"
        :headers="headers"
        :items="equipos"
        :items-length="total_equipos"
        :loading="loading"
        show-expand
        item-value="id"
        :hover="false"
        class="elevation-0 rounded-lg tabla-mejorada bg-surface"
        style="border: 1px solid rgba(0,0,0,0.12);"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
        @click:row="manejarClicFila"
        :row-props="(data) => ({ 
          class: expanded.includes(data.item.id || (data.item.raw && data.item.raw.id)) ? 'fila-padre-activa' : '' 
        })"
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

        <template v-slot:item.servicios_count="{ item }">
          <v-chip size="small" :color="item.servicios?.length > 0 ? 'info' : 'grey'" variant="tonal" class="font-weight-bold">
            {{ item.servicios?.length || 0 }} Servicios
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-tooltip location="bottom" color="primary">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                density="comfortable"
                @click.stop="equipoModalRef?.open(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Editar Equipo</span>
          </v-tooltip>

          <v-tooltip location="bottom" color="error">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                color="red-darken-2"
                variant="text"
                density="comfortable"
                @click.stop="deleteEquipo(item)"
              >
                <v-icon>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
            <span>Eliminar Equipo</span>
          </v-tooltip>
        </template>

        <!-- FILA EXPANDIDA -->
        <template v-slot:expanded-row="{ columns, item }">
          <tr class="fila-activa">
            <td :colspan="columns.length" class="pa-0">
              <v-card flat tile color="transparent" class="elevation-0 py-2">
                <v-toolbar density="compact" flat color="transparent" class="pl-3 pr-3">
                  <v-icon start color="secondary">mdi-format-list-bulleted-type</v-icon>
                  <span class="text-subtitle-2 font-weight-bold text-secondary">
                    Menú Comercial: {{ item.nombre_tecnico }}
                  </span>
                  <v-spacer/>
                  <v-btn size="x-small" color="secondary" variant="flat" class="text-white" @click="servicioModalRef?.open(null, item.id)">
                    <v-icon start size="x-small">mdi-plus</v-icon> Añadir Servicio
                  </v-btn>
                </v-toolbar>

                <v-table density="compact" :hover="false" class="bg-transparent mt-2">
                  <thead>
                    <tr>
                      <th class="text-overline">TIPO</th>
                      <th class="text-overline">DESCRIPCIÓN COMERCIAL</th>
                      <th class="text-right text-overline">P. ESTÁNDAR</th>
                      <th class="text-right text-overline">P. CORPORATIVO</th>
                      <th class="text-center text-overline"><v-icon size="small">mdi-dots-vertical</v-icon></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="serv in item.servicios" :key="serv.id">
                      <td><v-chip size="x-small" variant="outlined" color="primary">{{ serv.tipo_servicio_label }}</v-chip></td>
                      <td style="max-width: 300px;" class="text-truncate" :title="serv.descripcion_comercial">{{ serv.descripcion_comercial }}</td>
                      <td class="text-right font-weight-bold">S/ {{ formatMoney(serv.precio_estandar) }}</td>
                      <td class="text-right font-weight-bold text-primary">S/ {{ formatMoney(serv.precio_corporativo) }}</td>
                      <td class="text-center">
                        <v-btn icon variant="text" density="comfortable" size="x-small" color="primary" @click="servicioModalRef?.open(serv, item.id)">
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn icon variant="text" density="comfortable" size="x-small" color="error" @click="deleteServicio(serv)">
                          <v-icon>mdi-delete-outline</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                    <tr v-if="!item.servicios || item.servicios.length === 0">
                      <td colspan="5" class="text-center text-grey py-4">No hay servicios comerciales configurados.</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </table-loading-overlay>

    <!-- Modales -->
    <equipo-maestro-modal ref="equipoModalRef" @reload="retrieveAll" />
    <servicio-catalogo-modal ref="servicioModalRef" @reload="retrieveAll" />
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Swal from 'sweetalert2'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import EquipoMaestroModal from './EquipoMaestroModal.vue'
import ServicioCatalogoModal from './ServicioCatalogoModal.vue'

import EquipmentDataService from '@/services/equipments/equipmentDataService'
import ServicioCatalogoDataService from '@/services/equipments/servicioCatalogoDataService'

const search = ref('')
const loading = ref(false)
const equipos = ref([])
const total_equipos = ref(0)
const expanded = ref([])
const options = ref({ page: 1, itemsPerPage: 30 })
let debounceSearch = null

const equipoModalRef = ref(null)
const servicioModalRef = ref(null)

const headers = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: 'Nombre Técnico del Equipo', key: 'nombre_tecnico' },
  { title: 'Catálogo', key: 'servicios_count', align: 'center' },
  { title: 'Opciones', key: 'actions', align: 'center', sortable: false },
  { title: '', key: 'data-table-expand' }
]

const formatMoney = (val) => {
  return parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Server-side: pide solo la pagina actual, filtrando por 'search' en el backend
// (mismo endpoint/parametros que EquipmentDataService.getFiltered ya usa en los autocompletes)
const retrieveAll = () => {
  loading.value = true
  EquipmentDataService.getFiltered(options.value.page, options.value.itemsPerPage, search.value).then(res => {
    equipos.value = res.data.results
    total_equipos.value = res.data.count
  }).catch(e => {
    Swal.fire('Error', 'Fallo al conectar con la base de datos.', 'error')
  }).finally(() => {
    loading.value = false
  })
}

// Debounce igual de espiritu que applyFilters en TabOrdersService, pero sin
// esperar a que el usuario dispare un evento aparte: cada tecleo reinicia
// la pagina a 1 y vuelve a pedir al backend tras una pausa corta.
watch(search, () => {
  clearTimeout(debounceSearch)
  debounceSearch = setTimeout(() => {
    options.value.page = 1
    retrieveAll()
  }, 400)
})

watch(options, () => { retrieveAll() }, { deep: true })

const manejarClicFila = (event, { item }) => {
  if (event.target.closest('button') || event.target.closest('.v-btn') || event.target.closest('.v-data-table__expand-icon')) return
  const itemId = item.id || (item.raw && item.raw.id)
  expanded.value = expanded.value.includes(itemId) ? [] : [itemId]
}

const deleteEquipo = (item) => {
  Swal.fire({
    title: '¿Eliminar Equipo Maestro?',
    text: `Se borrará "${item.nombre_tecnico}" y todos sus servicios comerciales asociados.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
  }).then((result) => {
    if (result.isConfirmed) {
      EquipmentDataService.delete(item.id).then(() => {
        retrieveAll()
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Equipo eliminado' })
      }).catch(() => Swal.fire('Error', 'No se pudo eliminar, puede estar en uso.', 'error'))
    }
  })
}

const deleteServicio = (serv) => {
  Swal.fire({
    title: '¿Eliminar Servicio?',
    text: `Se borrará este precio del catálogo comercial.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
  }).then((result) => {
    if (result.isConfirmed) {
      ServicioCatalogoDataService.delete(serv.id).then(() => {
        retrieveAll()
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Servicio eliminado' })
      }).catch(() => Swal.fire('Error', 'No se pudo eliminar.', 'error'))
    }
  })
}

onMounted(() => { retrieveAll() })
</script>

<style scoped>
.text-overline {
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px !important;
  color: #757575 !important;
}

/* Reglas CSS replicadas de tus órdenes para anular el hover molesto en filas expandidas */
.v-theme--light .tabla-mejorada tbody tr:not(.fila-padre-activa):not(.fila-activa):hover > td {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-mejorada tbody tr:not(.fila-padre-activa):not(.fila-activa):hover > td {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
.tabla-mejorada tbody tr.fila-padre-activa > td::after,
.tabla-mejorada tbody tr.fila-activa > td::after {
  display: none !important;
}
.tabla-mejorada tr.fila-activa .v-table tbody tr > td::after {
  display: none !important;
}
.v-theme--light .tabla-mejorada tbody tr.fila-padre-activa > td,
.v-theme--light .tabla-mejorada tbody tr.fila-activa > td {
  background-color: #e8e8e8 !important;
}
.v-theme--dark .tabla-mejorada tbody tr.fila-padre-activa > td,
.v-theme--dark .tabla-mejorada tbody tr.fila-activa > td {
  background-color: #292929 !important;
}
.tabla-mejorada tr.fila-activa .v-table,
.tabla-mejorada tr.fila-activa .v-table__wrapper {
  background-color: transparent !important;
}
</style>