<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12">

        <!-- Saludo. Los atajos van aca en chico: son pocos y no dan para una barra. -->
        <div class="d-flex align-center flex-wrap mb-4" style="gap: 10px;">
          <v-icon size="large" color="primary">mdi-hand-wave</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Hola, {{ username }}</h2>
          <v-chip color="primary" variant="tonal" size="small" class="font-weight-medium">
            <v-icon start size="16">mdi-shield-account</v-icon>{{ roleName }}
          </v-chip>
          <v-spacer />
          <v-btn variant="text" size="small" class="text-none" prepend-icon="mdi-account-cog"
                 @click="$router.push('/profile')">Mi perfil</v-btn>
          <v-btn v-if="isSuperAdmin" variant="text" size="small" class="text-none" prepend-icon="mdi-tools"
                 @click="$router.push('/mantenimiento')">Mantenimiento</v-btn>
        </div>

        <!-- 1. Estado del laboratorio: lo vencido o por vencer. No es de nadie en
             particular, por eso va primero y le llega a todos igual. -->
        <home-section titulo="Vencimientos" icono="mdi-calendar-alert" tarjeta>
          <vencimientos @ir="irA" />
        </home-section>

        <!-- 2. Lo que le toca a este usuario. Cada item lleva a su pestana filtrada. -->
        <home-section titulo="Tus pendientes" icono="mdi-clipboard-check-outline">
          <mis-pendientes />
        </home-section>

        <!-- 3. Como va el mes. Solo para quien tiene acceso a Ordenes: el bloque
             avisa si hay algo que mostrar y recien ahi aparece el encabezado. -->
        <home-section titulo="Pulso del mes" icono="mdi-chart-line" tarjeta
                      :class="{ 'd-none': !hayPulso }">
          <pulso-mes @disponible="hayPulso = $event" />
        </home-section>

        <v-row>
          <!-- Actividad: ocupa el ancho grande porque es la lista mas larga -->
          <v-col cols="12" md="7">
            <home-section titulo="Ultimas acciones realizadas" icono="mdi-history" tarjeta>
              <list-logs />
            </home-section>
          </v-col>

          <!-- Novedades al costado: presente, sin robar protagonismo -->
          <v-col cols="12" md="5">
            <home-section titulo="Novedades de la version" icono="mdi-rocket-launch-outline" tarjeta>
              <template #accion>
                <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-bold">
                  v{{ version }}
                </v-chip>
              </template>
              <novedades />
            </home-section>
          </v-col>
        </v-row>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'
import { CHANGELOG } from '@/data/changelog'
import HomeSection from '@/views/home/components/HomeSection.vue'
import ListLogs from '@/views/home/components/ListLogs.vue'
import MisPendientes from '@/views/home/components/MisPendientes.vue'
import Novedades from '@/views/home/components/Novedades.vue'
import PulsoMes from '@/views/home/components/PulsoMes.vue'
import Vencimientos from '@/views/home/components/Vencimientos.vue'

const router = useRouter()
const { username, roleName, isSuperAdmin } = usePermissions()

const version = CHANGELOG[0].version
const hayPulso = ref(false)

const irA = (ruta) => { if (ruta) router.push(ruta).catch(() => {}) }
</script>
