<template>
  <div
    v-if="loading && isEmpty"
    class="d-flex flex-column align-center justify-center rounded-lg"
    :style="{
      minHeight: `calc(100vh - ${offset}px)`,
      border: '1px solid rgba(0,0,0,0.12)',
      backgroundColor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)'
    }"
  >
    <slot name="spinner">
      <v-progress-circular indeterminate color="primary" size="64" width="6" />
      <div class="mt-4 font-weight-bold text-h6" :class="isDark ? 'text-white' : 'text-primary'">
        {{ text }}
      </div>
    </slot>
  </div>

  <div v-else style="position: relative; border-radius: 8px; z-index: 1;">
    <div
      v-if="loading"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2; pointer-events: all; border-radius: 8px; display: flex; flex-direction: column;"
      :style="{ backgroundColor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)' }"
    >
      <div style="position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
        <slot name="spinner">
          <v-progress-circular indeterminate color="primary" size="64" width="6" />
          <div class="mt-4 font-weight-bold text-h6" :class="isDark ? 'text-white' : 'text-primary'">
            {{ text }}
          </div>
        </slot>
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  loading: { type: Boolean, required: true },
  isEmpty: { type: Boolean, required: true },
  text:    { type: String,  default: 'Cargando registros...' },
  offset:  { type: Number,  default: 600 },
})

const theme  = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
</script>