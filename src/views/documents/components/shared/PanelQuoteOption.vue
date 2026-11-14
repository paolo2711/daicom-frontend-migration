<template>
  <detail-panel :titulo="TITULOS[clave]" @cerrar="emit('cerrar')">
    <v-textarea v-if="clave === 'intro'" v-model="quote.intro_text" label="Texto de entrada" rows="4" auto-grow
                v-bind="CAMPO" />

    <template v-else-if="clave === 'observaciones'">
      <div class="text-caption text-medium-emphasis">Solo salen en el PDF si agrega alguna.</div>
      <text-list-field v-model="quote.observations" texto-agregar="Añadir observación" :maxlength="LIMITES.observacion" />
    </template>

    <template v-else-if="clave === 'pago'">
      <div class="text-caption text-medium-emphasis">Sale en el bloque de pago, debajo de las cuentas bancarias.</div>
      <v-textarea v-model="quote.payment_note" label="Indicación de pago" rows="3" auto-grow v-bind="CAMPO" />
    </template>

    <template v-else>
      <section v-for="(categoria, i) in quote.terms" :key="i" class="seccion">
        <div class="d-flex align-center ga-1">
          <v-text-field v-model="categoria.title" label="Categoría" class="font-weight-bold" v-bind="CAMPO" />
          <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" title="Quitar la categoría"
                 @click="quote.terms.splice(i, 1)" />
        </div>
        <text-list-field v-model="categoria.items" texto-agregar="Añadir cláusula" />
      </section>
      <v-btn variant="outlined" prepend-icon="mdi-plus" class="align-self-start"
             @click="quote.terms.push({ title: '', items: [''] })">Añadir categoría</v-btn>
    </template>
  </detail-panel>
</template>

<script setup>
// Lo que acompaña a los items de la cotizacion o valorizacion, abierto a la derecha desde Opciones.
import DetailPanel from '@/components/shared/DetailPanel.vue'
import TextListField from '@/components/shared/TextListField.vue'
import { LIMITES } from '@/utils/documents/quoteDefaults'
import { CAMPO } from '@/utils/fields'

defineProps({ clave: { type: String, required: true } })
const quote = defineModel('quote', { type: Object, required: true })
const emit = defineEmits(['cerrar'])

const TITULOS = { intro: 'Texto de entrada', observaciones: 'Observaciones', pago: 'Indicación de pago',
                  terminos: 'Términos y condiciones' }
</script>
