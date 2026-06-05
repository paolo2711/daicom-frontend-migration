<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-account-group</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Clientes</h2>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="listClients?.openAddDialog()">
            NUEVO
          </v-btn>
        </div>

        <list-clients ref="listClients" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'

import ListClients from '@/views/clients/components/ListClients.vue'
const listClients = ref(null)
</script>