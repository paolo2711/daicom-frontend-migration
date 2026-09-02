<template>
  <div class="copiable" :class="{ 'copiable--vacio': !texto }">
    <span class="copiable__valor" :style="ancho ? { maxWidth: ancho } : null" :title="texto">
      {{ texto || '---' }}
    </span>

    <v-tooltip location="top" text="Copiar">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          v-show="texto"
          class="copiable__boton"
          icon="mdi-content-copy"
          size="x-small"
          variant="text"
          density="compact"
          :aria-label="`Copiar ${etiqueta || 'valor'}`"
          @click.stop="copiar"
        />
      </template>
    </v-tooltip>
  </div>
</template>

<script setup>
import { copiarConAviso } from '@/utils/clipboard'

const props = defineProps({
  // Se copia este valor completo, no el que se ve truncado en la celda.
  texto: { type: String, default: '' },
  etiqueta: { type: String, default: '' },
  // Tope de ancho del texto. Sin esto una direccion larga estira la columna.
  ancho: { type: String, default: '' },
})

const copiar = () => {
  if (!props.texto) return
  copiarConAviso(props.texto)
}
</script>

<style scoped>
.copiable {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.copiable__valor {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copiable--vacio .copiable__valor {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.38;
}

/* El icono aparece al pasar el mouse o al llegar por teclado: con varias filas
   y varias columnas, tenerlos siempre visibles es ruido.
   Va acotado al alto del texto: si no, es el boton el que decide cuanto mide
   la fila y la tabla entera crece. */
.copiable__boton {
  opacity: 0;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  min-width: 0;
  transition: opacity 0.15s ease;
}

.copiable:hover .copiable__boton,
.copiable__boton:focus-visible {
  opacity: 1;
}
</style>
