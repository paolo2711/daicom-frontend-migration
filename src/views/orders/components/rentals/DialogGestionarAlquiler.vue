<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="620" persistent>
    <v-card v-if="linea">
      <base-modal-header :title="linea.equipment_internal_id" icon="mdi-truck-delivery" icon-color="amber-darken-3"
                         @close="close">
        {{ linea.equipment_name }}
      </base-modal-header>

      <v-card-text class="pt-5">
        <div class="text-body-2 mb-5 font-weight-bold" :class="`text-${presentacion.color}`">{{ presentacion.texto }}</div>

        <v-form ref="deLasFechas" @submit.prevent>
          <v-row dense>
            <v-col v-if="'departure_date' in fechas" cols="12" sm="6">
              <v-text-field v-model="fechas.departure_date" :label="FECHAS_ALQUILER.departure_date" type="date"
                            variant="outlined" density="compact" :rules="[obligatoria]" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="fechas.expected_return_date" :label="FECHAS_ALQUILER.expected_return_date"
                            type="date" :min="fechas.departure_date || undefined" variant="outlined"
                            density="compact" clearable :rules="[reglaNoAntesDe(fechas.departure_date)]" />
            </v-col>
            <v-col v-if="'actual_return_date' in fechas" cols="12" sm="6">
              <v-text-field v-model="fechas.actual_return_date" :label="FECHAS_ALQUILER.actual_return_date"
                            type="date" :min="fechas.departure_date" :max="hoy" variant="outlined" density="compact"
                            :rules="[obligatoria, reglaNoFutura(hoy), reglaNoAntesDe(fechas.departure_date)]" />
            </v-col>
          </v-row>
        </v-form>

        <v-form v-if="paso" ref="delPaso" @submit.prevent>
          <v-divider class="mt-2 mb-4" />
          <div class="text-subtitle-2 font-weight-bold mb-3">{{ paso.titulo }}</div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="fechaDelPaso" :label="FECHAS_ALQUILER[paso.campo]" type="date"
                            :min="esDevolucion ? fechas.departure_date : undefined" :max="esDevolucion ? hoy : undefined"
                            variant="outlined" density="compact" :rules="reglasDelPaso" />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-0 flex-wrap ga-2">
        <v-btn v-if="linea.estado === 'devuelto'" variant="tonal" color="warning" class="font-weight-bold px-4"
               prepend-icon="mdi-undo" :disabled="ocupado" @click="deshacerDevolucion">
          Deshacer devolución
        </v-btn>
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" :disabled="ocupado" @click="close">Cancelar</v-btn>
        <v-btn v-if="paso" variant="text" class="font-weight-bold" :disabled="!hayCambios || ocupado"
               @click="guardarFechas">
          Guardar fechas
        </v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :loading="ocupado"
               :disabled="!paso && !hayCambios" @click="paso ? darPaso() : guardarFechas()">
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
import { ESTADOS_ALQUILER, FECHAS_ALQUILER, reglaNoAntesDe, reglaNoFutura } from '@/utils/orders/alquiler'
import { hoyISO } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

// Las fechas que se corrigen en cada estado; el back aplica la misma regla.
const FECHAS_EDITABLES = {
  reservado: ['expected_return_date'],
  en_obra: ['departure_date', 'expected_return_date'],
  devuelto: ['departure_date', 'expected_return_date', 'actual_return_date'],
}

const PASOS = {
  reservado: { clave: 'inicio', campo: 'departure_date', titulo: 'Registrar el inicio', boton: 'Registrar inicio', hecho: 'Inicio registrado' },
  en_obra: { clave: 'devolucion', campo: 'actual_return_date', titulo: 'Registrar la devolución', boton: 'Registrar devolución', hecho: 'Devolución registrada' },
}

const dialog = ref(false)
const linea = ref(null)
const fechas = ref({})
const originales = ref({})
const fechaDelPaso = ref('')
const hoy = ref('')
const deLasFechas = ref(null)
const delPaso = ref(null)
const ocupado = ref(false)

const presentacion = computed(() => ESTADOS_ALQUILER[linea.value.estado])
const paso = computed(() => PASOS[linea.value.estado] || null)
const esDevolucion = computed(() => paso.value?.clave === 'devolucion')

const cambios = computed(() => Object.fromEntries(
  Object.entries(fechas.value)
    .filter(([campo, valor]) => valor !== originales.value[campo])
    .map(([campo, valor]) => [campo, valor || null])
))
const hayCambios = computed(() => Object.keys(cambios.value).length > 0)

const obligatoria = (v) => !!v || 'Obligatoria'
const reglasDelPaso = computed(() => (esDevolucion.value
  ? [obligatoria, reglaNoFutura(hoy.value), reglaNoAntesDe(fechas.value.departure_date)] : [obligatoria]))

function open(rental) {
  linea.value = rental
  hoy.value = hoyISO()
  fechas.value = Object.fromEntries((FECHAS_EDITABLES[rental.estado] || []).map(c => [c, rental[c] || '']))
  originales.value = { ...fechas.value }
  fechaDelPaso.value = esDevolucion.value ? hoy.value : ''
  dialog.value = true
}

function close() {
  dialog.value = false
}

// Se revisa al guardar: una fecha puede dejar mal a otra que no se toco.
async function estanBien(formularios) {
  const revisados = await Promise.all(formularios.map(f => f.value.validate()))
  return revisados.every(({ valid }) => valid)
}

async function intentar(accion, hecho, ...formularios) {
  if (ocupado.value) return
  ocupado.value = true
  try {
    if (!(await estanBien(formularios))) return
    await accion()
    Toast.fire({ timer: 2200, icon: 'success', title: hecho })
    close()
  } catch (error) {
    $swal.fire('No se guardó', mensajeDeError(error, 'No se pudo guardar.'), 'error')
  } finally {
    ocupado.value = false
  }
}

const guardarCambios = () => (hayCambios.value
  ? OrderDataService.updateRentalDates(linea.value.id, cambios.value)
  : Promise.resolve())

const guardarFechas = () => intentar(guardarCambios, 'Fechas guardadas', deLasFechas)

// Si tambien se corrigio una fecha, se guarda antes de dar el paso.
const darPaso = () => intentar(async () => {
  await guardarCambios()
  await OrderDataService.darPasoDeAlquiler(linea.value.id, paso.value.clave, fechaDelPaso.value)
}, paso.value.hecho, deLasFechas, delPaso)

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
