<template>
  <detail-panel :titulo="`Ítem ${indice + 1}`" @cerrar="emit('cerrar')">
    <section class="seccion">
      <div class="titulo-de-seccion">Ítem</div>
      <catalog-description-field :fila="item" catalogo="equipos" campo="descripcion" desplegable
                                 placeholder="Descripción"
                                 :maxlength="LARGO_DE_LA_DESCRIPCION" />
      <v-textarea v-model="item.detalle" label="Detalle adicional" rows="1" no-resize class="crece-con-texto"
                  v-bind="CAMPO" />
    </section>

    <section class="seccion">
      <div class="titulo-de-seccion">Cantidad y peso</div>
      <v-row dense>
        <v-col cols="6">
          <v-text-field v-model.number="item.cantidad" type="number" min="1" label="Cantidad" v-bind="CAMPO" />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model="item.peso" type="number" min="0" label="Peso por unidad" suffix="kg" v-bind="CAMPO" />
        </v-col>
      </v-row>
    </section>

    <div v-if="error" class="text-caption text-error">{{ error }}</div>

    <template #pie>
      <v-spacer />
      <v-btn variant="text" color="red" prepend-icon="mdi-delete" @click="emit('borrar', indice)">Quitar</v-btn>
    </template>
  </detail-panel>
</template>

<script setup>
// Lo de un item de DialogDispatchGuide. La descripcion sugiere los equipos registrados y acepta cualquier texto.
import DetailPanel from '@/components/shared/DetailPanel.vue'
import { LARGO_DE_LA_DESCRIPCION } from '@/utils/billing/guias'
import { CAMPO } from '@/utils/fields'
import CatalogDescriptionField from '@/views/documents/components/shared/CatalogDescriptionField.vue'

defineProps({
  item: { type: Object, required: true },
  indice: { type: Number, required: true },
  error: { type: String, default: '' },
})
const emit = defineEmits(['cerrar', 'borrar'])
</script>
