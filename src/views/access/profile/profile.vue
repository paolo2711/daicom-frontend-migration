<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-account-circle</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Mi Perfil</h2>
          <v-spacer></v-spacer>
        </div>

        <view-edit-profile />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import ViewEditProfile from '@/views/access/profile/components/ViewEditProfile.vue'
</script>