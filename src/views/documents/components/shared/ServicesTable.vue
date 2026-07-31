<template>
  <v-card variant="flat" class="pa-2 bg-surface">
    
    <div class="d-flex align-center mb-3">
      <div class="text-subtitle-1 font-weight-bold text-primary">
        <v-icon size="small" class="mr-1">mdi-format-list-numbered</v-icon> Detalle de Servicios
      </div>
      <v-spacer />
      <v-btn color="primary" variant="flat" density="compact" prepend-icon="mdi-plus" @click="addItem">
        AÑADIR SERVICIO
      </v-btn>
    </div>

    <v-table density="compact" class="tabla-mejorada border rounded-lg mb-3">
      <thead :class="$vuetify.theme.current.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'">
        <tr>
          <th width="50" class="text-center font-weight-bold">Item</th>
          <th width="90" class="text-center font-weight-bold">Cant.</th>
          <th width="100" class="text-center font-weight-bold">Und.</th>
          <th class="text-left font-weight-bold">Descripción del Servicio</th>
          <th width="130" class="text-right font-weight-bold">V. Unitario</th>
          <th width="130" class="text-right font-weight-bold">V. Total</th>
          <th width="60" class="text-center font-weight-bold">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="items.length === 0">
          <td colspan="7" class="text-center text-medium-emphasis py-4">
            No hay servicios agregados. Haga clic en "Añadir Servicio".
          </td>
        </tr>
        
        <tr v-for="(row, index) in items" :key="index">
          <td class="text-center font-weight-bold text-grey-darken-1">{{ index + 1 }}</td>
          <td class="py-1">
            <v-text-field v-model.number="row.quantity" type="number" min="1" density="compact" variant="outlined" hide-details class="text-center" @input="calcularFila(row)" />
          </td>
          <td class="py-1">
            <v-select v-model="row.unit" :items="['und', 'serv', 'glb', 'dias']" density="compact" variant="outlined" hide-details />
          </td>
          <td class="py-1">
            <v-text-field v-model="row.description" density="compact" variant="outlined" hide-details placeholder="Ej: Servicio de calibración de Vernier" />
            <!-- Observación vinculada estrictamente al item -->
            <v-text-field v-model="row.observations" density="compact" variant="underlined" hide-details class="mt-1 text-caption text-grey" placeholder="Observación específica de este ítem (Opcional)" />
          </td>
          <td class="py-1">
            <v-text-field v-model.number="row.unit_price" type="number" min="0" density="compact" variant="outlined" hide-details class="text-right" @input="calcularFila(row)" />
          </td>
          <td class="text-right font-weight-bold text-primary align-middle">
            {{ currencySymbol }} {{ (row.row_total || 0).toFixed(2) }}
          </td>
          <td class="text-center">
            <v-btn icon variant="text" size="small" color="error" @click="removeItem(index)">
              <v-icon size="small">mdi-delete-outline</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-flex justify-end">
      <div style="width: 250px;">
        <div class="d-flex justify-space-between mb-1">
          <span class="text-subtitle-2 text-medium-emphasis">Subtotal:</span>
          <span class="text-subtitle-2">{{ currencySymbol }} {{ (totals.subtotal || 0).toFixed(2) }}</span>
        </div>
        <div class="d-flex justify-space-between mb-1">
          <span class="text-subtitle-2 text-medium-emphasis">IGV ({{ totals.igv_percent }}%):</span>
          <span class="text-subtitle-2">{{ currencySymbol }} {{ (totals.igv || 0).toFixed(2) }}</span>
        </div>
        <v-divider class="my-2"></v-divider>
        <div class="d-flex justify-space-between align-center">
          <span class="text-subtitle-1 font-weight-bold">Total General:</span>
          <span class="text-h6 font-weight-bold text-primary">{{ currencySymbol }} {{ (totals.total || 0).toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: Array,
  totals: Object,
  currency: String
})

const currencySymbol = computed(() => props.currency === 'USD' ? '$' : 'S/')

const addItem = () => {
  props.items.push({
    item: props.items.length + 1,
    is_note_row: false,
    description: "",
    quantity: 1,
    unit: "und",
    unit_price: 0.00,
    row_total: 0.00,
    observations: null
  })
  recalcularTodo()
}

const removeItem = (index) => {
  props.items.splice(index, 1)
  // Reordenar los índices
  props.items.forEach((row, i) => { row.item = i + 1 })
  recalcularTodo()
}

const calcularFila = (row) => {
  const qty = parseFloat(row.quantity) || 0
  const price = parseFloat(row.unit_price) || 0
  row.row_total = qty * price
  recalcularTodo()
}

const recalcularTodo = () => {
  let sub = 0
  props.items.forEach(row => { sub += (row.row_total || 0) })
  
  props.totals.subtotal = sub
  props.totals.igv = sub * (props.totals.igv_percent / 100)
  props.totals.total = props.totals.subtotal + props.totals.igv
}
</script>