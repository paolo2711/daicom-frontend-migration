<template>
  <!-- Estado del laboratorio, no pendientes de nadie. Va como franja de numeros y
       no como tarjetas para que no compita con "Tus pendientes". El encabezado y
       la tarjeta los pone HomeSection. -->
  <div>
    <div class="venc-barra">
      <!-- El tooltip cuelga de un elemento propio y el icono va por prop: si se
           mete adentro del v-icon, Vuetify se come el slot (lo usa para saber que
           icono dibujar) y el tooltip no se monta. -->
      <span class="venc-info">
        <v-icon size="14" icon="mdi-information-outline" />
        <v-tooltip activator="parent" location="top" open-delay="150" max-width="300">
          {{ origen }}
        </v-tooltip>
      </span>
      <button type="button" class="venc-recargar" :disabled="cargando" @click="refrescar()">
        <v-icon size="14" icon="mdi-refresh" :class="{ 'venc-girando': cargando }" />
        <v-tooltip activator="parent" location="top" open-delay="150">Volver a revisar</v-tooltip>
      </button>
    </div>

    <div v-if="!grupos.length" class="venc-vacio px-4 pb-4">
      {{ cargando ? 'Revisando…' : 'No se pudo cargar el estado de vencimientos.' }}
    </div>
    <div v-else class="venc-cols">
      <div v-for="g in grupos" :key="g.id" class="venc-col">
        <div class="venc-col-head">
          <span class="venc-col-titulo">{{ g.titulo }}</span>
          <span class="venc-cifra ntone-crit" :class="{ 'venc-cifra--cero': !g.vencidos }">
            <b>{{ g.vencidos }}</b> vencidos
          </span>
          <span class="venc-cifra ntone-warn" :class="{ 'venc-cifra--cero': !g.por_vencer }">
            <b>{{ g.por_vencer }}</b> por vencer
          </span>
        </div>

        <div v-if="g.items.length" class="venc-lista">
          <!-- button y no div, igual que en pendientes: se llega con Tab y se
               activa con Enter. Los patrones no tienen a donde ir, asi que van
               deshabilitados en vez de fingir que son clicables. -->
          <button v-for="it in g.items.slice(0, VISIBLES)" :key="it.codigo"
                  type="button" class="venc-fila" :disabled="!it.ruta"
                  @click="$emit('ir', it.ruta)">
            <span class="venc-cod">{{ it.codigo }}</span>
            <span class="venc-nombre">{{ it.nombre }}</span>
            <span class="venc-dias" :class="it.dias < 0 ? 'text-error' : 'text-warning'">
              {{ textoDias(it.dias) }}
            </span>
          </button>
        </div>
        <div v-else class="venc-vacio">{{ g.vacio }}</div>

        <button v-if="g.items.length > VISIBLES" type="button" class="venc-mas" @click="abrir(g)">
          Ver los {{ g.items.length }}
          <v-icon size="14">mdi-chevron-right</v-icon>
        </button>
      </div>
    </div>

    <!-- Patrones no tiene pestana propia, asi que la lista completa vive aca. El
         dialogo va adentro para que el componente tenga UNA sola raiz: con dos,
         Vue descarta las clases que le pasa home (se perdia el margen de abajo).
         Vuetify lo teletransporta al body igual, asi que no afecta al layout. -->
    <v-dialog v-model="modal" max-width="620" scrollable>
      <v-card rounded="lg" v-if="detalle">
        <v-toolbar density="compact" flat color="transparent">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            {{ detalle.titulo }}
          </v-toolbar-title>
          <span class="venc-cifra ntone-crit me-2" :class="{ 'venc-cifra--cero': !detalle.vencidos }">
            <b>{{ detalle.vencidos }}</b> vencidos
          </span>
          <span class="venc-cifra ntone-warn me-3" :class="{ 'venc-cifra--cero': !detalle.por_vencer }">
            <b>{{ detalle.por_vencer }}</b> por vencer
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="modal = false" />
        </v-toolbar>
        <v-divider />
        <v-card-text class="pa-2">
          <div class="venc-lista">
            <button v-for="it in detalle.items" :key="it.codigo"
                    type="button" class="venc-fila" :disabled="!it.ruta"
                    @click="irDesdeModal(it.ruta)">
              <span class="venc-cod">{{ it.codigo }}</span>
              <span class="venc-nombre">{{ it.nombre }}</span>
              <span class="venc-fecha">{{ it.vence }}</span>
              <span class="venc-dias" :class="it.dias < 0 ? 'text-error' : 'text-warning'">
                {{ textoDias(it.dias) }}
              </span>
            </button>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import HomeDataService from '@/services/home/homeDataService'

const emit = defineEmits(['ir'])

const VISIBLES = 5

const datos = ref(null)
const cargando = ref(true)
const modal = ref(false)
const detalle = ref(null)

// Las dos columnas salen del mismo escaneo, asi que alcanza con decirlo una vez.
const origen = computed(() => {
  const cuando = datos.value?.escaneado
  if (!cuando) return 'Patrones e inventario. Todavia no se ha revisado.'
  const f = new Date(cuando)
  if (isNaN(f)) return `Patrones e inventario. Ultima revision: ${cuando}`
  // 24h, igual que la hora que muestra Mantenimiento. Con 12h el locale mete su
  // propio punto final ("05:21 p. m.") y quedaban dos.
  const hora = f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
  const mismoDia = new Date().toDateString() === f.toDateString()
  const cuandoTexto = mismoDia ? `hoy ${hora}` : `${f.toLocaleDateString('es-PE')} ${hora}`
  return `Patrones e inventario. Ultima revision: ${cuandoTexto}`
})

const grupos = computed(() => {
  const d = datos.value
  if (!d) return []
  return [
    { id: 'patrones', titulo: 'Patrones', ...d.patrones,
      vacio: d.escaneado ? 'Todos vigentes' : 'Sin revisar todavia' },
    { id: 'inventario', titulo: 'Inventario', ...d.inventario,
      vacio: d.escaneado ? 'Todos vigentes' : 'Sin revisar todavia' },
  ]
})

const textoDias = (d) => (d < 0 ? `${Math.abs(d)} d vencido` : `en ${d} d`)

const abrir = (g) => { detalle.value = g; modal.value = true }
const irDesdeModal = (ruta) => { modal.value = false; emit('ir', ruta) }

// El GET no escanea, solo lee. Si el resumen quedo de otro dia (al_dia=false) se
// pide el refresco, que es POST: asi el primero que entra en el dia lo dispara y
// ve el icono girando, en vez de una pantalla que tarda sin explicar por que.
const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await HomeDataService.vencimientos()
    datos.value = data
    if (!data.al_dia) await refrescar(true)
  } catch (e) {
    datos.value = null
  } finally {
    cargando.value = false
  }
}

const refrescar = async (automatico = false) => {
  cargando.value = true
  try {
    const { data } = await HomeDataService.refrescarVencimientos()
    datos.value = data
    // El back devuelve 200 con el dato viejo si no pudo leer el Excel: se avisa
    // solo cuando el usuario lo pidio, no al entrar.
    if (data.error && !automatico) Swal.fire('Error', data.error, 'error')
  } catch (e) {
    if (!automatico) {
      Swal.fire('Error', e.response?.data?.error || 'No se pudo revisar.', 'error')
    }
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.venc-barra { display: flex; justify-content: flex-end; align-items: center; gap: .1rem; padding: .5rem .9rem 0; }
.venc-info { display: inline-flex; padding: .2rem; color: rgba(128, 128, 128, .55); cursor: help; }
.venc-info:hover { color: rgba(128, 128, 128, .9); }
.venc-recargar {
  display: flex; align-items: center; padding: .2rem;
  background: none; border: 0; border-radius: .3rem; cursor: pointer;
  color: rgba(128, 128, 128, .55);
}
.venc-recargar:hover:not(:disabled) { color: rgba(128, 128, 128, .95); background: rgba(128, 128, 128, .1); }
.venc-recargar:disabled { cursor: default; }
.venc-recargar:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 1px; }
.venc-girando { animation: venc-spin .9s linear infinite; }
@keyframes venc-spin { to { transform: rotate(360deg); } }

.venc-cols { display: flex; flex-wrap: wrap; }
.venc-col { flex: 1 1 22rem; min-width: 0; padding: .2rem 1.15rem 1rem; }

/* Las dos columnas se leian como una sola lista larga. La linea las separa. */
.venc-col + .venc-col { border-left: 1px solid rgba(128, 128, 128, .22); }
@media (max-width: 780px) {
  .venc-col + .venc-col { border-left: none; border-top: 1px solid rgba(128, 128, 128, .22); }
}

.venc-col-head { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; margin-bottom: .6rem; }
.venc-col-titulo {
  font-size: .78rem; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; margin-right: .2rem;
}
.venc-cifra {
  font-size: .7rem; padding: .12rem .5rem; border-radius: 999px; white-space: nowrap;
  background: var(--ntone-bg); color: var(--ntone-fg);
}
.venc-cifra b { font-size: .82rem; }
.venc-cifra--cero { background: transparent; color: rgba(128, 128, 128, .7); }

/* Los tamanos van en los hijos y no aca: font es un shorthand y le pisaria el
   font-size a la fila. Mismo criterio que .pend-row en MisPendientes. */
.venc-lista { display: flex; flex-direction: column; }
.venc-fila {
  display: flex; align-items: center; gap: .6rem; width: 100%;
  padding: .32rem .35rem; border-radius: .35rem;
  line-height: 1.3; text-align: left;
  background: none; border: 0; color: inherit; font: inherit;
}
.venc-fila:not(:disabled) { cursor: pointer; }
.venc-fila:not(:disabled):hover { background: rgba(128, 128, 128, .1); }
.venc-fila:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.venc-cod {
  font-size: .77rem; font-weight: 700; flex: 0 0 auto;
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.venc-nombre {
  font-size: .77rem; flex: 1 1 auto; min-width: 0; color: rgba(128, 128, 128, .95);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.venc-fecha { flex: 0 0 auto; font-size: .7rem; color: rgba(128, 128, 128, .75); font-variant-numeric: tabular-nums; }
.venc-dias {
  flex: 0 0 auto; font-size: .72rem; font-weight: 600;
  font-variant-numeric: tabular-nums; min-width: 6.2rem; text-align: right;
}
.venc-vacio { font-size: .78rem; color: rgba(128, 128, 128, .8); padding: .2rem .35rem; }

.venc-mas {
  margin-top: .45rem; padding: .1rem .35rem; border-radius: .3rem;
  font-size: .72rem; font-weight: 600; color: rgb(var(--v-theme-primary));
  display: flex; align-items: center; gap: .1rem;
  background: none; border: 0; cursor: pointer;
}
.venc-mas:hover { background: rgba(128, 128, 128, .1); }
.venc-mas:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 1px; }
</style>
