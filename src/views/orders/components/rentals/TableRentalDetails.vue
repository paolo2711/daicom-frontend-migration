<template>
  <v-card flat class="recuadro-equipos border rounded-lg bg-surface mx-3 mt-1 mb-3">
    <v-toolbar density="compact" flat color="transparent" class="pl-3">
      <v-icon start color="primary">mdi-truck-delivery</v-icon>
      <span class="text-subtitle-2 font-weight-bold">Equipos</span>
      <span v-if="muestraFecha && order.created_at" class="text-caption text-medium-emphasis ml-3 mt-1 font-weight-medium d-flex align-center">
        <v-icon size="x-small" class="mr-1">mdi-calendar-blank</v-icon>
        {{ fechaCorta(order.created_at) }}
      </span>
      <v-spacer />
      <v-btn size="x-small" color="primary" variant="flat" class="text-white" :disabled="anulada" @click="emit('editar')">
        <v-icon start size="x-small">mdi-pencil</v-icon> Ver y editar
      </v-btn>
    </v-toolbar>

    <div v-if="order.rentals === null" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" size="32" />
      <div class="text-caption mt-2 text-medium-emphasis">Cargando equipos...</div>
    </div>

    <v-table v-else density="compact" :hover="false" class="bg-transparent">
      <thead>
        <tr class="bg-transparent">
          <th class="columna-corta pr-0">
            <v-checkbox-btn density="compact" :disabled="!marcables.length"
                            :model-value="todasMarcadas" :indeterminate="algunasMarcadas"
                            @update:model-value="marcarTodas" />
          </th>
          <th class="columna-corta"></th>
          <th class="text-overline">CÓDIGO</th>
          <th class="text-overline">EQUIPO</th>
          <th class="text-overline">CERTIFICADO</th>
          <th class="text-center text-overline">{{ FECHAS_ALQUILER.departure_date }}</th>
          <th class="text-center text-overline">{{ FECHAS_ALQUILER.actual_return_date }}</th>
          <th class="text-center text-overline">DÍAS</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="linea in filas" :key="linea.id"
            :class="{ 'fila-anulada': linea.estado === 'anulado', 'fila-en-menu': estaEnElMenu(linea),
                      'cursor-pointer': esMarcable(linea) }"
            @click="alClicFila($event, linea)"
            @contextmenu="alClickDerecho($event, { item: linea })">
          <td class="columna-corta pr-0">
            <v-checkbox-btn density="compact" :disabled="!esMarcable(linea)"
                            :model-value="estaMarcada(linea)" @update:model-value="alternar(linea)" />
          </td>
          <td>
            <equipment-photo :foto="linea.equipment_data.foto" class="cursor-pointer" title="Ver fotos"
                             @click.stop="verEquipo(linea, 0, true)" />
          </td>
          <td><equipment-code :codigo="linea.equipment_data.internal_id" :estado="ESTADOS_ALQUILER[linea.estado]" /></td>
          <td>
            <div class="font-weight-medium">{{ linea.equipment_data.name }}</div>
            <div v-if="detalleDe(linea)" class="text-caption text-medium-emphasis">{{ detalleDe(linea) }}</div>
            <div v-if="linea.delivery_notes" class="text-caption text-medium-emphasis">{{ linea.delivery_notes }}</div>
          </td>
          <td>
            <equipment-certificate :certificado="linea.equipment_data.latest_certificate" @abrir="verEquipo(linea, 1)" />
          </td>
          <td class="text-center" :class="{ 'text-medium-emphasis': !linea.departure_date }">
            {{ fechaCorta(linea.departure_date) || '—' }}
          </td>
          <td class="text-center" :class="{ 'text-medium-emphasis': !linea.actual_return_date }">
            {{ fechaCorta(linea.actual_return_date) || '—' }}
          </td>
          <td class="text-center" :class="{ 'text-medium-emphasis': !linea.dias }">{{ linea.dias ?? '—' }}</td>
          <td class="text-center">
            <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" size="x-small" color="grey-darken-1"
                   @click.stop="alBotonDeFila($event, linea)" />
          </td>
        </tr>
        <tr v-if="filas.length === 0">
          <td colspan="9" class="text-center text-medium-emphasis py-6 font-weight-medium">
            No se encontraron equipos en este alquiler.
          </td>
        </tr>
      </tbody>
    </v-table>

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />

    <selection-bar :count="seleccion.length" label="equipo(s)" :acciones="accionesDe(seleccion)"
                   @accion="clave => ejecutarAccion(clave, seleccion)" @clear="seleccion = []" />

    <batch-action-dialog ref="pasoRef" :acciones="PASOS" :columnas="['Código', 'Equipo']" :al-confirmar="darPaso"
                         @hecha="soltarEquipos">
      <template #celdas="{ fila }">
        <td class="font-weight-medium text-no-wrap">{{ fila.equipment_data.internal_id }}</td>
        <td class="text-caption">
          <div>{{ fila.equipment_data.name }}</div>
          <div class="text-medium-emphasis">{{ detalleDe(fila) }}</div>
        </td>
      </template>
    </batch-action-dialog>

    <add-equipment ref="addEquipmentRef" @saved="emit('reload')" />
  </v-card>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { computed, ref } from 'vue'
import { PASOS } from './batchActions'
import SelectionBar from '@/components/commonComponents/SelectionBar.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import BatchActionDialog from '@/components/shared/BatchActionDialog.vue'
import EquipmentCertificate from '@/components/shared/EquipmentCertificate.vue'
import EquipmentCode from '@/components/shared/EquipmentCode.vue'
import EquipmentPhoto from '@/components/shared/EquipmentPhoto.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { soltar } from '@/composables/useCurrentRows'
import { useRowSelection } from '@/composables/useRowSelection'
import { accionesPara } from '@/utils/actions'
import AddEquipment from '@/views/inventory/components/AddEquipment.vue'
import OrderDataService from '@/services/orders/orderDataService'
import { ACCIONES_ALQUILER, ESTADOS_ALQUILER, FECHAS_ALQUILER } from '@/utils/orders/alquiler'
import { viva } from '@/utils/orders/estado'
import { fechaCorta } from '@/utils/dates'
import { datosDelEquipo } from '@/utils/equipments/datos'

const props = defineProps({
  order: { type: Object, required: true },
  // Sin la columna de fecha en la lista, va aca.
  muestraFecha: { type: Boolean, default: true },
})

const emit = defineEmits(['editar', 'reload'])

// La guarda la pantalla de ordenes: marcar equipos y marcar ordenes se excluyen.
const seleccion = defineModel('seleccion', { type: Array, required: true })

const pasoRef = ref(null)
const addEquipmentRef = ref(null)

const anulada = computed(() => !viva(props.order))

const filas = computed(() => props.order.rentals || [])
const detalleDe = ({ equipment_data: equipo }) => datosDelEquipo(equipo.brand, equipo.model, equipo.series && `SN ${equipo.series}`)

// En una orden anulada los equipos solo se ven.
const marcables = computed(() => (anulada.value ? [] : filas.value.filter(l => l.estado !== 'anulado')))
const { esMarcable, estaMarcada, todasMarcadas, algunasMarcadas, marcarTodas, alternar, alClicFila } =
  useRowSelection(marcables, seleccion)

const acciones = computed(() => (anulada.value ? ACCIONES_ALQUILER.filter(a => a.grupo === 'ver') : ACCIONES_ALQUILER))
const accionesDe = (lineas) => accionesPara(acciones.value, lineas, () => true)

// El menu de una marcada es de todas las marcadas; el de otra, solo de esa y sin marcarla.
const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(filas, seleccion, { marca: false })

function ejecutarAccion (clave, lineas) {
  if (clave === 'ver') return verEquipo(lineas[0])
  pasoRef.value?.open(clave, lineas)
}

const soltarEquipos = (lineas) => soltar(seleccion, lineas)

async function darPaso (lineas, { clave, fecha }) {
  await OrderDataService.darPasoDeAlquiler(lineas.map(l => l.id), clave, fecha)
  const cuantos = lineas.length > 1 ? `: ${lineas.length} equipos` : ''
  Toast.fire({ timer: 2400, icon: 'success', title: `${PASOS[clave].hecho}${cuantos}` })
}

// `pestana` y `fotos`, como en Inventario.
const verEquipo = (linea, pestana = 0, fotos = false) => addEquipmentRef.value?.open(linea.equipment, pestana, fotos)

</script>

<style scoped>
.text-overline {
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  color: #757575 !important;
}
.fila-anulada td {
  opacity: 0.6;
}
/* Lo justo para la casilla y la foto: el resto del ancho es para los datos. */
.columna-corta {
  width: 1%;
}
</style>
