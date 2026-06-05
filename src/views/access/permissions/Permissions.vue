<template>
  <v-container fluid>
    <div class="d-flex align-center mb-4">
      <v-icon size="large" color="primary" class="mr-3">mdi-shield-account</v-icon>
      <h2 class="text-h5 font-weight-bold mb-0">Roles y Permisos</h2>
      <v-spacer></v-spacer>
    </div>

    <v-row>
      <v-col cols="12" md="5">
        <v-card variant="flat" class="border rounded-lg bg-surface elevation-0 h-100">
          <div class="d-flex align-center pa-4" style="border-bottom: 1px solid var(--v-border-color, rgba(0,0,0,0.12));">
            <h3 class="text-subtitle-1 font-weight-bold mb-0">Lista de Roles</h3>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" size="small" @click="listRoles?.openAddDialog()">
              Nuevo Rol
            </v-btn>
          </div>

          <v-card-text class="pa-4">
            <list-roles ref="listRoles" @selectedRole="setSelectedRole" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <list-permissions ref="listPermissions" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import ListRoles from '@/views/access/roles/components/ListRoles.vue'
import ListPermissions from '@/views/access/permissions/components/ListPermissions.vue'

const listRoles = ref(null)
const listPermissions = ref(null)

const setSelectedRole = (current_role) => {
  if (listPermissions.value) {
    listPermissions.value.selected_role = current_role
    listPermissions.value.retrievePermissions(current_role.id)
  }
}
</script>