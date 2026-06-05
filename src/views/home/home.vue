<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-home</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Inicio</h2>
          <v-spacer></v-spacer>
        </div>

        <v-card variant="flat" class="border rounded-lg">
          <v-toolbar density="compact" flat color="transparent">
            <v-icon color="grey-darken-1" class="ms-4 me-2">mdi-history</v-icon>
            <v-toolbar-title class="text-subtitle-1 font-weight-medium">Últimas acciones realizadas</v-toolbar-title>
          </v-toolbar>
          
          <v-divider></v-divider>

          <v-card-text class="pt-4">
            <v-row justify="center">
              <v-col cols="12" md="8" lg="6">
                <ListLogs />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// En script setup solo se importa el componente y ya queda registrado para el template
import ListLogs from "@/views/home/components/ListLogs.vue"
</script>