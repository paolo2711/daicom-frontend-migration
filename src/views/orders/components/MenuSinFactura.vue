<template>
  <!-- Las dos formas de NO facturar, en un solo control que muestra cual tiene
       la orden. Elegir la que ya tiene la quita. -->
  <v-menu location="top" :disabled="!disponible">
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" size="small" class="mx-1 font-weight-bold"
             :disabled="!disponible" :loading="cargando"
             :prepend-icon="icono" append-icon="mdi-menu-up">
        {{ etiqueta }}
      </v-btn>
    </template>

    <v-list density="compact" min-width="230">
      <v-list-item v-for="op in MARCAS" :key="op.clave" @click="elegir(op)">
        <template #prepend>
          <v-icon size="18" :color="activa === op.clave ? 'primary' : undefined">
            {{ activa === op.clave ? 'mdi-check' : op.icono }}
          </v-icon>
        </template>
        <v-list-item-title :class="{ 'font-weight-bold text-primary': activa === op.clave }">
          {{ op.texto }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">{{ op.ayuda }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MARCAS, SIN_CARGO, alternarMarca, marcaDe, puedeMarcarse } from '@/utils/orders/sinFactura'

const props = defineProps({
  orders: { type: Array, default: () => [] },
})
const emit = defineEmits(['aplicado'])

const cargando = ref(false)

const disponible = computed(() => props.orders.some(puedeMarcarse))

const activa = computed(() => marcaDe(props.orders))

const etiqueta = computed(() => MARCAS.find(m => m.clave === activa.value)?.texto || 'Sin factura')

const icono = computed(() =>
  activa.value === SIN_CARGO ? 'mdi-cash-off' : 'mdi-file-remove-outline')

const elegir = async (op) => {
  cargando.value = true
  const confirmado = await alternarMarca(op.clave, props.orders)
  cargando.value = false
  if (confirmado) emit('aplicado')
}
</script>
