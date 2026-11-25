<template>
  <v-dialog v-model="abierto" fullscreen transition="dialog-bottom-transition">
    <v-card color="black" class="d-flex flex-column" style="height: 100vh;">
      <v-toolbar color="transparent" class="text-white" flat>
        <v-spacer />
        <v-btn icon variant="text" size="large" title="Cerrar" @click="abierto = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-carousel v-model="indice" hide-delimiters height="100%" :show-arrows="fotos.length > 1 ? 'hover' : false">
        <v-carousel-item v-for="foto in fotos" :key="foto.id">
          <v-img :src="foto.image" height="100%" />
        </v-carousel-item>
      </v-carousel>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'

// Las fotos de un equipo, a pantalla completa.
const abierto = ref(false)
const fotos = ref([])
const indice = ref(0)

function open(galeria, desde = 0) {
  fotos.value = galeria
  indice.value = desde
  abierto.value = true
}

defineExpose({ open })
</script>
