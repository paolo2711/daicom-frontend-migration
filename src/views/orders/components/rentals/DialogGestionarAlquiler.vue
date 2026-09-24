<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="620" persistent>
    <v-card v-if="linea">
      <base-modal-header :title="linea.equipment_internal_id" icon="mdi-truck-delivery" icon-color="amber-darken-3"
                         @close="close">
        {{ linea.equipment_name }}
      </base-modal-header>

      <v-card-text class="pt-5">
        <div class="text-body-2 mb-5">
          <span class="font-weight-bold" :class="`text-${presentacion.color}`">{{ presentacion.texto }}</span>
          <span v-if="duracion" class="text-medium-emphasis"> · {{ duracion }}</span>
        </div>

        <v-form v-model="valido" @submit.prevent>
          <v-row dense>
            <v-col v-if="'departure_date' in fechas" cols="12" sm="6">
              <v-text-field v-model="fechas.departure_date" :label="FECHAS_ALQUILER.departure_date" type="date"
                            :max="hoy" variant="outlined" density="compact" :rules="[obligatoria, noFutura]" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="fechas.expected_return_date" :label="FECHAS_ALQUILER.expected_return_date"
                            type="date" :min="fechas.departure_date || undefined" variant="outlined"
                            density="compact" clearable :rules="[noAntesDeLaSalida]" />
            </v-col>
            <v-col v-if="'actual_return_date' in fechas" cols="12" sm="6">
              <v-text-field v-model="fechas.actual_return_date" :label="FECHAS_ALQUILER.actual_return_date"
                            type="date" :min="fechas.departure_date" :max="hoy" variant="outlined"
                            density="compact" :rules="[obligatoria, noFutura, noAntesDeLaSalida]" />
            </v-col>
          </v-row>

          <template v-if="paso">
            <v-divider class="mt-2 mb-4" />
            <div class="text-subtitle-2 font-weight-bold mb-3">{{ paso.titulo }}</div>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field v-model="fechaDelPaso" :label="FECHAS_ALQUILER[paso.campo]" type="date"
                              :min="paso.clave === 'devolucion' ? fechas.departure_date : undefined" :max="hoy"
                              variant="outlined" density="compact"
                              :rules="[obligatoria, noFutura, v => paso.clave !== 'devolucion' || noAntesDeLaSalida(v)]" />
              </v-col>
            </v-row>
          </template>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-0 flex-wrap ga-2">
        <v-btn v-if="linea.estado === 'devuelto'" variant="tonal" color="warning" class="font-weight-bold px-4"
               prepend-icon="mdi-undo" :disabled="ocupado" @click="deshacerDevolucion">
          Deshacer devolución
        </v-btn>
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" :disabled="ocupado" @click="close">Cancelar</v-btn>
        <v-btn v-if="paso" variant="text" class="font-weight-bold" :disabled="!valido || !hayCambios || ocupado"
               @click="guardarFechas">
          Guardar fechas
        </v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :loading="ocupado"
               :disabled="!valido || (!paso && !hayCambios)" @click="paso ? darPaso() : guardarFechas()">
          {{ paso ? paso.boton : 'Guardar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { ref, computed, getCurrentInstance } from 'vue'
import OrderDataService from '@/services/orders/orderDataService'
import { ESTADOS_ALQUILER, FECHAS_ALQUILER, duracionDe } from '@/utils/orders/alquiler'
import { hoyISO } from '@/utils/dates'

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

// Las fechas que se corrigen en cada estado; el back aplica la misma regla.
const FECHAS_EDITABLES = {
  reservado: ['expected_return_date'],
  en_obra: ['departure_date', 'expected_return_date'],
  devuelto: ['departure_date', 'expected_return_date', 'actual_return_date'],
}

const PASOS = {
  reservado: { clave: 'salida', campo: 'departure_date', titulo: 'Registrar la salida', boton: 'Registrar salida', hecho: 'Salida registrada' },
  en_obra: { clave: 'devolucion', campo: 'actual_return_date', titulo: 'Registrar la devolución', boton: 'Registrar devolución', hecho: 'Devolución registrada' },
}

const dialog = ref(false)
const linea = ref(null)
const fechas = ref({})
const originales = ref({})
const fechaDelPaso = ref('')
const hoy = ref('')
const valido = ref(false)
const ocupado = ref(false)

const presentacion = computed(() => ESTADOS_ALQUILER[linea.value.estado])
const duracion = computed(() => duracionDe(linea.value))
const paso = computed(() => PASOS[linea.value.estado] || null)

const cambios = computed(() => Object.fromEntries(
  Object.entries(fechas.value)
    .filter(([campo, valor]) => valor !== originales.value[campo])
    .map(([campo, valor]) => [campo, valor || null])
))
const hayCambios = computed(() => Object.keys(cambios.value).length > 0)

const obligatoria = (v) => !!v || 'Obligatoria'
const noFutura = (v) => !v || v <= hoy.value || 'No puede ser a futuro'
const noAntesDeLaSalida = (v) =>
  !v || !fechas.value.departure_date || v >= fechas.value.departure_date || 'Es antes de la salida'

function open(rental) {
  linea.value = rental
  hoy.value = hoyISO()
  fechas.value = Object.fromEntries((FECHAS_EDITABLES[rental.estado] || []).map(c => [c, rental[c] || '']))
  originales.value = { ...fechas.value }
  fechaDelPaso.value = hoy.value
  dialog.value = true
}

function close() {
  dialog.value = false
}

async function intentar(accion, hecho) {
  ocupado.value = true
  try {
    await accion()
    Toast.fire({ timer: 2200, icon: 'success', title: hecho })
    close()
  } catch (error) {
    $swal.fire('Error', error.response?.data?.error || 'No se pudo guardar.', 'error')
  } finally {
    ocupado.value = false
  }
}

const guardarCambios = () => (hayCambios.value
  ? OrderDataService.updateRentalDates(linea.value.id, cambios.value)
  : Promise.resolve())

const guardarFechas = () => intentar(guardarCambios, 'Fechas guardadas')

// Si tambien se corrigio una fecha, se guarda antes de dar el paso.
const darPaso = () => intentar(async () => {
  await guardarCambios()
  await OrderDataService.darPasoDeAlquiler(linea.value.id, paso.value.clave, fechaDelPaso.value)
}, paso.value.hecho)

async function deshacerDevolucion() {
  const { isConfirmed } = await $swal.fire({
    title: '¿Deshacer la devolución?',
    text: `${linea.value.equipment_internal_id} vuelve a figurar en obra.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, deshacer',
    cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return
  intentar(() => OrderDataService.darPasoDeAlquiler(linea.value.id, 'deshacer-devolucion'), 'Devolución deshecha')
}

defineExpose({ open })
</script>
