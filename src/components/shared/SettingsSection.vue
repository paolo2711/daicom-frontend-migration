<template>
  <section class="hoja d-flex flex-column">
    <div class="titulo-de-hoja">
      <v-icon v-if="icono" size="20" class="mr-2">{{ icono }}</v-icon>
      {{ titulo }}
      <v-spacer />
      <slot name="cabecera" />
    </div>
    <div class="px-4 pb-4 d-flex flex-column ga-4">
      <slot />
    </div>
    <div v-if="seGuarda" class="d-flex justify-end ga-2 px-4 py-3 border-t-thin">
      <v-btn variant="tonal" :disabled="!cambiado || guardando" @click="emit('deshacer')">Deshacer</v-btn>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" :loading="guardando"
             :disabled="!cambiado" @click="emit('guardar')">Guardar</v-btn>
    </div>
  </section>
</template>

<script setup>
// Una seccion de configuracion: se edita directo y guarda sola. Deshacer y Guardar, siempre a la vista
// y apagados hasta que algo cambio.
defineProps({
  titulo: { type: String, required: true },
  icono: { type: String, default: '' },
  cambiado: { type: Boolean, default: false },
  guardando: { type: Boolean, default: false },
  // Sin pie: la seccion solo muestra datos o lleva su propia accion.
  seGuarda: { type: Boolean, default: true },
})
const emit = defineEmits(['deshacer', 'guardar'])
</script>
