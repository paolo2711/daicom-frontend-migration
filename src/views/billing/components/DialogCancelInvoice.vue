<template>
  <dialog-baja v-model="abierto" :titulo="`Anular ${factura?.invoice_number}`" :largo="LARGO_DEL_MOTIVO">
    <div class="text-body-2">
      Se manda la comunicación de baja a SUNAT, que responde en unos minutos. Al quedar anulada, sus abonos se
      quedan en ella y sus órdenes quedan libres para facturar de nuevo.
    </div>

    <template #acciones="{ motivo }">
      <v-btn color="error" variant="flat" class="font-weight-bold px-4" :disabled="!motivo" :loading="anulando"
             @click="anular(motivo)">
        Anular
      </v-btn>
    </template>
  </dialog-baja>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { mensajeDeError } from '@/utils/errors'
import DialogBaja from './DialogBaja.vue'

// La factura a anular, o null con el dialogo cerrado.
const factura = defineModel({ type: Object, default: null })
const emit = defineEmits(['enviada'])

// El que acepta SUNAT en la comunicacion de baja.
const LARGO_DEL_MOTIVO = 100

const swal = useSwal()
const anulando = ref(false)
const abierto = computed({ get: () => Boolean(factura.value), set: (si) => { if (!si) factura.value = null } })

async function anular (motivo) {
  anulando.value = true
  try {
    const { data } = await BillingDataService.cancelInvoice(factura.value.id, motivo)
    emit('enviada', data)
    factura.value = null
  } catch (error) {
    swal.fire({ icon: 'error', title: 'No se anuló', text: mensajeDeError(error, 'No se pudo anular la factura.') })
  } finally {
    anulando.value = false
  }
}
</script>
