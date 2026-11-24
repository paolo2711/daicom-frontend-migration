<template>
  <div v-if="tarjetas.length" class="resumen">
    <component :is="t.enlaces ? 'div' : 'button'" v-for="t in tarjetas" :key="t.id"
               :type="t.enlaces ? undefined : 'button'" class="hoja tarjeta"
               :class="[`ntone-${t.tono}`, { 'de-un-clic': !t.enlaces }]" @click="t.enlaces || abrir(t)">
      <span class="tarjeta-cabeza">
        <span class="tarjeta-icono"><v-icon size="18">{{ t.icono }}</v-icon></span>
        <span class="tarjeta-titulo">{{ t.titulo }}</span>
      </span>
      <span class="tarjeta-numero">{{ t.total }}</span>
      <span v-if="t.enlaces" class="tarjeta-enlaces">
        <button v-for="e in t.enlaces" :key="e.texto" type="button" class="enlace" @click="emit('ir', e.ruta)">
          {{ e.texto }} <b>{{ e.total }}</b>
        </button>
      </span>
      <span v-else class="tarjeta-detalle">{{ t.detalle }}</span>
    </component>
  </div>
  <div v-else-if="nadaPendiente" class="hoja al-dia">
    <themed-illustration nombre="todo-al-dia" class="al-dia-dibujo" />
    <div>
      <div class="text-subtitle-1 font-weight-medium">Todo al día</div>
      <div class="text-body-2 text-medium-emphasis">No tienes nada pendiente por ahora.</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import HomeDataService from '@/services/home/homeDataService'
import ThemedIllustration from '@/components/shared/ThemedIllustration.vue'
import { debounce } from '@/utils/debounce'

// Una tarjeta por cada cosa pendiente que el back le manda a este usuario (ya filtradas por su rol) y una
// para lo vencido. Lleva a su lista ya filtrada; con `enlaces`, cada uno a la suya.
const props = defineProps({
  vencidos: { type: Object, default: null },
})
const emit = defineEmits(['ir', 'vencidos'])

const bloques = ref(null)
const tarjetas = computed(() => [
  ...(props.vencidos?.total ? [{ id: 'vencidos', titulo: 'Vencidos', icono: 'mdi-calendar-alert', tono: 'crit',
                                 total: props.vencidos.total, detalle: props.vencidos.detalle }] : []),
  ...(bloques.value || []),
])
const nadaPendiente = computed(() => bloques.value && props.vencidos)

const abrir = (tarjeta) => (tarjeta.id === 'vencidos' ? emit('vencidos') : emit('ir', tarjeta.ruta))

const cargar = () => HomeDataService.pendientes()
  .then((r) => { bloques.value = r.data.bloques })
  .catch(() => { bloques.value = null })

// Las guias y facturas que no llegaron a SUNAT van en segundo plano; cuando cambian, se vuelve a pedir.
const AVISOS_QUE_LOS_CAMBIAN = ['wss-reload-dispatch-guides', 'wss-reload-invoices', 'wss-update-invoice-row']
const recargar = debounce(cargar)

onMounted(() => {
  cargar()
  AVISOS_QUE_LOS_CAMBIAN.forEach(aviso => window.addEventListener(aviso, recargar))
})
onUnmounted(() => AVISOS_QUE_LOS_CAMBIAN.forEach(aviso => window.removeEventListener(aviso, recargar)))
</script>

<style scoped>
.resumen {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem;
  text-align: left;
}
.de-un-clic { cursor: pointer; transition: background-color 0.15s; }
.de-un-clic:hover { background: rgb(var(--v-theme-panel)); }
.de-un-clic:focus-visible, .enlace:focus-visible {
  outline: 0.125rem solid rgb(var(--v-theme-seleccion)); outline-offset: 0.125rem;
}
.tarjeta-cabeza { display: flex; align-items: center; gap: 0.5rem; }
.tarjeta-icono {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: 50%;
  background: var(--ntone-bg); color: var(--ntone-fg);
}
.tarjeta-titulo { font-size: 0.8125rem; font-weight: 600; }
.tarjeta-numero {
  font-size: 2rem; font-weight: 600; line-height: 1.1;
  font-variant-numeric: tabular-nums; color: var(--ntone-fg);
}
.tarjeta-detalle {
  font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tarjeta-enlaces { display: flex; gap: 0.5rem; }
.enlace {
  flex: 1; padding: 0.375rem 0.5rem; border-radius: 0.375rem;
  font-size: 0.75rem; font-variant-numeric: tabular-nums;
  background: rgba(var(--v-theme-on-surface), 0.06); transition: background-color 0.15s;
}
.enlace:hover { background: rgb(var(--v-theme-panel)); }
.al-dia { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
.al-dia-dibujo { width: 6rem; height: 6rem; }
</style>
