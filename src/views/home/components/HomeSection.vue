<template>
  <!-- Un bloque de Inicio: su titulo, su cuadro y el aire de abajo. -->
  <section class="hsec">
    <div class="hsec-head">
      <v-icon v-if="icono" size="13" class="hsec-ic">{{ icono }}</v-icon>
      <span class="hsec-titulo">{{ titulo }}</span>
    </div>

    <v-card variant="flat" class="border rounded-lg">
      <slot />
    </v-card>
  </section>
</template>

<script setup>
defineProps({
  titulo: { type: String, required: true },
  icono: { type: String, default: '' },
})
</script>

<style scoped>
.hsec { display: block; margin-bottom: 1.5rem; }
.hsec-head { display: flex; align-items: center; gap: .35rem; margin-bottom: .6rem; min-height: 1.4rem; }
.hsec-ic { color: rgba(128, 128, 128, .95); }
.hsec-titulo {
  font-size: .66rem; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: rgba(128, 128, 128, .95);
}
</style>
