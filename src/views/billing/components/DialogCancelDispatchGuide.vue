<template>
  <v-dialog v-model="abierto" class="dialog-premium" width="90%" max-width="34rem" persistent>
    <v-card v-if="guia">
      <base-modal-header :title="`Anular ${guia.numero}`" icon="mdi-cancel" @close="cerrar" />

      <v-card-text class="d-flex flex-column ga-3 pt-4">
        <div v-if="sinSunat" class="text-body-2">Nunca llegó a SUNAT: se anula solo en la app, sin baja en SOL.</div>
        <div v-else class="text-body-2">
          La baja se da en SOL:
          <strong>Empresas → Guía de Remisión Electrónica → Dar de Baja GRE Remitente</strong>.
          SUNAT solo la permite antes de que salga el traslado.
        </div>
        <div class="text-body-2 text-medium-emphasis">Su PDF queda sellado como anulado.</div>
        <v-textarea v-model="motivo" label="Motivo de la baja" rows="2" auto-grow
                    density="compact" variant="outlined" rounded="lg" hide-details />
      </v-card-text>

      <v-card-actions class="px-6 pb-4 flex-wrap ga-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="cerrar">Cancelar</v-btn>
        <v-btn v-if="sinSunat" color="primary" variant="flat" class="font-weight-bold px-4"
               :disabled="!motivo.trim()" :loading="anulando === true" @click="anular(true)">
          Anular
        </v-btn>
        <template v-else>
          <v-btn variant="outlined" class="font-weight-bold px-4" :disabled="!motivo.trim()"
                 :loading="anulando === false" @click="anular(false)">
            La daré de baja después
          </v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :disabled="!motivo.trim()"
                 :loading="anulando === true" @click="anular(true)">
            Ya la di de baja en SOL
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { POR_ENVIAR } from '@/utils/billing/guias'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'

// La guia a anular, o null con el dialogo cerrado. La baja ante SUNAT se da en SOL.
const guia = defineModel({ type: Object, default: null })
const emit = defineEmits(['anulada'])

const swal = useSwal()
const motivo = ref('')
// El boton que se esta enviando: true, false o null.
const anulando = ref(null)
// La que no llego a SUNAT no se da de baja en SOL.
const sinSunat = computed(() => guia.value?.estado === POR_ENVIAR)
const abierto = computed({ get: () => Boolean(guia.value), set: (si) => { if (!si) cerrar() } })

watch(guia, () => { motivo.value = '' })

function cerrar () {
  guia.value = null
}

async function anular (yaEnSol) {
  anulando.value = yaEnSol
  try {
    const { data } = await BillingDataService.cancelDispatchGuide(guia.value.id,
                                                                  { motivo: motivo.value, ya_en_sol: yaEnSol })
    avisarHecho(`${data.numero} anulada`, { warning: data.baja_en_sol
      ? data.warning : 'Queda en Tus pendientes hasta que la des de baja en SOL.' })
    emit('anulada', data)
    cerrar()
  } catch (error) {
    swal.fire({ icon: 'error', title: 'No se anuló', text: mensajeDeError(error, 'No se pudo anular la guía.') })
  } finally {
    anulando.value = null
  }
}
</script>
