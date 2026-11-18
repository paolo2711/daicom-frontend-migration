<template>
  <div class="miniatura" :class="{ chica }">
    <div v-for="(parte, i) in partes" :key="i" :class="parte"></div>
    <div v-if="franja" class="franja"><i></i><i></i><i></i></div>
  </div>
</template>

<script setup>
// Una hoja A4 en miniatura. `partes`: titulo, linea, tabla, espacio (con corto, largo, baja o marcado);
// `franja`: el lugar del sello, la firma y el QR.
defineProps({
  partes: { type: Array, default: () => [] },
  franja: { type: Boolean, default: false },
  chica: { type: Boolean, default: false },
})
</script>

<style scoped>
.miniatura {
  position: relative;
  width: 55%;
  max-width: 7rem;
  aspect-ratio: 210 / 297;
  margin: 0 auto;
  padding: 10% 9%;
  border-radius: 0.25rem;
  background: #f4f5f7;
  box-shadow: 0 0.05rem 0.25rem rgba(0, 0, 0, 0.25);
}

.miniatura.chica {
  width: 4.5rem;
  margin: 0;
  padding: 0.45rem 0.4rem;
}

.titulo, .linea {
  height: 0.25rem;
  border-radius: 0.1rem;
  margin-bottom: 4%;
  background: #3a4250;
  width: 45%;
}

.linea {
  background: #c6ccd6;
  width: 100%;
}

.corta, .corto {
  width: 30%;
}

.largo {
  width: 75%;
}

.marcado {
  outline: 0.1rem dashed rgb(var(--v-theme-primary));
  outline-offset: 0.1rem;
}

.tabla {
  height: 20%;
  margin-bottom: 6%;
  border: thin solid #3a4250;
  background: repeating-linear-gradient(to bottom, transparent 0 0.3rem, #c6ccd6 0.3rem 0.35rem);
}

.tabla.baja {
  height: 12%;
}

.espacio {
  height: 6%;
}

.franja {
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: 18%;
  height: 11%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border: 0.1rem dashed rgb(var(--v-theme-modal_warning));
  border-radius: 0.2rem;
}

.franja i {
  width: 18%;
  height: 60%;
  border-radius: 0.1rem;
  background: rgb(var(--v-theme-modal_warning));
  opacity: 0.5;
}
</style>
