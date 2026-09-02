<template>
  <!-- Las dos formas de NO facturar viven en un solo control. Antes era un boton
       que alternaba entre "Sin comprobante" y "Requiere factura", asi que no se
       veia en que estado estaba la orden ni existia el caso "no se cobra". -->
  <v-menu location="top" :disabled="!disponible">
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" size="small" class="mx-1 font-weight-bold"
             :disabled="!disponible" :loading="cargando"
             :prepend-icon="icono" append-icon="mdi-menu-up">
        {{ etiqueta }}
      </v-btn>
    </template>

    <v-list density="compact" min-width="230">
      <v-list-item v-for="op in OPCIONES" :key="op.clave"
                   :disabled="op.clave === 'sin_cargo' ? false : orders.length !== 1"
                   @click="elegir(op)">
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
import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import OrderDataService from '@/services/certificates/orderDataService'

const props = defineProps({
  orders: { type: Array, default: () => [] },
})
const emit = defineEmits(['aplicado'])

const OPCIONES = [
  { clave: 'sin_comprobante', texto: 'Sin comprobante', icono: 'mdi-file-remove-outline',
    ayuda: 'Se cobra, pero no lleva factura' },
  { clave: 'sin_cargo', texto: 'Sin cargo', icono: 'mdi-cash-off',
    ayuda: 'No se cobra: equipo propio o cortesia' },
]

const cargando = ref(false)

// Una orden con factura fiscal ya emitida no se puede marcar de ninguna de las
// dos formas: primero hay que desvincular esa factura.
const conFacturaFiscal = computed(() =>
  props.orders.filter(o => (o.invoices || []).some(f => f.es_fiscal)))

const disponible = computed(() =>
  props.orders.length > 0 && conFacturaFiscal.value.length < props.orders.length)

// El estado actual solo se muestra si TODAS las seleccionadas coinciden; con una
// mezcla no hay un estado unico que mostrar.
const activa = computed(() => {
  if (!props.orders.length) return null
  if (props.orders.every(o => o.requiere_pago === false)) return 'sin_cargo'
  if (props.orders.every(o => o.wants_invoice === false)) return 'sin_comprobante'
  return null
})

const etiqueta = computed(() => {
  if (activa.value === 'sin_cargo') return 'Sin cargo'
  if (activa.value === 'sin_comprobante') return 'Sin comprobante'
  return 'Sin factura'
})

const icono = computed(() =>
  activa.value === 'sin_cargo' ? 'mdi-cash-off' : 'mdi-file-remove-outline')

// Clic en la opcion ya marcada = quitarla y volver a lo normal (requiere
// factura). Mismo gesto que el filtro de tipos del panel de notificaciones.
const elegir = (op) => {
  if (activa.value === op.clave) return quitar()
  return op.clave === 'sin_cargo' ? marcarSinCargo() : marcarSinComprobante()
}

const aplicar = async (patchDe, exito) => {
  const objetivo = props.orders.filter(o => !(o.invoices || []).some(f => f.es_fiscal))
  cargando.value = true
  try {
    for (const o of objetivo) {
      await OrderDataService.patch(o.id, patchDe(o))
    }
    const salteadas = props.orders.length - objetivo.length
    Toast.fire({
      timer: 2400, icon: 'success',
      title: salteadas ? `${exito} (${salteadas} con factura fiscal se saltearon)` : exito,
    })
    emit('aplicado')
  } catch (err) {
    const d = err.response?.data
    const msg = d?.requiere_pago?.[0] || d?.wants_invoice?.[0] || d?.detail
              || 'No se pudo actualizar alguna orden.'
    Swal.fire('No se pudo', msg, 'error')
  } finally {
    cargando.value = false
  }
}

const marcarSinComprobante = async () => {
  const n = props.orders.length
  const r = await Swal.fire({
    title: '¿Sin comprobante?',
    html: `Se cobra pero no lleva factura. Elige la moneda del registro interno de abonos:`,
    icon: 'question',
    input: 'select',
    inputOptions: { PEN: 'Soles (S/)', USD: 'Dólares ($)' },
    inputValue: 'PEN',
    showCancelButton: true,
    confirmButtonText: 'Sí, sin comprobante', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  const currency = r.value || 'PEN'
  await aplicar(() => ({ wants_invoice: false, requiere_pago: true, currency }),
                n === 1 ? 'Marcada sin comprobante' : 'Marcadas sin comprobante')
}

// Sin cargo no pregunta moneda: no hay nada que cobrar, asi que no nace ninguna
// factura donde guardarla.
const marcarSinCargo = async () => {
  const n = props.orders.length
  const r = await Swal.fire({
    title: n === 1 ? '¿Sin cargo?' : `¿Sin cargo las ${n}?`,
    html: 'No se va a cobrar: no se genera factura ni se pueden registrar abonos. '
        + 'Es para equipos propios o trabajos de cortesía.',
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Sí, sin cargo', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  await aplicar(() => ({ requiere_pago: false }),
                n === 1 ? 'Marcada sin cargo' : `${n} marcadas sin cargo`)
}

// Vuelve a lo normal: requiere factura fiscal.
const quitar = async () => {
  const r = await Swal.fire({
    title: '¿Quitar la marca?',
    html: 'La orden vuelve a requerir factura. Si tenía un contenedor de abonos vacío, se descarta.',
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Sí, quitar', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  await aplicar(() => ({ wants_invoice: true, requiere_pago: true }), 'Marca quitada')
}
</script>
