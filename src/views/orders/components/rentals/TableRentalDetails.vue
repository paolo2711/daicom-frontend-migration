<template>
  <v-card flat class="recuadro-equipos border rounded-lg bg-surface mx-3 mt-1 mb-3">
    <v-toolbar density="compact" flat color="transparent" class="pl-3">
      <v-icon start :color="isDark ? 'amber-darken-2' : 'amber-darken-3'" class="mr-2">mdi-truck-delivery</v-icon>
      <span class="text-subtitle-2 font-weight-bold" :class="isDark ? 'text-amber-lighten-2' : 'text-amber-darken-4'">
        Equipos<template v-if="order.rentals"> ({{ filas.length }})</template>
      </span>
      <span class="text-caption text-medium-emphasis ml-3">{{ resumenPorEstado(filas) }}</span>
      <span v-if="muestraFecha && order.created_at" class="text-caption text-medium-emphasis ml-3 mt-1 font-weight-medium d-flex align-center">
        <v-icon size="x-small" class="mr-1">mdi-calendar-blank</v-icon>
        {{ fechaCorta(order.created_at) }}
      </span>
      <v-spacer />
      <v-btn size="x-small" color="amber-darken-3" variant="flat" class="text-white" :disabled="anulada"
             @click="emit('editar')">
        <v-icon start size="x-small">mdi-pencil</v-icon> Ver y editar
      </v-btn>
    </v-toolbar>

    <div v-if="order.rentals === null" class="pa-6 text-center">
      <v-progress-circular indeterminate color="amber-darken-3" size="32" />
      <div class="text-caption mt-2 text-medium-emphasis">Cargando equipos...</div>
    </div>

    <v-table v-else density="compact" :hover="false" class="bg-transparent">
      <thead>
        <tr class="bg-transparent">
          <th class="columna-foto"></th>
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
            :class="{ 'fila-anulada': linea.estado === 'anulado', 'fila-en-menu': estaEnElMenu(linea) }"
            @contextmenu="alClickDerecho($event, { item: linea })">
          <td>
            <equipment-photo :foto="linea.equipment_data.foto" class="cursor-pointer" title="Ver fotos"
                             @click="verEquipo(linea, 0, true)" />
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
          <td colspan="8" class="text-center text-medium-emphasis py-6 font-weight-medium">
            No se encontraron equipos en este alquiler.
          </td>
        </tr>
      </tbody>
    </v-table>

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />

    <dialog-gestionar-alquiler ref="gestionarRef" />

    <add-equipment ref="addEquipmentRef" @saved="emit('reload')" />
  </v-card>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { computed, getCurrentInstance, ref } from 'vue'
import DialogGestionarAlquiler from './DialogGestionarAlquiler.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import EquipmentCertificate from '@/components/shared/EquipmentCertificate.vue'
import EquipmentCode from '@/components/shared/EquipmentCode.vue'
import EquipmentPhoto from '@/components/shared/EquipmentPhoto.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { accionesPara } from '@/utils/actions'
import AddEquipment from '@/views/inventory/components/AddEquipment.vue'
import { useTheme } from 'vuetify'
import OrderDataService from '@/services/orders/orderDataService'
import { ESTADOS_ALQUILER, FECHAS_ALQUILER, resumenPorEstado } from '@/utils/orders/alquiler'
import { viva } from '@/utils/orders/estado'
import { fechaCorta } from '@/utils/dates'
import { datosDelEquipo } from '@/utils/equipments/datos'
import { mensajeDeError } from '@/utils/errors'

const props = defineProps({
  order: { type: Object, required: true },
  // Sin la columna de fecha en la lista, va aca.
  muestraFecha: { type: Boolean, default: true },
})

const emit = defineEmits(['editar', 'reload'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const gestionarRef = ref(null)
const addEquipmentRef = ref(null)

const anulada = computed(() => !viva(props.order))

const filas = computed(() => props.order.rentals || [])
const detalleDe = ({ equipment_data: equipo }) => datosDelEquipo(equipo.brand, equipo.model, equipo.series && `SN ${equipo.series}`)

// Lo que se puede hacer con un equipo del alquiler. Las lineas no se marcan:
// el menu es de la que se toco.
const ACCIONES_LINEA = [
  {
    clave: 'ver', grupo: 'ver', varios: false,
    icono: 'mdi-eye', texto: 'Ver equipo',
  },
  {
    clave: 'gestionar', grupo: 'trabajo', varios: false,
    icono: 'mdi-calendar-edit', texto: 'Inicio, devolución y fechas',
    visible: ([linea]) => linea.estado !== 'anulado',
  },
  // Lo que esta en obra no se quita: se devuelve.
  {
    clave: 'quitar', grupo: 'peligro', varios: false,
    icono: 'mdi-minus-circle-outline', texto: 'Quitar de la orden',
    visible: ([linea]) => linea.estado === 'reservado' && !anulada.value,
  },
]
const accionesDe = (lineas) => accionesPara(ACCIONES_LINEA, lineas, () => true)

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(filas)

function ejecutarAccion (clave, [linea]) {
  if (clave === 'ver') return verEquipo(linea)
  if (clave === 'gestionar') return gestionarRef.value?.open(linea)
  if (clave === 'quitar') return quitar(linea)
}

// `pestana` y `fotos`, como en Inventario.
const verEquipo = (linea, pestana = 0, fotos = false) => addEquipmentRef.value?.open(linea.equipment, pestana, fotos)

async function quitar(linea) {
  const { isConfirmed } = await $swal.fire({
    title: `¿Quitar ${linea.equipment_data.internal_id} de la orden?`,
    text: 'Vuelve a estar disponible en el inventario.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, quitar',
    cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return
  try {
    await OrderDataService.deleteRental(linea.id)
    Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo quitado' })
  } catch (error) {
    $swal.fire('No se quitó el equipo', mensajeDeError(error, 'No se pudo quitar el equipo.'), 'error')
  }
}
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
/* Lo justo para la foto: el resto del ancho es para los datos. */
.columna-foto {
  width: 1%;
}
</style>
