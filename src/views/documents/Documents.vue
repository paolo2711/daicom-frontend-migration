<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon size="large" color="primary" class="mr-3">mdi-file-document-multiple-outline</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Documentos</h2>
        </div>

        <div class="d-flex flex-wrap align-center ga-2 w-100 mb-2 mt-2">
          <v-tabs :model-value="route.name" bg-color="transparent" color="primary" class="mx-2 font-weight-bold">
            <v-tab v-for="p in pestanas" :key="p.name" :value="p.name" :to="{ name: p.name }"
                   :prepend-icon="p.meta.pestana.icono">
              {{ p.meta.pestana.texto }}
              <span v-if="esBeta(p)" class="text-caption text-warning ml-1">(beta)</span>
            </v-tab>
          </v-tabs>

          <v-spacer />

          <v-menu v-if="route.meta.nuevo?.opciones" location="bottom end" offset="6">
            <template #activator="{ props }">
              <v-btn v-bind="props" color="primary" class="mr-4" variant="flat"
                     :prepend-icon="route.meta.nuevo.icono" append-icon="mdi-chevron-down">
                {{ route.meta.nuevo.texto }}
              </v-btn>
            </template>
            <v-list density="comfortable" class="elevation-4 border rounded-lg bg-surface py-1" nav>
              <v-list-item v-for="opcion in route.meta.nuevo.opciones" :key="opcion.valor"
                           :title="opcion.texto" :subtitle="opcion.detalle" @click="pestana?.nuevo(opcion.valor)">
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" rounded="lg" size="small" class="mr-1">
                    <v-icon :icon="opcion.icono" size="small" />
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn v-else-if="route.meta.nuevo" color="primary" class="mr-4" variant="flat" :prepend-icon="route.meta.nuevo.icono"
                 @click="pestana?.nuevo()">
            {{ route.meta.nuevo.texto }}
          </v-btn>
        </div>

        <router-view v-slot="{ Component }">
          <component :is="Component" ref="pestana" />
        </router-view>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { esBeta } from '@/utils/beta'

const route = useRoute()
// Las pestañas son las rutas hijas de Documentos (sin las beta, si el router
// las saco). Un tipo de documento nuevo se agrega con su ruta.
const pestanas = useRouter().getRoutes().find(r => r.name === 'documents').children
// La pestaña abierta: el boton de arriba le pide un documento nuevo.
const pestana = ref(null)
</script>
