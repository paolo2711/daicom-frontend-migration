<template>
  <v-dialog :model-value="abierto" class="panel-lateral" transition="slide-x-reverse-transition" width="26rem"
            @update:model-value="si => si || emit('cerrar')">
    <v-card class="panel-flotante d-flex flex-column fill-height">
      <v-toolbar density="compact" flat color="transparent" class="panel-flotante__encabezado flex-grow-0 pl-3 pr-0">
        <slot name="icono" />
        <span class="text-subtitle-2 font-weight-bold text-medium-emphasis text-truncate">{{ titulo }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" class="mr-1" title="Cerrar" @click="emit('cerrar')" />
      </v-toolbar>

      <div class="d-flex flex-column ga-3 pa-3 overflow-y-auto">
        <v-sheet class="bloque pa-4" :color="fondo"><slot /></v-sheet>

        <v-sheet v-for="(grupo, g) in grupos" :key="g" class="bloque overflow-hidden" :color="fondo">
          <div v-for="(a, i) in grupo" :key="a.clave" class="accion" :class="{ 'border-t-thin': i > 0, 'text-disabled': a.disabled }"
               @click="!a.disabled && emit('accion', a.clave)">
            <v-icon :icon="a.icono" :color="a.disabled ? undefined : 'primary'" size="20" />
            <span class="flex-grow-1">{{ a.texto }}</span>
            <v-icon icon="mdi-chevron-right" size="small" />
          </div>
        </v-sheet>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/appStore'

// El panel de subidas en grande, como modal a la derecha (estilos en scss/vuetify/_panel.scss). Mientras esta
// abierto, el de subidas no se muestra. Las acciones son las de accionesPara (utils/actions.js), por grupo.
const props = defineProps({
  abierto: { type: Boolean, default: false },
  titulo: { type: String, default: '' },
  acciones: { type: Array, default: () => [] },
})
const emit = defineEmits(['cerrar', 'accion'])

// Los bloques llevan el fondo de las filas del panel de subidas; el dialogo se monta fuera de la app, asi que
// el tema se lee aca, como alla.
const theme = useTheme()
const fondo = computed(() => theme.global.current.value.dark ? 'grey-darken-4' : 'white')

const grupos = computed(() => props.acciones.reduce((lista, a, i) => {
  if (i === 0 || a.grupo !== props.acciones[i - 1].grupo) lista.push([])
  lista.at(-1).push(a)
  return lista
}, []))

const appStore = useAppStore()
let cuenta = false
function contar (si) {
  if (si === cuenta) return
  cuenta = si
  appStore.panelesLaterales += si ? 1 : -1
}
watch(() => props.abierto, contar, { immediate: true })
onUnmounted(() => contar(false))
</script>

<style scoped>
/* Si no entran, el panel se desplaza: los bloques no se encogen. */
.bloque { border-radius: 12px; flex-shrink: 0; }
.accion { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
.accion.text-disabled { cursor: default; }
</style>
