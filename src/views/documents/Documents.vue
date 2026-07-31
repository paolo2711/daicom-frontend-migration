<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-file-document-multiple-outline</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Documentos</h2>
        </div>

        <div class="d-flex align-center w-100 mb-2 mt-2">
          <v-tabs v-model="tab_activo" bg-color="transparent" color="primary" class="mx-2 font-weight-bold" style="width: auto;">
            <v-tab value="0" prepend-icon="mdi-calculator-variant-outline">Cotizaciones</v-tab>
            <v-tab value="1" prepend-icon="mdi-truck-delivery-outline">Formato de Ingreso</v-tab>
            <v-tab value="2" prepend-icon="mdi-file-check-outline" disabled>Proximamente</v-tab>
          </v-tabs>
        </div>

        <v-window v-model="tab_activo" class="mt-2">
          <v-window-item value="0">
            <ListDocuments />
          </v-window-item>
          <v-window-item value="1">
            <ListFormatosIngreso />
          </v-window-item>
          <v-window-item value="2">
            </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import ListDocuments from './components/ListDocuments.vue'
import ListFormatosIngreso from './components/ListFormatoIngreso.vue'

const tab_activo = ref('0')
</script>