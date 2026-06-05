<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-office-building</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Configuración de Empresa</h2>
          <v-spacer></v-spacer>
        </div>

        <view-edit-company />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import ViewEditCompany from "@/views/access/company/components/ViewEditCompany.vue"
</script>