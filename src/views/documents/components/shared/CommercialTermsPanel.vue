<template>
  <div>
    <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mb-1">Texto de entrada</div>
    <v-textarea v-model="quote.intro_text" rows="1" auto-grow density="compact" variant="outlined" hide-details="auto" />

    <v-divider class="my-4" />

    <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mb-1">Observaciones</div>
    <div class="text-caption text-medium-emphasis mb-2">Solo salen en el PDF si agrega alguna.</div>
    <text-list-field v-model="quote.observations" texto-agregar="Añadir observación" :maxlength="LIMITES.observacion" />

    <v-divider class="my-4" />

    <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mb-1">Indicación de pago</div>
    <div class="text-caption text-medium-emphasis mb-2">Sale en el bloque de pago, debajo de las cuentas bancarias.</div>
    <v-textarea v-model="quote.payment_note" rows="1" auto-grow density="compact" variant="outlined" hide-details="auto" />

    <v-divider class="my-4" />

    <div class="d-flex align-center mb-2">
      <div class="text-subtitle-2 font-weight-bold text-medium-emphasis">Términos y condiciones</div>
      <v-spacer />
      <v-btn variant="text" color="primary" size="small" prepend-icon="mdi-plus"
             @click="quote.terms.push({ title: '', items: [''] })">
        Añadir categoría
      </v-btn>
    </div>

    <v-card v-for="(categoria, i) in quote.terms" :key="i" variant="flat" class="border rounded-lg pa-3 mb-3">
      <div class="d-flex align-center ga-1 mb-2">
        <v-text-field v-model="categoria.title" label="Categoría" density="compact" variant="outlined"
                      hide-details="auto" class="font-weight-bold" />
        <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click="quote.terms.splice(i, 1)" />
      </div>
      <text-list-field v-model="categoria.items" texto-agregar="Añadir cláusula" />
    </v-card>
  </div>
</template>

<script setup>
import TextListField from '@/components/shared/TextListField.vue'
import { LIMITES } from '@/utils/documents/quoteDefaults'

const quote = defineModel('quote', { type: Object, required: true })
</script>
