<template>
  <v-dialog v-model="dialog" class="dialog-premium" width="460" persistent>
    <v-card>
      <base-modal-header title="Descargar precios" icon="mdi-file-download-outline" @close="close" />

      <v-card-text class="pt-4">
        <div class="text-body-2 text-medium-emphasis mb-2">
          Servicios a incluir. El Excel abre filtrado en el primero.
        </div>
        <v-checkbox v-for="tipo in tipos" :key="tipo.value" v-model="elegidos" :value="tipo.value"
                    :label="tipo.title" density="compact" hide-details />
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :loading="descargando"
               :disabled="!elegidos.length" @click="descargar">
          Descargar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Swal from 'sweetalert2'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { guardarArchivo } from '@/utils/files'
import { hoyISO } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'

const tipos = useServiceTypes()
const dialog = ref(false)
const elegidos = ref([])
const descargando = ref(false)

async function descargar() {
  descargando.value = true
  try {
    // En el orden de la lista: el Excel abre filtrado en el primero elegido.
    const servicios = tipos.value.map(t => t.value).filter(v => elegidos.value.includes(v))
    guardarArchivo(await EquipmentDataService.descargarPrecios(servicios), `Precios ${hoyISO()}.xlsx`)
    close()
  } catch (e) {
    Swal.fire('No se descargó', mensajeDeError(e, 'No se pudo armar el Excel de precios.'), 'error')
  } finally {
    descargando.value = false
  }
}

const todos = () => tipos.value.map(t => t.value)

function open() {
  elegidos.value = todos()
  dialog.value = true
}

// Si se abrio antes de que llegaran los tipos, se marcan al llegar.
watch(tipos, () => {
  if (dialog.value && !elegidos.value.length) elegidos.value = todos()
})

const close = () => { dialog.value = false }

defineExpose({ open })
</script>
