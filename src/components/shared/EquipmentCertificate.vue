<template>
  <div class="cursor-pointer d-inline-block" :title="certificado ? 'Ver el certificado' : 'Vincular un certificado'"
       @click.stop="emit('abrir')">
    <template v-if="certificado">
      <div>{{ certificado.numero }}</div>
      <div v-if="certificado.vence" class="text-caption text-medium-emphasis">{{ textoDeVence(certificado) }}</div>
    </template>
    <span v-else class="text-medium-emphasis">Sin certificado</span>
  </div>
</template>

<script setup>
import { textoDeVence } from '@/utils/equipments/expediente'

// El certificado vinculado a un equipo del inventario (vigencia_de en el back).
defineProps({ certificado: { type: Object, default: null } })
const emit = defineEmits(['abrir'])
</script>
