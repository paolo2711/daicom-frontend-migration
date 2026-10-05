<template>
  <v-card flat tile color="transparent">
    <v-toolbar density="compact" flat color="transparent" class="pl-3">
      <v-icon start :color="isDark ? 'amber-darken-2' : 'amber-darken-3'" class="mr-2">mdi-truck-delivery</v-icon>
      <span class="text-subtitle-2 font-weight-bold" :class="isDark ? 'text-amber-lighten-2' : 'text-amber-darken-4'">
        Equipos en este Alquiler
      </span>
      <span v-if="order.created_at" class="text-caption text-medium-emphasis ml-3 mt-1 font-weight-medium d-flex align-center">
        <v-icon size="x-small" class="mr-1">mdi-calendar-blank</v-icon>
        {{ fechaCorta(order.created_at) }}
      </span>
      <v-spacer />
      <v-btn size="x-small" color="amber-darken-3" variant="flat" class="text-white" @click="emit('add-rental')" :disabled="anulada">
        <v-icon start size="x-small">mdi-plus</v-icon> Añadir Equipo Extra
      </v-btn>
    </v-toolbar>

    <div v-if="order.rentals === null" class="pa-6 text-center">
      <v-progress-circular indeterminate color="amber-darken-3" size="32" />
      <div class="text-caption mt-2 text-medium-emphasis">Cargando equipos...</div>
    </div>

    <v-table v-else density="compact" :hover="false" class="bg-transparent">
      <thead>
        <tr class="bg-transparent">
          <th class="text-overline">ID INVENTARIO</th>
          <th class="text-overline">EQUIPO Y OBSERVACIONES</th>
          <th class="text-overline">SERIE</th>
          <th class="text-center text-overline">{{ FECHAS_ALQUILER.departure_date }}</th>
          <th class="text-center text-overline">{{ FECHAS_ALQUILER.expected_return_date }}</th>
          <th class="text-center text-overline">{{ FECHAS_ALQUILER.actual_return_date }}</th>
          <th class="text-center text-overline">ESTADO</th>
          <th class="text-center text-overline"><v-icon size="small">mdi-dots-vertical</v-icon></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="linea in filas" :key="linea.id"
            :class="{ 'fila-anulada': linea.estado === 'anulado', 'fila-en-menu': estaEnElMenu(linea) }"
            @contextmenu="alClickDerecho($event, { item: linea })">
          <td><strong>{{ linea.equipment_internal_id }}</strong></td>
          <td>
            <div class="font-weight-medium">{{ linea.equipment_name }}</div>
            <div v-if="linea.delivery_notes" class="text-caption text-medium-emphasis">
              <v-icon size="x-small" color="grey">mdi-message-text-outline</v-icon>
              {{ linea.delivery_notes }}
            </div>
          </td>
          <td>{{ linea.equipment_series || '—' }}</td>
          <td class="text-center" :class="{ 'text-medium-emphasis': !linea.departure_date }">
            {{ salidaDe(linea) }}
          </td>
          <td class="text-center" :class="{ 'text-medium-emphasis': !linea.expected_return_date }">
            {{ fechaCorta(linea.expected_return_date) || '—' }}
          </td>
          <td class="text-center" :class="linea.actual_return_date ? 'text-success font-weight-bold' : 'text-medium-emphasis'">
            {{ fechaCorta(linea.actual_return_date) || '—' }}
          </td>
          <td class="text-center">
            <v-chip size="x-small" :color="linea.presentacion.color" variant="outlined" label>
              {{ linea.presentacion.texto }}
            </v-chip>
            <div v-if="linea.duracion" class="text-caption text-medium-emphasis mt-1" style="line-height: 1;">
              {{ linea.duracion }}
            </div>
          </td>
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

    <action-menu :menu="menu" :acciones="accionesDe(menu.filas)"
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
import { useContextMenu } from '@/composables/useContextMenu'
import { accionesPara } from '@/utils/actions'
import AddEquipment from '@/views/inventory/components/AddEquipment.vue'
import { useTheme } from 'vuetify'
import OrderDataService from '@/services/orders/orderDataService'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import { ESTADOS_ALQUILER, FECHAS_ALQUILER, duracionDe, salidaDe } from '@/utils/orders/alquiler'
import { fechaCorta } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'

const props = defineProps({
  order: { type: Object, required: true },
})

const emit = defineEmits(['add-rental', 'reload'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const gestionarRef = ref(null)
const addEquipmentRef = ref(null)

const ANULADA = 4
const anulada = computed(() => props.order.status === ANULADA)

const filas = computed(() => (props.order.rentals || []).map(linea => ({
  ...linea,
  presentacion: ESTADOS_ALQUILER[linea.estado],
  duracion: duracionDe(linea),
})))

// Lo que se puede hacer con un equipo del alquiler. Las lineas no se marcan:
// el menu es de la que se toco.
const ACCIONES_LINEA = [
  {
    clave: 'ver', grupo: 'ver', varios: false,
    icono: 'mdi-eye', texto: 'Ver equipo',
    disponible: () => true,
  },
  {
    clave: 'gestionar', grupo: 'trabajo', varios: false,
    icono: 'mdi-calendar-edit', texto: 'Salida, devolución y fechas',
    disponible: ([linea]) => linea.estado !== 'anulado',
  },
  {
    clave: 'quitar', grupo: 'peligro', varios: false,
    icono: 'mdi-minus-circle-outline', texto: 'Quitar de la orden',
    disponible: ([linea]) => linea.estado === 'reservado' && !anulada.value,
  },
]
const accionesDe = (lineas) => accionesPara(ACCIONES_LINEA, lineas, () => true)

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu()

function ejecutarAccion (clave, [linea]) {
  if (clave === 'ver') return verEquipo(linea)
  if (clave === 'gestionar') return gestionarRef.value?.open(linea)
  if (clave === 'quitar') return quitar(linea)
}

async function verEquipo(linea) {
  try {
    const { data } = await InventoryDataService.get(linea.equipment)
    addEquipmentRef.value?.open(data)
  } catch {
    $swal.fire('Error', 'No se pudo cargar la información del equipo.', 'error')
  }
}

async function quitar(linea) {
  const { isConfirmed } = await $swal.fire({
    title: `¿Quitar ${linea.equipment_internal_id} de la orden?`,
    text: 'Todavía no salió: vuelve a estar disponible en el inventario.',
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
</style>
