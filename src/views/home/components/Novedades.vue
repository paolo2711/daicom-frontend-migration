<template>
  <div class="pa-4">
    <!-- La version actual siempre abierta -->
    <div v-for="seccion in actual.secciones" :key="seccion.tipo" class="nov-seccion">
      <div class="nov-titulo" :class="`text-${seccion.color}`">
        <v-icon size="16">{{ seccion.icono }}</v-icon>
        <span>{{ seccion.rotulo }}</span>
      </div>
      <div v-for="(texto, i) in seccion.items" :key="i" class="nov-item">{{ texto }}</div>
    </div>

    <!-- Las anteriores quedan para consultar, cerradas. -->
    <template v-if="anteriores.length">
      <v-divider class="my-3" />
      <div v-for="v in anteriores" :key="v.clave">
        <button type="button" class="nov-vieja" @click="abierta = abierta === v.clave ? null : v.clave">
          <v-icon size="14">{{ abierta === v.clave ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
          <span class="nov-vers">v{{ v.etiqueta }}</span>
          <span class="nov-fecha">{{ v.fecha }}</span>
        </button>

        <v-expand-transition>
          <div v-show="abierta === v.clave" class="nov-lista-vieja">
            <div v-for="seccion in v.secciones" :key="seccion.tipo" class="nov-seccion">
              <div class="nov-titulo nov-titulo--vieja">
                <v-icon size="14">{{ seccion.icono }}</v-icon>
                <span>{{ seccion.rotulo }}</span>
              </div>
              <div v-for="(texto, i) in seccion.items" :key="i" class="nov-item nov-item--vieja">{{ texto }}</div>
            </div>
          </div>
        </v-expand-transition>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CHANGELOG } from '@/data/changelog'

// El orden manda: primero lo que suma, despues lo que cambio, al final lo que
// estaba roto. La seccion sin items no se dibuja.
const SECCIONES = [
  { tipo: 'nuevo',   rotulo: 'NUEVO',    icono: 'mdi-plus-circle-outline', color: 'success' },
  { tipo: 'cambio',  rotulo: 'CAMBIOS',  icono: 'mdi-tune',                color: 'primary' },
  { tipo: 'arreglo', rotulo: 'ARREGLOS', icono: 'mdi-wrench-outline',      color: 'warning' },
]
const NO_SON_SECCION = ['version', 'fecha']

// Un release y todos sus parches se muestran juntos: 3.7.1.0 a 3.7.1.5 son un
// solo bloque, rotulado con la version mas nueva del grupo. Sin esto, un dia de
// seis despliegues deja seis desplegables de un renglon cada uno.
//
// El agrupado se hace aca y no al escribir el archivo: asi changelog.js lleva
// una entrada por despliegue con su numero exacto, sin que nadie tenga que
// acordarse de meterla dentro de otra.
const grupos = computed(() => {
  const salida = []
  // Viene ordenado de mas nuevo a mas viejo, asi que la primera entrada de cada
  // grupo es la ultima que salio: de ahi sale la etiqueta y la fecha.
  for (const entrada of CHANGELOG) {
    const clave = entrada.version.split('.').slice(0, 3).join('.')
    let grupo = salida[salida.length - 1]
    if (!grupo || grupo.clave !== clave) {
      grupo = { clave, etiqueta: entrada.version, fecha: entrada.fecha, porTipo: {} }
      salida.push(grupo)
    }
    for (const [tipo, items] of Object.entries(entrada)) {
      if (NO_SON_SECCION.includes(tipo)) continue
      grupo.porTipo[tipo] = [...(grupo.porTipo[tipo] ?? []), ...items]
    }
  }

  return salida.map(g => ({ ...g, secciones: armarSecciones(g.porTipo) }))
})

function armarSecciones(porTipo) {
  const secciones = SECCIONES
    .filter(s => porTipo[s.tipo]?.length)
    .map(s => ({ ...s, items: porTipo[s.tipo] }))

  // Un tipo mal escrito no puede desaparecer sin que se note: cae al final con
  // su propio rotulo en vez de quedar afuera en silencio.
  for (const [tipo, items] of Object.entries(porTipo)) {
    if (SECCIONES.some(s => s.tipo === tipo) || !items.length) continue
    secciones.push({ tipo, rotulo: `SIN CLASIFICAR (${tipo})`, icono: 'mdi-help-circle-outline', color: 'error', items })
  }
  return secciones
}

const actual = computed(() => grupos.value[0] ?? { secciones: [] })
const anteriores = computed(() => grupos.value.slice(1))

const abierta = ref(null)
</script>

<style scoped>
.nov-seccion { margin-bottom: 1rem; }
.nov-seccion:last-child { margin-bottom: 0; }

.nov-titulo {
  display: flex; align-items: center; gap: .35rem;
  font-size: .7rem; font-weight: 700; letter-spacing: .06em;
  margin-bottom: .4rem;
}
.nov-titulo--vieja { color: rgba(128, 128, 128, .95); }

.nov-item {
  font-size: .875rem; line-height: 1.4;
  padding-left: 1.4rem; margin-bottom: .4rem;
  position: relative;
}
.nov-item::before {
  content: ''; position: absolute; left: .5rem; top: .55em;
  width: 4px; height: 4px; border-radius: 50%;
  background: currentColor; opacity: .35;
}
.nov-item:last-child { margin-bottom: 0; }
.nov-item--vieja { font-size: .8rem; color: rgba(128, 128, 128, .95); }

.nov-vieja {
  display: flex; align-items: center; gap: .35rem; width: 100%;
  padding: .3rem .25rem; border-radius: .3rem;
  background: none; border: 0; color: inherit; font: inherit; cursor: pointer;
  text-align: left;
}
.nov-vieja:hover { background: rgba(128, 128, 128, .1); }
.nov-vieja:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.nov-vers { font-size: .75rem; font-weight: 700; }
.nov-fecha { font-size: .7rem; color: rgba(128, 128, 128, .8); }

.nov-lista-vieja { padding: .5rem 0 .5rem 1.35rem; }
</style>
