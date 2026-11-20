<template>
  <!-- Conteos sueltos por mes, en barras. El mes en curso va hueco: todavia no termino y al lado de los
       cerrados pareceria una caida. -->
  <div>
    <div class="tend" role="img" :aria-label="resumen">
      <div v-for="m in barras" :key="m.mes" class="tend-col" :class="{ 'tend-col--curso': m.en_curso }">
        <div class="tend-pista">
          <div v-for="s in SERIES" :key="s.clave" class="tend-barra" :class="`tend-barra--${s.clave}`"
               :style="{ height: m.altos[s.clave] }" />
        </div>
        <span class="tend-mes">{{ m.nombre }}</span>
        <v-tooltip activator="parent" location="top" open-delay="150">{{ m.detalle }}</v-tooltip>
      </div>
    </div>
    <div class="tend-leyenda">
      <span v-for="s in SERIES" :key="s.clave"><i :class="`tend-barra--${s.clave}`" />{{ s.nombre }}</span>
      <span>· el mes en curso va hueco</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  meses: { type: Array, default: () => [] },
})

const SERIES = [
  { clave: 'certificados', nombre: 'certificados' },
  { clave: 'facturas', nombre: 'facturas' },
]
const ALTO_MIN = 4   // % para que un mes en cero igual se vea

// El nombre del mes sale del navegador, en castellano: el back lo manda como 2026-07.
const nombreDelMes = (mes) => {
  const [anio, numero] = mes.split('-').map(Number)
  return new Date(anio, numero - 1, 1).toLocaleString('es-PE', { month: 'short' }).replace('.', '')
}

const maximo = computed(() => Math.max(...props.meses.flatMap(m => SERIES.map(s => m[s.clave] || 0)), 1))

const barras = computed(() => props.meses.map((m) => {
  const nombre = nombreDelMes(m.mes)
  const cuenta = SERIES.map(s => `${m[s.clave] || 0} ${s.nombre}`).join(' y ')
  return {
    ...m,
    nombre,
    altos: Object.fromEntries(SERIES.map(s =>
      [s.clave, `${Math.max(Math.round(((m[s.clave] || 0) / maximo.value) * 100), ALTO_MIN)}%`])),
    detalle: m.en_curso ? `${cuenta} en ${m.dias} de ${m.dias_mes} días (mes en curso)` : `${cuenta} en ${nombre}`,
  }
}))

// La misma informacion que las barras, para lectores de pantalla.
const resumen = computed(() => 'Certificados y facturas por mes. '
  + barras.value.map(m => `${m.nombre}: ${m.certificados || 0} y ${m.facturas || 0}`).join(', ') + '.')
</script>

<style scoped>
.tend { display: flex; align-items: flex-end; gap: .75rem; height: 6rem; margin-top: .5rem; }
.tend-col {
  flex: 1 1 0; min-width: 0; display: flex; flex-direction: column;
  align-items: center; gap: .25rem; height: 100%; cursor: default;
}
.tend-mes { font-size: .7rem; line-height: 1; text-transform: capitalize; color: rgba(128, 128, 128, .85); }

/* La pista da la altura comun: sin ella cada barra se mediria contra su columna. */
.tend-pista { flex: 1 1 auto; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: .15rem; }
.tend-barra { flex: 0 1 .9rem; border-radius: .2rem .2rem 0 0; transition: height .25s ease; }
.tend-barra--certificados { background: rgb(var(--v-theme-seleccion)); }
.tend-barra--facturas { background: var(--notif-teal-fg); }

/* Mes en curso: hueco, se lee como "esto todavia no termino". */
.tend-col--curso .tend-barra { background: transparent; border: 2px solid; border-bottom: 0; }
.tend-col--curso .tend-barra--certificados { border-color: rgb(var(--v-theme-seleccion)); }
.tend-col--curso .tend-barra--facturas { border-color: var(--notif-teal-fg); }
.tend-col--curso .tend-mes { font-weight: 650; }

.tend-leyenda { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .5rem; font-size: .7rem; color: rgba(128, 128, 128, .9); }
.tend-leyenda i { display: inline-block; width: .6rem; height: .6rem; border-radius: .15rem; margin-right: .3rem; }
</style>
