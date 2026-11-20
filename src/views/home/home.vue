<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12">

        <!-- Saludo, con los atajos: son pocos y no dan para una barra. -->
        <section class="hoja bienvenida mb-6">
          <div class="d-flex flex-column ga-2">
            <h2 class="text-h4 font-weight-bold mb-0">Hola, {{ username }}</h2>
            <div class="text-body-1 text-medium-emphasis">{{ hoy }} · esto es lo que tienes para hoy.</div>
            <div class="d-flex align-center flex-wrap ga-2 mt-2">
              <v-chip variant="tonal" size="small" class="font-weight-medium">
                <v-icon start size="16">mdi-shield-account</v-icon>{{ roleName }}
              </v-chip>
              <v-btn variant="text" size="small" class="text-none" prepend-icon="mdi-account-cog"
                     @click="$router.push('/profile')">Mi perfil</v-btn>
              <v-btn v-if="isSuperAdmin" variant="text" size="small" class="text-none" prepend-icon="mdi-tools"
                     @click="$router.push('/mantenimiento')">Mantenimiento</v-btn>
            </div>
          </div>
          <themed-illustration nombre="investigacion" encuadre="27 111 696 345" class="bienvenida-dibujo" />
        </section>

        <novedades-banner />

        <!-- Primero los numeros, despues los graficos y al final el detalle. Cada bloque llega solo si el
             rol del usuario lo ve: el back los filtra y aca se dibuja lo que hay. -->
        <resumen-pendientes :bloques="bloques" :vencidos="vencidos" @ir="irA" @vencidos="aVencimientos" />

        <home-section titulo="Pulso del mes" icono="mdi-chart-line" tarjeta :class="{ 'd-none': !hayPulso }">
          <pulso-mes @disponible="hayPulso = $event" />
        </home-section>

        <home-section titulo="Te toca" icono="mdi-clipboard-check-outline">
          <mis-pendientes @bloques="bloques = $event" />
        </home-section>

        <home-section id="vencimientos" titulo="Vencimientos" icono="mdi-calendar-alert" tarjeta>
          <vencimientos @ir="irA" @resumen="vencidos = $event" />
        </home-section>

        <home-section titulo="Últimas acciones" icono="mdi-history" tarjeta>
          <list-logs />
        </home-section>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'
import HomeSection from '@/views/home/components/HomeSection.vue'
import ListLogs from '@/views/home/components/ListLogs.vue'
import MisPendientes from '@/views/home/components/MisPendientes.vue'
import NovedadesBanner from '@/views/home/components/NovedadesBanner.vue'
import PulsoMes from '@/views/home/components/PulsoMes.vue'
import ResumenPendientes from '@/views/home/components/ResumenPendientes.vue'
import Vencimientos from '@/views/home/components/Vencimientos.vue'
import ThemedIllustration from '@/components/shared/ThemedIllustration.vue'

const router = useRouter()
const { username, roleName, isSuperAdmin } = usePermissions()
const fecha = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
const hoy = fecha[0].toUpperCase() + fecha.slice(1)

const hayPulso = ref(false)
const bloques = ref([])
const vencidos = ref(null)

const irA = (ruta) => { if (ruta) router.push(ruta).catch(() => {}) }
const aVencimientos = () => document.getElementById('vencimientos')?.scrollIntoView({ behavior: 'smooth' })
</script>

<style scoped>
.bienvenida {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 13rem;
  padding: 0 0 0 2rem;
  overflow: hidden;
  background: linear-gradient(100deg, rgba(var(--v-theme-seleccion), 0.16), rgb(var(--v-theme-hoja)) 55%);
}
.bienvenida-dibujo { width: 30rem; height: 13rem; flex: 0 1 30rem; }
@media (max-width: 40rem) {
  .bienvenida-dibujo { display: none; }
}
</style>
