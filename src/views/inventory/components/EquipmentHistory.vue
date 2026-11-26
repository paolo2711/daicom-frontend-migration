<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="53.125rem" persistent>
    <v-card v-if="equipo" class="rounded-lg">
      <base-modal-header title="Historial de viajes" icon="mdi-truck-fast" @close="dialog = false">
        {{ subtitulo }}
      </base-modal-header>

      <v-card-text class="cuerpo pa-4">
        <v-table v-if="equipo.rental_history?.length" density="compact" fixed-header class="tabla-mejorada viajes">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Cliente</th>
              <th class="text-center text-no-wrap">{{ FECHAS_ALQUILER.departure_date }}</th>
              <th class="text-center text-no-wrap">{{ FECHAS_ALQUILER.actual_return_date }}</th>
              <th class="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="viaje in equipo.rental_history" :key="viaje.id">
              <td class="text-no-wrap">
                <v-btn v-if="puedeVerOrdenes" variant="text" density="compact" class="text-none px-1"
                       append-icon="mdi-open-in-new" title="Ver en Alquileres" @click="irAOrden(viaje)">
                  {{ viaje.order_number }}
                </v-btn>
                <span v-else>{{ viaje.order_number }}</span>
              </td>
              <td>{{ viaje.client_name }}</td>
              <td class="text-center text-no-wrap">{{ fechaCorta(viaje.departure_date) || '—' }}</td>
              <td class="text-center text-no-wrap">{{ fechaCorta(viaje.actual_return_date) || '—' }}</td>
              <td class="text-center text-no-wrap">{{ ESTADOS_ALQUILER[viaje.estado].texto }}</td>
            </tr>
          </tbody>
        </v-table>
        <p v-else class="text-body-2 text-medium-emphasis text-center my-auto">Este equipo todavía no salió en un alquiler.</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { usePermissions } from '@/composables/usePermissions'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import { fechaCorta } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { ESTADOS_ALQUILER, FECHAS_ALQUILER } from '@/utils/orders/alquiler'

// La vista de Ordenes (2) del menu: sin ella, el numero de la orden no lleva a Alquileres.
const VISTA_ORDENES = 2

const router = useRouter()
const { hasView } = usePermissions()
const puedeVerOrdenes = hasView(VISTA_ORDENES)

const dialog = ref(false)
const equipo = ref(null)

const subtitulo = computed(() => [equipo.value.internal_id, equipo.value.name,
  [equipo.value.brand, equipo.value.model].filter(Boolean).join(' ')].filter(Boolean).join(' · '))

async function open(id) {
  try {
    equipo.value = (await InventoryDataService.get(id)).data
    dialog.value = true
  } catch (error) {
    Swal.fire('No se abrió el historial', mensajeDeError(error, 'Intenta de nuevo.'), 'error')
  }
}

// Alquileres con esa orden ya buscada.
const irAOrden = (viaje) => {
  dialog.value = false
  router.push({ name: 'orders-rental', query: { buscar_orden: viaje.order_number } }).catch(() => {})
}

defineExpose({ open })
</script>

<style scoped>
/* Mide lo mismo con uno o con veinte viajes: los que no entran se desplazan bajo el encabezado. */
.cuerpo { display: flex; flex-direction: column; height: 22rem; }
.viajes { max-height: 100%; min-height: 0; }
</style>
