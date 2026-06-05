<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-account-multiple</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Usuarios</h2>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="listUsers?.openAddDialog()">
            NUEVO
          </v-btn>
        </div>

        <list-users ref="listUsers" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import ListUsers from '@/views/access/users/components/ListUsers.vue'

const listUsers = ref(null)
</script>