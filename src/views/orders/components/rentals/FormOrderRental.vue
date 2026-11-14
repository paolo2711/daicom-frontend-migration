<template>
  <workspace-layout :detalle-abierto="Boolean(elegida || opcionAbierta)" @cerrar="cerrarPanel">
    <template v-if="$slots.orden" #apoyo="{ apilado }">
      <workspace-tabs v-model="pestana" v-model:abiertos="datosAbiertos" :pestanas="pestanas" :apilado="apilado">
        <slot v-if="pestana === 'info'" name="orden" :apilado="apilado" />
        <option-rows v-else :opciones="opcionesDelPanel" :abierta="opcionAbierta" @abrir="abrirOpcion" />
      </workspace-tabs>
    </template>

    <template #lista>
      <div class="titulo-de-hoja titulo-principal flex-wrap ga-2 py-2">
        <span class="mr-auto">
          Equipos <span class="text-medium-emphasis font-weight-regular">({{ equipments.length }})</span>
        </span>
        <paginated-autocomplete ref="buscador" v-model="buscado" :fetch="fetchEquipos"
                                :exclude-ids="equipments.map(e => e.equipment_id)" recurso="equipos"
                                label="Agregar del inventario" :return-object="false" prepend-inner-icon="mdi-magnify"
                                density="compact" variant="outlined" hide-details class="buscador-de-equipo"
                                @selected="agregar">
          <template #item="{ item, props: opcion }">
            <v-list-item v-bind="opcion" :title="null">
              <v-list-item-title><strong>{{ item.raw.internal_id }}</strong> · {{ item.raw.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ detalleDe(item.raw) }}</v-list-item-subtitle>
            </v-list-item>
          </template>
          <template #append>
            <add-new-button texto="Nuevo equipo en el inventario" @click="nuevoEnInventario?.open()" />
          </template>
        </paginated-autocomplete>
      </div>

      <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
        <v-table v-if="equipments.length > 0" density="compact" class="lista-de-tarjetas" fixed-header>
          <thead>
            <tr>
              <th style="width: 7rem;">ID</th>
              <th>Equipo</th>
              <th style="width: 8rem;">{{ FECHAS_ALQUILER.departure_date }}</th>
              <th style="width: 9rem;">{{ FECHAS_ALQUILER.expected_return_date }}</th>
              <th v-if="conEstado" style="width: 7rem;">Estado</th>
              <th style="width: 3rem;"></th>
            </tr>
          </thead>
          <tbody>
            <row-order-rental v-for="(eq, index) in equipments" :key="eq.id ?? `nuevo-${eq.equipment_id}`"
                              :eq="eq" :indice="index" :error="errores[index]" :con-estado="conEstado"
                              :elegida="eq === elegida" @elegir="elegida = eq" @borrar="borrarFila" />
          </tbody>
        </v-table>
        <div v-else class="d-flex flex-column align-center justify-center fill-height ga-2 pa-8 text-medium-emphasis">
          <v-icon size="x-large">mdi-truck-delivery-outline</v-icon>
          Agrega un equipo del inventario con el buscador de arriba.
        </div>
      </div>
      <add-equipment ref="nuevoEnInventario" @saved="buscador?.reload()" />
    </template>

    <template #detalle>
      <panel-order-rental v-if="elegida" :eq="elegida" :indice="indiceElegida" :error="errores[indiceElegida]"
                          @cerrar="cerrarPanel" @borrar="borrarFila" />
      <detail-panel v-else :titulo="tituloDeOpcion" @cerrar="cerrarPanel">
        <slot name="opcion" :clave="opcionAbierta" />
      </detail-panel>
    </template>

    <template #sin-detalle>
      <detail-empty titulo="Equipo" icono="mdi-toolbox-outline" texto="Elige un equipo de la lista para ver y llenar sus datos." />
    </template>
  </workspace-layout>
</template>

<script setup>
import { ref, computed, watch, nextTick, defineAsyncComponent } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import AddNewButton from '@/components/commonComponents/AddNewButton.vue'
import DetailEmpty from '@/components/shared/DetailEmpty.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import DetailPanel from '@/components/shared/DetailPanel.vue'
import OptionRows from '@/components/shared/OptionRows.vue'
import WorkspaceTabs from '@/components/shared/WorkspaceTabs.vue'
import { useDetailOptions } from '@/composables/useDetailOptions'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import RowOrderRental from './RowOrderRental.vue'
import PanelOrderRental from './PanelOrderRental.vue'
import { useRowErrors } from '@/composables/useRowErrors'
import { FECHAS_ALQUILER } from '@/utils/orders/alquiler'

const AddEquipment = defineAsyncComponent(() => import('@/views/inventory/components/AddEquipment.vue'))

const props = defineProps({
  // Las de la pestaña Opciones, [{ clave, titulo, icono, valor }]; se abren a la derecha con el slot `opcion`.
  opcionesDelPanel: { type: Array, default: () => [] },
})
const emit = defineEmits(['update-list'])

const equipments = ref([])
const { errores, marcarErrores } = useRowErrors(equipments)

// La fila abierta en el panel.
const elegida = ref(null)
const indiceElegida = computed(() => equipments.value.indexOf(elegida.value))

const pestana = ref('info')
const datosAbiertos = ref(true)
const pestanas = computed(() => [
  { valor: 'info', texto: 'Información', icono: 'mdi-card-account-details-outline' },
  ...(props.opcionesDelPanel.length ? [{ valor: 'opciones', texto: 'Opciones', icono: 'mdi-format-list-bulleted' }] : []),
])
const { opcionAbierta, abrirOpcion, tituloDeOpcion } = useDetailOptions(elegida, () => props.opcionesDelPanel)
// Al ver uno guardado, cada fila dice en que va: reservado, en obra o devuelto.
const conEstado = computed(() => equipments.value.some(e => e.estado))

const buscador = ref(null)
const buscado = ref(null)
const nuevoEnInventario = ref(null)
// Solo los disponibles; al guardar, el back lo vuelve a revisar.
const fetchEquipos = (page, size, query) =>
  InventoryDataService.getAll({ status: 1, search: query || '', page, page_size: size })
const detalleDe = (equipo) => [equipo.brand, equipo.series && `SN ${equipo.series}`].filter(Boolean).join(' · ')

watch(equipments, (val) => { emit('update-list', val) }, { deep: true })

// La salida y la devolucion pactada se repiten del ultimo agregado: un alquiler suele salir y volver junto.
function agregar(equipo) {
  if (!equipo) return
  const anterior = equipments.value.findLast(e => e.modo === 'nuevo')
  const fila = {
    modo: 'nuevo',
    equipment_id: equipo.id,
    internal_id: equipo.internal_id,
    name: equipo.name,
    series: equipo.series,
    departure_date: anterior?.departure_date ?? null,
    expected_return_date: anterior?.expected_return_date ?? null,
    delivery_notes: '',
  }
  equipments.value.push(fila)
  elegida.value = fila
  nextTick(() => { buscado.value = null })
}

function cerrarPanel() {
  elegida.value = null
  opcionAbierta.value = null
  nextTick(() => buscador.value?.$el.querySelector('input')?.focus())
}

// Las lineas guardadas que se quitan de la lista salen de la orden al guardar.
const quitadas = ref([])

function borrarFila(indice) {
  const fila = equipments.value[indice]
  if (fila === elegida.value) elegida.value = null
  if (fila.modo === 'linea') quitadas.value.push(fila.id)
  equipments.value.splice(indice, 1)
}

function cargarFilas({ items }) {
  equipments.value = [...items]
}

// Las lineas de un alquiler guardado, para verlo y editarlo, sin las anuladas.
function cargarLineas(lineas) {
  quitadas.value = []
  equipments.value = lineas.filter(l => l.estado !== 'anulado').map(linea => ({
    modo: 'linea',
    id: linea.id,
    equipment_id: linea.equipment,
    internal_id: linea.equipment_internal_id,
    name: linea.equipment_name,
    series: linea.equipment_series,
    departure_date: linea.departure_date,
    expected_return_date: linea.expected_return_date,
    actual_return_date: linea.actual_return_date,
    delivery_notes: linea.delivery_notes,
    estado: linea.estado,
  }))
}

// Lo que manda el alquiler editado: de las lineas guardadas solo lo que se corrige.
function paraGuardar() {
  const items = equipments.value.map(({ modo, id, equipment_id, departure_date, expected_return_date,
    delivery_notes }) => (modo === 'linea'
    ? { id, expected_return_date, delivery_notes }
    : { equipment_id, departure_date, expected_return_date, delivery_notes }))
  return { items, quitar: quitadas.value }
}

// Un alquiler no toma numeros de certificado.
const estimados = () => equipments.value.map(() => null)

defineExpose({ cargarFilas, cargarLineas, paraGuardar, marcarErrores, estimados })
</script>
