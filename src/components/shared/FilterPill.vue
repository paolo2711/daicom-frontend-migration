<template>
  <v-badge
    :model-value="count > 0"
    :content="count"
    :color="badgeColor || color"
    offset-x="4"
    offset-y="4"
  >
    <v-chip
      :color="active ? color : 'grey-darken-1'"
      :variant="variant"
      class="font-weight-bold cursor-pointer transition-swing"
      @click="$emit('click')"
    >
      <v-icon v-if="icon" start size="small">{{ icon }}</v-icon>
      <slot />
      <v-tooltip v-if="tooltip" activator="parent" location="top">{{ tooltip }}</v-tooltip>
    </v-chip>
  </v-badge>
</template>

<script setup>
// Pildora de filtro: se toca para prender o apagar, se pone gris cuando esta
// apagada y puede llevar el contador arriba a la derecha.
//
// Estaba escrita en Certificados, Ordenes, Alquileres e Inventario, y en cinco
// de esos lugares el color salia de una ternaria cuya primera mitad no hacia
// nada: los cuatro casos daban lo mismo que "activa ? color : gris".
defineProps({
  active: { type: Boolean, default: false },
  color: { type: String, default: 'primary' },
  icon: { type: String, default: '' },
  tooltip: { type: String, default: '' },
  // El contador aparece solo si hay algo que contar.
  count: { type: Number, default: 0 },
  // Por defecto acompaña al color de la pildora.
  badgeColor: { type: String, default: '' },
  variant: { type: String, default: undefined },
})

defineEmits(['click'])
</script>
