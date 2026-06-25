<template>
  <v-card flat tile color="transparent">
    <v-toolbar density="compact" flat color="transparent" class="pl-3">
      <v-icon start :color="isDark ? 'amber-darken-2' : 'amber-darken-3'" class="mr-2">mdi-truck-delivery</v-icon>
      <span class="text-subtitle-2 font-weight-bold" :class="isDark ? 'text-amber-lighten-2' : 'text-amber-darken-4'">
        Equipos en este Alquiler
      </span>
      <v-spacer />
      <v-btn size="x-small" color="amber-darken-3" variant="flat" class="text-white" @click="emit('add-rental')" :disabled="order.status === 4">
        <v-icon start size="x-small">mdi-plus</v-icon> Añadir Equipo Extra
      </v-btn>
    </v-toolbar>

    <v-table density="compact" :class="isDark ? 'bg-brown-darken-4' : 'bg-amber-lighten-5'">
      <thead>
        <tr :class="isDark ? 'bg-brown-darken-3' : 'bg-amber-lighten-4'">
          <th class="text-overline">ID INVENTARIO</th>
          <th class="text-overline">EQUIPO Y OBSERVACIONES</th>
          <th class="text-overline">SERIE</th>
          <th class="text-center text-overline">SALIDA</th>
          <th class="text-center text-overline">RETORNO PACTADO</th>
          <th class="text-center text-overline">RETORNO REAL</th>
          <th class="text-center text-overline">ESTADO</th>
          <th class="text-center text-overline"><v-icon size="small">mdi-dots-vertical</v-icon></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rental in order.rentals" :key="rental.id">
          <td><strong>{{ rental.equipment_internal_id }}</strong></td>
          <td>
            <div class="font-weight-medium">{{ rental.equipment_name }}</div>
            <div v-if="rental.delivery_notes" class="text-caption text-medium-emphasis">
              <v-icon size="x-small" color="grey">mdi-message-text-outline</v-icon>
              {{ rental.delivery_notes }}
            </div>
          </td>
          <td>{{ rental.equipment_series || '---' }}</td>
          <td class="text-center">{{ rental.departure_date }}</td>
          
          <td class="text-center font-weight-medium" :class="!rental.expected_return_date ? 'text-grey' : ''">
            {{ rental.expected_return_date || 'Sin fecha' }}
          </td>
          
          <td class="text-center font-weight-bold" :class="rental.actual_return_date ? 'text-green' : 'text-medium-emphasis'">
            {{ rental.actual_return_date || '---' }}
          </td>
          
          <td class="text-center">
            <v-chip size="x-small" :color="rental.return_status === 2 ? 'success' : 'blue-darken-1'"
                    class="text-white mb-1" variant="outlined" label>
              {{ rental.return_status === 2 ? 'DEVUELTO' : 'EN OBRA' }}
            </v-chip>
            
            <div v-if="rental.return_status === 2 && rental.actual_return_date" class="text-caption text-green-darken-2 font-weight-medium" style="line-height: 1;">
              Duró {{ calcularDias(rental.departure_date, rental.actual_return_date) }} días
            </div>
            
            <div v-if="rental.return_status !== 2" class="text-caption text-blue-darken-2 font-weight-medium" style="line-height: 1;">
              {{ calcularDias(rental.departure_date, null) }} días fuera
            </div>
          </td>
          
          <td class="text-center">
            <div class="d-flex justify-center align-center">
              <v-tooltip location="bottom" color="info">
                <template v-slot:activator="{ props }">
                  <v-btn icon size="x-small" variant="text" color="info" density="comfortable"
                         class="mx-1" v-bind="props"
                         @click="verEquipo(rental)">
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>Ver / Editar Equipo</span>
              </v-tooltip>

              <v-tooltip location="bottom" color="success">
                <template v-slot:activator="{ props }">
                  <v-btn icon size="x-small" variant="text" color="green" density="comfortable"
                         class="mx-1" v-bind="props"
                         @click="marcarDevuelto(rental)"
                         :disabled="rental.return_status === 2">
                    <v-icon>mdi-check-all</v-icon>
                  </v-btn>
                </template>
                <span>Marcar equipo como Devuelto</span>
              </v-tooltip>

              <v-tooltip location="bottom" color="primary">
                <template v-slot:activator="{ props }">
                  <v-btn icon size="x-small" variant="text" color="primary" density="comfortable"
                         class="mx-1" v-bind="props"
                         @click="abrirEditarFechas(rental)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Editar Fechas</span>
              </v-tooltip>
            </div>
          </td>
        </tr>
        <tr v-if="!order.rentals || order.rentals.length === 0">
          <td colspan="8" class="text-center text-medium-emphasis py-6 font-weight-medium">
            No se encontraron equipos en este alquiler.
          </td>
        </tr>
      </tbody>
    </v-table>
    
    <dialog-edit-rental-dates ref="dialogEditRef" @reload="emit('reload')" />
    
    <add-equipment ref="addEquipmentRef" @saved="emit('reload')" />
  </v-card>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'
import DialogEditRentalDates from './DialogEditRentalDates.vue'
import AddEquipment from '@/views/inventory/components/AddEquipment.vue'
import { useTheme } from 'vuetify'
import OrderDataService from '@/services/certificates/orderDataService'
import InventoryDataService from '@/services/inventory/inventoryDataService'

const props = defineProps({
  order: { type: Object, required: true },
})

const emit = defineEmits(['add-rental', 'reload'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const dialogEditRef = ref(null)
const addEquipmentRef = ref(null)

// --- NUEVA FUNCIÓN PARA ABRIR LA EDICIÓN DEL EQUIPO ---
async function verEquipo(rental) {
  try {
    // La FK suele venir como rental.equipment en el JSON de Django
    const equipoId = rental.equipment || rental.equipment_id; 
    
    if (!equipoId) {
      $swal.fire('Error', 'No se pudo detectar el ID del equipo en el registro.', 'error')
      return
    }

    // Traemos toda la info completa del backend (fotos, certificado, notas)
    const response = await InventoryDataService.get(equipoId)
    
    // Lo abrimos como si estuviéramos en la tabla de inventario
    addEquipmentRef.value?.open(response.data)
  } catch (error) {
    console.error(error)
    $swal.fire('Error', 'No se pudo cargar la información completa del equipo.', 'error')
  }
}

function abrirEditarFechas(rental) {
  dialogEditRef.value?.open(rental)
}

// Función para calcular los días transcurridos
function calcularDias(fechaSalida, fechaRetornoReal) {
  if (!fechaSalida) return 0;
  
  const salida = new Date(fechaSalida);
  // Si no hay fecha de retorno (En Obra), calcula hasta la fecha de hoy
  const fin = fechaRetornoReal ? new Date(fechaRetornoReal) : new Date();
  
  // Diferencia en milisegundos
  const diferenciaMs = fin - salida;
  
  // Convertir a días (1000 ms * 60 s * 60 m * 24 h)
  // Usamos Math.ceil para redondear hacia arriba (ej: si salió ayer en la tarde y vuelve hoy en la mañana, cuenta como 1 día)
  const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
  
  // Si los días son 0 (salió y volvió el mismo día), mostramos "1 día" por convención comercial, o "0 días" si así lo prefieres.
  return dias === 0 ? 1 : Math.max(1, dias); 
}

function marcarDevuelto(rental) {
  // Tomamos la fecha de hoy por defecto en formato YYYY-MM-DD
  const hoy = new Date().toISOString().substring(0, 10)

  $swal.fire({
    title: '¿Confirmar devolución?',
    html: `
      <p style="margin-bottom: 15px;">El equipo <b>${rental.equipment_internal_id}</b> volverá al inventario.</p>
      <div style="text-align: left;">
        <label for="swal-return-date" style="font-weight: bold; font-size: 0.9em; display:block; margin-bottom: 5px;">Fecha de retorno real:</label>
        <input type="date" id="swal-return-date" class="swal2-input" value="${hoy}" style="width: 100%; max-width: 100%; margin: 0; box-sizing: border-box;">
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, confirmar',
    cancelButtonText: 'Cancelar',
    showLoaderOnConfirm: true,
    preConfirm: () => {
      // Capturamos la fecha del input que inyectamos
      const fechaSeleccionada = document.getElementById('swal-return-date').value
      if (!fechaSeleccionada) {
        $swal.showValidationMessage('Debes seleccionar una fecha de retorno')
        return false
      }
      
      // Enviamos la fecha seleccionada al backend.
      // OJO: Tu servicio en Axios (OrderDataService.returnRental) debe estar 
      // configurado para recibir y enviar este payload: { actual_return_date: fechaSeleccionada }
      return OrderDataService.returnRental(rental.id, { actual_return_date: fechaSeleccionada }).catch(() => {
        $swal.showValidationMessage('Error en el servidor al devolver equipo')
      })
    }
  }).then((result) => {
    if (result.isConfirmed) {
      if (window.notificarActualizacionFila) {
        window.notificarActualizacionFila(null, props.order.id);
      }
      $swal.fire('Listo', 'Equipo devuelto y disponible en inventario', 'success')
    }
  })
}
</script>

<style scoped>
.text-overline {
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  color: #757575 !important;
}
</style>