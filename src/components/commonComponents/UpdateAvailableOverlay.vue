<template>
  <!-- Bloquea la vista cuando el WS detecta que el server corre una versión
       distinta a la del front cargado. Persistente: solo sale recargando. -->
  <v-dialog :model-value="appStore.updateAvailable" persistent width="420" :z-index="99999">
    <v-card class="text-center rounded-xl pa-2">
      <v-card-text class="pt-8">
        <v-avatar color="primary" size="64" class="mb-4">
          <v-icon size="36" color="white">mdi-rocket-launch-outline</v-icon>
        </v-avatar>
        <h2 class="text-h6 font-weight-bold mb-2">Nueva versión disponible</h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Se actualizó la aplicación. Recarga la página para continuar con la
          última versión.
        </p>
      </v-card-text>
      <v-card-actions class="justify-center pb-8">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          class="font-weight-bold px-8 rounded-lg"
          prepend-icon="mdi-refresh"
          @click="recargar"
        >
          Recargar ahora
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useAppStore } from '@/stores/appStore'

const appStore = useAppStore()

const recargar = () => {
  window.location.reload()
}
</script>
