<template>
  <div v-if="loading" class="d-flex justify-center py-8">
    <v-progress-circular indeterminate color="primary" size="28" width="3" />
  </div>

  <!-- Nada pendiente: mejor decirlo bonito que mostrar tarjetas en cero -->
  <v-card v-else-if="bloques.length === 0" variant="flat" class="border rounded-lg pa-6 d-flex flex-column align-center">
    <themed-illustration nombre="todo-al-dia" class="todo-al-dia" />
    <div class="text-subtitle-1 font-weight-medium mt-2">Todo al día</div>
    <div class="text-body-2 text-medium-emphasis">No tienes nada pendiente por ahora.</div>
  </v-card>

  <v-row v-else dense>
    <v-col v-for="b in bloques" :key="b.id" cols="12" md="6" lg="4" :class="'ntone-' + b.tono">
      <v-card variant="flat" class="border rounded-lg h-100 d-flex flex-column pend-card">
        <!-- El numero grande esta en la tarjeta de resumen: aca, lo mas viejo para resolverlo. -->
        <div class="pend-head">
          <span class="pend-dot"></span>
          <span class="pend-label">{{ b.titulo }}</span>
        </div>

        <div class="flex-grow-1 pend-list">
          <div v-for="it in b.items.slice(0, VISIBLES)" :key="it.id" class="pend-fila">
            <!-- button y no div: asi se puede llegar con Tab y activar con Enter -->
            <button type="button" class="pend-row" @click="ir(it.ruta)">
              <span class="pend-code">{{ it.titulo }}</span>
              <span class="pend-detail">{{ it.detalle }}</span>
            </button>
            <v-btn v-if="it.accion" size="x-small" variant="tonal" :loading="haciendo === it.id"
                   @click="hacer(it)">{{ it.accion.texto }}</v-btn>
          </div>
        </div>

        <div v-if="b.total > VISIBLES" class="pend-more">
          <button type="button" class="pend-more-btn" @click="ir(b.ruta)">Ver los {{ b.total }}</button>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeDataService from '@/services/home/homeDataService'
import ThemedIllustration from '@/components/shared/ThemedIllustration.vue'
import { registrarBajaEnSol, reintentarEnvio, reintentarFactura } from '@/utils/billing/pendientes'
import { debounce } from '@/utils/debounce'

const VISIBLES = 3
const router = useRouter()
const bloques = ref([])
const loading = ref(true)

const ir = (ruta) => { if (ruta) router.push(ruta).catch(() => {}) }

// El boton de una fila hace lo que dice la `accion` que manda el back; hecho, se vuelve a pedir la lista.
const ACCIONES = {
  baja_en_sol: (it) => registrarBajaEnSol(it.id, it.titulo),
  reintentar: (it) => reintentarEnvio(it.id, it.titulo),
  reintentar_factura: (it) => reintentarFactura(it.id, it.titulo),
}
const haciendo = ref(null)
async function hacer (it) {
  haciendo.value = it.id
  const hecho = await ACCIONES[it.accion.clave](it)
  haciendo.value = null
  if (hecho) cargar()
}

const cargar = () => {
  loading.value = true
  HomeDataService.pendientes()
    .then((r) => { bloques.value = r.data.bloques || [] })
    .catch(() => { bloques.value = [] })
    .finally(() => {
      loading.value = false
      emit('bloques', bloques.value)   // el foco usa el primero
    })
}

const emit = defineEmits(['bloques'])

// Las guias y facturas que no llegaron a SUNAT van en segundo plano; cuando cambian, se vuelve a pedir.
const AVISOS_QUE_LOS_CAMBIAN = ['wss-reload-dispatch-guides', 'wss-reload-invoices', 'wss-update-invoice-row']
const recargar = debounce(cargar)

onMounted(() => {
  cargar()
  AVISOS_QUE_LOS_CAMBIAN.forEach(aviso => window.addEventListener(aviso, recargar))
})
onUnmounted(() => AVISOS_QUE_LOS_CAMBIAN.forEach(aviso => window.removeEventListener(aviso, recargar)))
defineExpose({ cargar })
</script>

<style scoped>
.pend-card { padding: 1.05rem 1.15rem 0.5rem; }
.todo-al-dia { width: 11rem; height: 11rem; }
.pend-head { display: flex; align-items: center; gap: 0.5rem; }
.pend-dot {
  width: 0.5rem; height: 0.5rem; border-radius: 50%;
  flex: 0 0 auto;
  background: var(--ntone-fg);
}
.pend-label {
  font-size: 0.67rem; font-weight: 700;
  letter-spacing: 0.09em; text-transform: uppercase;
  color: rgba(128, 128, 128, 0.95);
}
.pend-list { margin-top: 0.8rem; border-top: 1px solid rgba(128, 128, 128, 0.14); }
.pend-fila {
  display: flex; align-items: center; gap: 0.5rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.14);
}
.pend-fila:last-child { border-bottom: none; }
.pend-row {
  display: flex; align-items: baseline; gap: 0.5rem;
  flex: 1; min-width: 0;
  padding: 0.4rem 0;
  cursor: pointer; text-align: left;
  background: transparent; border: none;
  color: inherit; font: inherit;
  transition: opacity 0.12s ease;
}
.pend-row:hover { opacity: 0.65; }
.pend-row:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.pend-code { font-size: 0.77rem; font-weight: 650; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pend-detail {
  font-size: 0.71rem;
  color: rgba(128, 128, 128, 0.9);
  min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pend-more { padding: 0.5rem 0 0.15rem; }
.pend-more-btn {
  background: none; border: none; cursor: pointer; font: inherit;
  font-size: 0.74rem; font-weight: 600;
  color: rgb(var(--v-theme-seleccion));
  padding: 0;
}
.pend-more-btn:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
</style>
