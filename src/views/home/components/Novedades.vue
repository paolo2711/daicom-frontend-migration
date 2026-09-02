<template>
  <div class="pa-4">
    <!-- La version actual siempre abierta -->
    <div v-for="(it, i) in actual.items" :key="i" class="nov-item">
      <v-icon size="18" color="primary">{{ it.icon }}</v-icon>
      <span class="nov-texto">{{ it.text }}</span>
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
            <div v-for="(it, i) in v.items" :key="i" class="nov-item">
              <v-icon size="16" color="grey">{{ it.icon }}</v-icon>
              <span class="nov-texto nov-texto--vieja">{{ it.text }}</span>
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

// Un release y todos sus parches se muestran juntos: 3.7.1.0 a 3.7.1.5 son un
// solo bloque "v3.7.1". Si no, un dia de seis despliegues deja seis
// desplegables de un renglon cada uno.
//
// El agrupado se hace aca y no al escribir el archivo: asi changelog.js lleva
// una entrada por despliegue con su numero exacto, sin que nadie tenga que
// acordarse de meterla dentro de otra.
const grupos = computed(() => {
  const salida = []
  // El changelog viene ordenado de mas nuevo a mas viejo, asi que la primera
  // entrada de cada grupo es la ultima que salio: esa da la etiqueta y la fecha.
  // Se muestra el numero completo y no la clave recortada, si no seis parches
  // sobre la 3.7.1 se verian como "v3.7.1" y pareceria que no cambio nada.
  for (const entrada of CHANGELOG) {
    const clave = entrada.version.split('.').slice(0, 3).join('.')
    const ultimo = salida[salida.length - 1]
    if (ultimo && ultimo.clave === clave) {
      ultimo.items.push(...entrada.items)
    } else {
      salida.push({
        clave,
        etiqueta: entrada.version,
        fecha: entrada.fecha,
        items: [...entrada.items],
      })
    }
  }
  return salida
})

const actual = computed(() => grupos.value[0] ?? { items: [] })
const anteriores = computed(() => grupos.value.slice(1))

const abierta = ref(null)
</script>

<style scoped>
.nov-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: .75rem; }
.nov-item:last-child { margin-bottom: 0; }
.nov-texto { font-size: .875rem; line-height: 1.4; }
.nov-texto--vieja { font-size: .8rem; color: rgba(128, 128, 128, .95); }

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
