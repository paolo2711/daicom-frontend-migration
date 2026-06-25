<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="850px" persistent>
    <v-card v-if="equipment" class="rounded-lg">
      
      <base-modal-header
        :title="`HISTORIAL DE VIAJES: ${equipment.internal_id}`"
        icon="mdi-truck-fast"
        @close="dialog = false"
      >
        <v-chip color="primary" variant="outlined" size="small" class="font-weight-bold">
          {{ equipment.brand }} {{ equipment.model }}
        </v-chip>
      </base-modal-header>

      <v-card-text class="pa-4" style="min-height: 350px;">
        <v-table density="compact" class="elevation-1 rounded-lg" style="border: 1px solid var(--v-border-color, #e0e0e0);">
          <thead>
            <tr :class="isDark ? 'bg-grey-darken-3' : 'bg-grey-lighten-3'">
              <th class="text-left font-weight-bold text-uppercase">Nro Orden</th>
              <th class="text-left font-weight-bold text-uppercase">Cliente</th>
              <th class="text-center font-weight-bold text-uppercase">Salida</th>
              <th class="text-center font-weight-bold text-uppercase">Retorno Real</th>
              <th class="text-center font-weight-bold text-uppercase">Estado Viaje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in equipment.rental_history" :key="h.id">
              <td class="font-weight-medium">{{ h.order_number }}</td>
              <td>{{ h.client_name }}</td>
              <td class="text-center">{{ h.departure_date }}</td>
              <td class="text-center" :class="h.actual_return_date ? 'text-green font-weight-bold' : ''">{{ h.actual_return_date || 'En ruta...' }}</td>
              <td class="text-center">
                <v-chip size="x-small" :color="h.return_status === 2 ? 'success' : 'amber-darken-3'" variant="flat" class="text-white">
                  {{ h.return_status === 2 ? 'DEVUELTO' : 'EN OBRA' }}
                </v-chip>
              </td>
            </tr>
            <tr v-if="!equipment.rental_history || equipment.rental_history.length === 0">
              <td colspan="5" class="text-center py-8 text-grey">
                <v-icon size="large" color="grey-lighten-2">mdi-history</v-icon><br>
                El equipo no registra movimientos históricos.
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const dialog = ref(false)
const equipment = ref(null)

const open = (item) => {
  equipment.value = item
  dialog.value = true
}

defineExpose({ open })
</script>