<template>
  <v-dialog v-model="abierto" class="dialog-premium" width="90%" max-width="32rem" persistent>
    <v-card v-if="linea">
      <base-modal-header :title="`Cambiar servicio · ${linea.equipo}`" icon="mdi-swap-horizontal" @close="cerrar" />

      <v-card-text class="d-flex flex-column ga-3 pt-4">
        <v-select v-model="opcion" :items="itemsDeSeleccion(opciones)" label="Servicio"
                  density="compact" variant="outlined" rounded="lg" hide-details />
        <paginated-autocomplete v-if="creaCertificado" v-model="lab" :fetch="fetchLabs" :mapper="LabMappers.getMap"
                                recurso="labs" :seed="linea.lab_data" label="Laboratorio del certificado"
                                :return-object="false" item-title="name" item-value="id"
                                density="compact" variant="outlined" rounded="lg" hide-details />
        <div v-if="creaCertificado" class="text-body-2 text-medium-emphasis">
          Se crea su certificado con el número que toque hoy.
        </div>
        <div v-else-if="anulaCertificado" class="text-body-2 text-warning">
          Se anula su certificado {{ linea.certificate.registry_code }}: el número no se vuelve a dar.
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="cerrar">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :loading="guardando"
               :disabled="!opcion || opcion === actual || (creaCertificado && !lab)" @click="guardar">
          Cambiar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import LabDataService from '@/services/labs/labDataService'
import OrderDataService from '@/services/orders/orderDataService'
import LabMappers from '@/mappers/labMappers'
import { useActionCall } from '@/composables/useActionCall'
import { conOpcion, itemsDeSeleccion, opcionDe, useOrderServices } from '@/composables/useOrderServices'
import { servicioDe } from '@/utils/orders/lineas'

// La linea a cambiar, o null con el dialogo cerrado.
const linea = defineModel({ type: Object, default: null })
const emit = defineEmits(['cambiado'])

const { llamarSinPreguntar } = useActionCall()
const { opciones } = useOrderServices()
const fetchLabs = (page, size, query) => LabDataService.getFiltered(page, size, query)

const abierto = computed({ get: () => Boolean(linea.value), set: (si) => { if (!si) cerrar() } })
const opcion = ref(null)
const lab = ref(null)
const guardando = ref(false)
const actual = computed(() => linea.value && opcionDe(servicioDe(linea.value)))

watch(linea, (l) => {
  opcion.value = l ? opcionDe(servicioDe(l)) : null
  lab.value = l?.lab ?? null
})

const elegida = computed(() => {
  const fila = {}
  conOpcion(fila, opcion.value, opciones.value)
  return fila
})
const creaCertificado = computed(() => Boolean(elegida.value.certificate_type && !linea.value?.certificate))
const anulaCertificado = computed(() => Boolean(opcion.value && !elegida.value.certificate_type && linea.value?.certificate))

function cerrar() {
  linea.value = null
}

async function guardar() {
  guardando.value = true
  const hecho = await llamarSinPreguntar(
    () => OrderDataService.cambiarServicioDeLinea(linea.value.id, { ...elegida.value, lab: lab.value }),
    'Servicio cambiado', 'No se pudo cambiar el servicio.')
  guardando.value = false
  if (!hecho) return
  emit('cambiado')
  cerrar()
}
</script>
