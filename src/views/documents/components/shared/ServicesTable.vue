<template>
  <div>
    <div class="d-flex align-center mb-3">
      <div class="text-subtitle-1 font-weight-bold text-primary">
        <v-icon size="small" class="mr-1">mdi-format-list-numbered</v-icon> {{ tipo.etiquetaItems }}
      </div>
      <v-spacer />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="items.push(itemVacio(tipo.unidad))">
        Añadir ítem
      </v-btn>
    </div>

    <!-- En pantalla ancha cada servicio va en una linea, como tabla; en angosta
         los numeros bajan debajo de la descripcion. -->
    <div class="border rounded-lg">
      <v-row dense class="d-none d-md-flex px-3 py-2 ma-0 border-b-thin text-caption font-weight-bold text-medium-emphasis">
        <v-col md="5" class="pl-8">Descripción y comentario</v-col>
        <v-col md="1">Cant.</v-col>
        <v-col md="2">Unidad</v-col>
        <v-col md="2">P. unit.</v-col>
        <v-col md="2" class="text-right pr-10">Total</v-col>
      </v-row>

      <div v-if="!items.length" class="text-center text-medium-emphasis py-4">
        Sin ítems. Agregue uno con "Añadir ítem".
      </div>

      <div v-for="(fila, i) in items" :key="i" class="d-flex align-start px-3 py-2 border-b-thin"
           :class="{ 'fila-con-error': errores[i] }">
        <span class="text-medium-emphasis font-weight-bold pt-2 mr-3">{{ i + 1 }}</span>
        <v-row dense class="ma-0 flex-grow-1">
          <v-col cols="12" md="5">
            <v-textarea v-model="fila.description" :placeholder="tipo.ejemploItem"
                        :maxlength="LIMITES.descripcion" :counter="LIMITES.descripcion" rows="1" auto-grow
                        density="compact" variant="outlined" hide-details="auto" />
            <v-textarea v-model="fila.observations" placeholder="Comentario del ítem (opcional)"
                        :maxlength="LIMITES.comentario" :counter="LIMITES.comentario" rows="1" auto-grow
                        density="compact" variant="underlined" hide-details="auto" class="text-medium-emphasis" />
            <div v-if="errores[i]" class="text-caption text-error">{{ errores[i] }}</div>
          </v-col>
          <v-col cols="4" md="1">
            <v-text-field v-model.number="fila.quantity" type="number" min="1" :label="mdAndUp ? undefined : 'Cant.'"
                          density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="4" md="2">
            <v-select v-model="fila.unit" :items="UNIDADES" :label="mdAndUp ? undefined : 'Unidad'"
                      density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="4" md="2">
            <v-text-field v-model.number="fila.unit_price" type="number" min="0" :prefix="simboloDe(moneda)"
                          :label="mdAndUp ? undefined : 'P. unit.'" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="12" md="2" class="d-flex justify-end pt-md-3">
            <span class="font-weight-bold text-no-wrap">{{ monto(totalDeFila(fila), moneda) }}</span>
          </v-col>
        </v-row>
        <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" class="ml-1" @click="items.splice(i, 1)" />
      </div>
    </div>

    <v-row class="mt-2">
      <v-col cols="12" sm="6" md="4" class="ml-auto">
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span class="text-medium-emphasis">Subtotal</span><span>{{ monto(totales.subtotal, moneda) }}</span>
        </div>
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span class="text-medium-emphasis">IGV ({{ igv }} %)</span><span>{{ monto(totales.igv, moneda) }}</span>
        </div>
        <v-divider class="my-2" />
        <div class="d-flex justify-space-between align-center">
          <span class="font-weight-bold">Total</span>
          <span class="text-h6 font-weight-bold text-primary">{{ monto(totales.total, moneda) }}</span>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify'
import { LIMITES, UNIDADES, itemVacio, totalDeFila } from '@/utils/documents/quoteDefaults'
import { monto, simboloDe } from '@/utils/money'

// Sin la fila de titulos (pantalla angosta) cada numero lleva su etiqueta.
const { mdAndUp } = useDisplay()

// Los errores son los que el back marco por posicion al guardar.
const items = defineModel('items', { type: Array, required: true })

defineProps({
  totales: { type: Object, required: true },
  moneda: { type: String, default: 'PEN' },
  igv: { type: Number, default: 18 },
  errores: { type: Object, default: () => ({}) },
  // El de TIPOS_DE_COTIZACION: titulo, unidad por defecto y ejemplo.
  tipo: { type: Object, required: true },
})
</script>
