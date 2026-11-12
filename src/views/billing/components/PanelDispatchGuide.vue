<template>
  <div class="d-flex flex-column fill-height">
    <div class="titulo-de-hoja bg-primary flex-shrink-0">
      <span>Ítem {{ indice + 1 }}</span>
      <v-spacer />
      <v-btn icon="mdi-check" color="white" variant="flat" size="x-small" class="text-primary" title="Listo (Enter)"
             @click="emit('cerrar')" />
    </div>

    <div class="d-flex flex-column ga-3 pa-3 overflow-y-auto flex-grow-1">
      <section class="seccion">
        <div class="titulo-de-seccion">Ítem</div>
        <v-textarea v-model="item.descripcion" label="Descripción" v-bind="TEXTO" />
        <v-textarea v-model="item.detalle" label="Detalle adicional" v-bind="TEXTO" />
      </section>

      <section class="seccion">
        <div class="titulo-de-seccion">Cantidad y peso</div>
        <v-text-field v-model.number="item.cantidad" type="number" min="1" label="Cantidad" v-bind="CAMPO" />
        <v-text-field v-model="item.peso" type="number" min="0" label="Peso por unidad" suffix="kg"
                      v-bind="CAMPO" />
      </section>

      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </div>

    <div class="d-flex ga-2 px-4 py-3 border-t-thin flex-shrink-0">
      <v-spacer />
      <v-btn variant="text" color="red" prepend-icon="mdi-delete" @click="emit('borrar', indice)">Quitar</v-btn>
    </div>
  </div>
</template>

<script setup>
// Todo lo de un item de DialogDispatchGuide, en una columna. Enter lo cierra y Shift+Enter baja de linea.
defineProps({
  item: { type: Object, required: true },
  indice: { type: Number, required: true },
  error: { type: String, default: '' },
})
const emit = defineEmits(['cerrar', 'borrar'])

const CAMPO = { density: 'compact', variant: 'outlined', rounded: 'lg', hideDetails: true }
const TEXTO = { ...CAMPO, rows: 1, noResize: true, class: 'crece-con-texto', onKeydown: alEnter }

function alEnter(e) {
  if (e.key !== 'Enter' || e.shiftKey) return
  e.preventDefault()
  emit('cerrar')
}
</script>
