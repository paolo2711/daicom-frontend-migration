<template>
  <v-container fluid>
    <div class="d-flex align-center mb-4">
      <v-icon size="large" color="primary" class="mr-3">mdi-shield-account</v-icon>
      <h2 class="text-h5 font-weight-bold mb-0">Roles y Permisos</h2>
    </div>

    <list-roles />
  </v-container>
</template>

<script setup>
import ListRoles from '@/views/access/roles/components/ListRoles.vue'
</script>
