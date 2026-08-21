<template>
  <!-- Barras y no linea: son conteos sueltos de meses distintos, no una serie
       continua. Y el mes en curso va hueco, porque compararlo de igual a igual
       con meses cerrados hace parecer una caida que no existe. -->
  <div class="tend" role="img" :aria-label="resumen">
    <div v-for="m in barras" :key="m.mes" class="tend-col"
         :class="{ 'tend-col--curso': m.en_curso }">
      <span class="tend-num">{{ m.facturas }}</span>
      <div class="tend-pista">
        <div class="tend-barra" :style="{ height: m.alto }"></div>
      </div>
      <span class="tend-mes">{{ m.etiqueta }}</span>
      <v-tooltip activator="parent" location="top" open-delay="150">
        {{ m.detalle }}
      </v-tooltip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  meses: { type: Array, default: () => [] },
})

const ALTO_MIN = 6   // % para que un mes en cero igual se vea como barra

const maximo = computed(() =>
  Math.max(...props.meses.map(m => m.facturas), 1))

const barras = computed(() => props.meses.map((m) => {
  const pct = Math.round((m.facturas / maximo.value) * 100)
  return {
    ...m,
    alto: `${Math.max(pct, ALTO_MIN)}%`,
    detalle: m.en_curso
      ? `${m.facturas} facturas en ${m.dias} de ${m.dias_mes} dias (mes en curso)`
      : `${m.facturas} facturas en ${m.etiqueta}`,
  }
}))

// Alternativa en texto para lectores de pantalla: la misma info que las barras.
const resumen = computed(() =>
  'Facturas por mes. ' + props.meses.map(m => `${m.etiqueta} ${m.facturas}`).join(', ') + '.')
</script>

<style scoped>
.tend { display: flex; align-items: flex-end; gap: .5rem; height: 4.6rem; margin-top: .35rem; }
.tend-col {
  flex: 1 1 0; min-width: 0; display: flex; flex-direction: column;
  align-items: center; gap: .15rem; height: 100%; cursor: default;
}

.tend-num {
  font-size: .68rem; font-weight: 650; line-height: 1;
  font-variant-numeric: tabular-nums; color: rgba(128, 128, 128, .95);
}
.tend-mes {
  font-size: .62rem; line-height: 1; text-transform: capitalize;
  color: rgba(128, 128, 128, .75);
}

/* La pista da la altura comun: sin ella cada barra se mediria contra su columna
   y perderian la escala entre si. */
.tend-pista { flex: 1 1 auto; width: 100%; display: flex; align-items: flex-end; }
.tend-barra {
  width: 100%; border-radius: .2rem .2rem 0 0;
  background: rgb(var(--v-theme-primary));
  transition: height .25s ease;
}

/* Mes en curso: hueco y punteado, se lee como "esto todavia no termino". */
.tend-col--curso .tend-barra {
  background: repeating-linear-gradient(
    -45deg,
    rgba(var(--v-theme-primary), .38) 0 3px,
    transparent 3px 6px
  );
  border: 1px solid rgba(var(--v-theme-primary), .6);
  border-bottom: 0;
}
.tend-col--curso .tend-num { color: rgb(var(--v-theme-primary)); }
.tend-col--curso .tend-mes { color: rgb(var(--v-theme-primary)); font-weight: 650; }
</style>
