<template>
  <tr :class="{ 'fila-con-error': error, 'fila-elegida': elegida }" class="fila-tarjeta" @click="emit('elegir')">
    <td class="text-medium-emphasis">{{ indice + 1 }}</td>
    <td class="text-break">
      <div v-if="item.descripcion" class="font-weight-bold text-high-emphasis">{{ item.descripcion }}</div>
      <div v-else class="text-error">Falta la descripción</div>
      <div v-if="item.detalle" class="text-caption text-medium-emphasis">{{ item.detalle }}</div>
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </td>
    <td>{{ item.cantidad }}</td>
    <td :class="{ 'text-medium-emphasis': !item.peso }">{{ item.peso ? `${item.peso} kg` : '—' }}</td>
    <td class="text-right">
      <v-btn icon="mdi-delete" variant="text" size="x-small" color="red" density="comfortable" title="Quitar"
             @click.stop="emit('borrar', indice)" />
    </td>
  </tr>
</template>

<script setup>
// Una fila de DialogDispatchGuide, solo para leer: se edita en PanelDispatchGuide.
defineProps({
  item: { type: Object, required: true },
  indice: { type: Number, required: true },
  error: { type: String, default: '' },
  elegida: { type: Boolean, default: false },
})
const emit = defineEmits(['elegir', 'borrar'])
</script>
