<template>
  <div class="ilustracion" role="img" :aria-label="descripcion" v-html="svg" />
</template>

<script setup>
import { ref, watchEffect } from 'vue'

// Una ilustracion de assets/ilustraciones (Storyset, estilo Pana). Se carga al usarla; su acento pasa al de la
// marca y en oscuro se esconde el cuarto del fondo, asi las personas y los objetos quedan con sus colores.
const props = defineProps({
  nombre: { type: String, required: true },
  descripcion: { type: String, default: '' },
  // La parte de la escena que se muestra ('x y ancho alto' en unidades del SVG), entera y pegada a la derecha.
  encuadre: { type: String, default: '' },
})

const ARCHIVOS = import.meta.glob('@/assets/ilustraciones/*.svg', { query: '?raw', import: 'default' })
const PALETA = ['ff725e', 'ffffff', 'fff', 'fafafa']
const CAPAS = { 'background-complete': 'fondo-completo', 'background-simple': 'fondo-simple' }

// Las capas de fondo pasan a clase y el resto de los id se quita: varias en una pantalla no los repiten.
const encuadrar = (texto) => (props.encuadre
  ? texto.replace(/viewBox="[^"]*"/, `viewBox="${props.encuadre}" preserveAspectRatio="xMaxYMid meet"`)
  : texto)
const preparar = (texto) => encuadrar(texto)
  .replace(/<g id="(background-complete|background-simple)"/g, (_, capa) => `<g class="${CAPAS[capa]}"`)
  .replace(/ id="[^"]*"/g, '')
  .replace(new RegExp(`#(${PALETA.join('|')})\\b`, 'gi'),
           (_, hex) => `var(--ilus-${hex.toLowerCase() === 'fff' ? 'ffffff' : hex.toLowerCase()})`)

const svg = ref('')
watchEffect(async () => {
  const cargar = Object.entries(ARCHIVOS).find(([ruta]) => ruta.endsWith(`/${props.nombre}.svg`))?.[1]
  svg.value = cargar ? preparar(await cargar()) : ''
})
</script>

<style>
.ilustracion svg { display: block; width: 100%; height: 100%; }
.ilustracion {
  --ilus-ff725e: #385677;
  --ilus-ffffff: #ffffff;
  --ilus-fafafa: #fafafa;
}
.v-theme--dark .ilustracion {
  --ilus-ff725e: #7f9cc0;
  --ilus-ffffff: #e4e8ec;
  --ilus-fafafa: #dbe0e5;
}
/* La mancha de fondo de cada escena, con un tinte suave del acento. */
.ilustracion .fondo-simple * { fill: rgba(56, 86, 119, 0.12) !important; }
.v-theme--dark .ilustracion .fondo-completo { display: none; }
.v-theme--dark .ilustracion .fondo-simple * { fill: rgba(var(--v-theme-on-surface), 0.06) !important; }
</style>
