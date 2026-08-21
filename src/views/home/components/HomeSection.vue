<template>
  <!-- Una sola forma de titular un bloque de Inicio. Antes habia tres (banda
       suelta, banda adentro del componente y v-toolbar escrito en home), asi que
       cada bloque se veia distinto y el margen de abajo dependia de acordarse de
       poner mb-6. Aca el encabezado y el aire son parte de la seccion. -->
  <section class="hsec">
    <div class="hsec-head">
      <v-icon v-if="icono" size="13" class="hsec-ic">{{ icono }}</v-icon>
      <span class="hsec-titulo">{{ titulo }}</span>
      <v-spacer />
      <slot name="accion" />
    </div>

    <!-- tarjeta: para los bloques que son UN cuadro. Los que traen su propia
         grilla de tarjetas (pendientes) la piden en false. -->
    <v-card v-if="tarjeta" variant="flat" class="border rounded-lg">
      <slot />
    </v-card>
    <slot v-else />
  </section>
</template>

<script setup>
defineProps({
  titulo: { type: String, required: true },
  icono: { type: String, default: '' },
  tarjeta: { type: Boolean, default: false },
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
