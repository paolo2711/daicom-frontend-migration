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
      <div v-for="v in anteriores" :key="v.version">
        <button type="button" class="nov-vieja" @click="abierta = abierta === v.version ? null : v.version">
          <v-icon size="14">{{ abierta === v.version ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
          <span class="nov-vers">v{{ v.version }}</span>
          <span class="nov-fecha">{{ v.fecha }}</span>
        </button>

        <v-expand-transition>
          <div v-show="abierta === v.version" class="nov-lista-vieja">
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

// El changelog viene ordenado de mas nuevo a mas viejo.
const actual = computed(() => CHANGELOG[0])
const anteriores = computed(() => CHANGELOG.slice(1))

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
