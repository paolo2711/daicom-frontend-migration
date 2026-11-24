<template>
  <v-dialog v-model="abierto" max-width="900" class="dialog-premium" persistent @after-leave="filas = []">
    <v-card @keydown.enter="confirmarConEnter">
      <base-modal-header :title="accion.titulo" :icon="accion.icono" :iconColor="accion.color" @close="cerrar">
        <template #acciones><slot name="acciones" /></template>
      </base-modal-header>

      <v-card-text class="pt-4 pb-2">
        <p class="text-body-2 text-medium-emphasis mb-3">{{ accion.descripcion }}</p>

        <div v-if="accion.fecha || accion.opcion || $slots.opciones" class="d-flex flex-wrap align-center ga-4 mb-3">
          <v-text-field
            v-if="accion.fecha"
            v-model="fecha"
            type="date"
            :label="accion.fecha.label"
            :max="fechaMaxima"
            density="compact"
            variant="outlined"
            hide-details="auto"
            :error-messages="intento ? errorDeFecha : ''"
            class="campo-de-la-accion"
          />
          <v-select
            v-if="accion.opcion"
            v-model="opcion"
            :items="accion.opcion.items"
            :label="accion.opcion.label"
            density="compact"
            variant="outlined"
            hide-details
            class="campo-de-la-accion"
          />
          <slot name="opciones" />
        </div>

        <v-table density="compact" class="border rounded-lg bg-surface" style="max-height: 22rem; overflow-y: auto;">
          <thead>
            <tr>
              <th class="text-center columna-de-marcar">
                <v-checkbox
                  :model-value="todasMarcadas"
                  :indeterminate="algunasMarcadas"
                  @click="marcarTodas"
                  density="compact"
                  hide-details
                  color="primary"
                  :disabled="Boolean(cargando)"
                />
              </th>
              <th v-for="columna in [...columnas, 'Ahora', 'Qué va a pasar']" :key="columna" class="text-left font-weight-bold">
                {{ columna }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td :colspan="columnas.length + 3" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" size="32" class="mb-2" />
                <div class="text-caption text-medium-emphasis">{{ cargando }}</div>
              </td>
            </tr>
            <tr v-else v-for="fila in filas" :key="fila.id" :class="{ 'fila-bloqueada': bloqueada(fila) }">
              <td class="text-center">
                <v-checkbox
                  :model-value="elegidas.includes(fila)"
                  @update:model-value="alternar(fila)"
                  :disabled="bloqueada(fila)"
                  density="compact"
                  hide-details
                  color="primary"
                />
              </td>
              <slot name="celdas" :fila="fila" />
              <td class="text-caption text-medium-emphasis text-no-wrap">{{ accion.ahora(fila) }}</td>
              <td>
                <div class="d-flex align-center ga-2 que-va-a-pasar">
                  <v-icon :color="colorDe(resultado(fila).nivel)" size="small">{{ resultado(fila).icono }}</v-icon>
                  <span class="text-caption">{{ resultado(fila).titulo }}</span>
                  <slot name="fila" :fila="fila" />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <span class="text-body-2 text-medium-emphasis">
          <span class="font-weight-bold text-high-emphasis">{{ elegidas.length }}</span>
          {{ elegidas.length === 1 ? 'se procesa' : 'se procesan' }}<template v-if="noSePueden">
          · {{ noSePueden }} {{ noSePueden === 1 ? 'no se puede' : 'no se pueden' }}</template>
        </span>
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="cerrar" :disabled="procesando">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          class="font-weight-bold px-4 text-white"
          variant="flat"
          @click="confirmar"
          :loading="procesando"
          :disabled="!puedeConfirmar"
        >
          {{ accion.verbo }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <slot />
  </v-dialog>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'
import { colorDe } from '@/utils/batchLevels'
import { hoyISO } from '@/utils/dates'
import { alPresionarEnter } from '@/utils/keyboard'

const props = defineProps({
  // Por clave: titulo, icono, color, descripcion, verbo, ahora, validacion; `fecha` y `opcion` si las pide.
  // `preparar` da los datos de la fila al abrir; `impide`, si lo elegido arriba no la deja procesar.
  acciones: { type: Object, required: true },
  // Lo que dice que fila es; sus celdas van en el slot `celdas`.
  columnas: { type: Array, required: true },
  // (filas marcadas, { clave, fecha, opcion }) => guarda; si devuelve false, el modal sigue abierto.
  alConfirmar: { type: Function, required: true },
  // Se suma a lo que reciben `impide` y `validacion`.
  contexto: { type: Object, default: () => ({}) },
  // El texto mientras se buscan las filas; vacio, no carga nada.
  cargando: { type: String, default: '' },
})
const emit = defineEmits(['hecha'])
const { $swal } = getCurrentInstance().appContext.config.globalProperties

const abierto = ref(false)
const clave = ref('')
const filas = ref([])
const marcadas = ref([])
const fecha = ref('')
const opcion = ref(null)
const procesando = ref(false)
const intento = ref(false)

const accion = computed(() => props.acciones[clave.value] ?? Object.values(props.acciones)[0])
const elegido = computed(() => ({ fecha: fecha.value, opcion: opcion.value, ...props.contexto }))
const resultado = (fila) => accion.value.validacion(fila, elegido.value)
const bloqueada = (fila) => Boolean(fila.disabled || accion.value.impide?.(fila, elegido.value))

const fechaMaxima = computed(() => (accion.value.fecha?.permiteFutura === false ? hoyISO() : undefined))
const errorDeFecha = computed(() => {
  if (!accion.value.fecha) return ''
  if (!fecha.value) return 'Falta la fecha'
  return fechaMaxima.value && fecha.value > fechaMaxima.value ? 'No puede ser a futuro' : ''
})

const habilitadas = computed(() => filas.value.filter(f => !bloqueada(f)))
// Las marcadas que se pueden: una que lo elegido arriba bloquea vuelve marcada si deja de estarlo.
const elegidas = computed(() => habilitadas.value.filter(f => marcadas.value.includes(f.id)))
const noSePueden = computed(() => filas.value.length - habilitadas.value.length)
const todasMarcadas = computed(() => habilitadas.value.length > 0 && elegidas.value.length === habilitadas.value.length)
const algunasMarcadas = computed(() => elegidas.value.length > 0 && !todasMarcadas.value)

function alternar({ id }) {
  marcadas.value = marcadas.value.includes(id) ? marcadas.value.filter(m => m !== id) : [...marcadas.value, id]
}

// Marca todo lo que no esta bloqueado, tambien lo que ya estaba hecho.
function marcarTodas() {
  marcadas.value = todasMarcadas.value ? [] : habilitadas.value.map(f => f.id)
}

// Una sola condición para el botón y para el Enter, así no se separan.
const puedeConfirmar = computed(() =>
  !props.cargando && !procesando.value && elegidas.value.length > 0 && (!accion.value.opcion || opcion.value)
)
const confirmarConEnter = alPresionarEnter(() => {
  if (puedeConfirmar.value) confirmar()
})

// `forzar` marca tambien las que ya lo tienen: se pidio para esa fila puntual.
function open(cual, lista, forzar = false) {
  clave.value = cual
  fecha.value = accion.value.fecha && !accion.value.fecha.vacia ? hoyISO() : ''
  opcion.value = null
  intento.value = false
  filas.value = lista.map(fila => ({ ...fila, ...accion.value.preparar?.(fila) }))
  marcadas.value = habilitadas.value.filter(f => forzar || !f.already_has_it).map(f => f.id)
  abierto.value = true
}

// La lista se vacia en `after-leave`, para que no se vea vacia mientras el modal se va.
function cerrar() {
  abierto.value = false
}

async function confirmar() {
  if (procesando.value) return
  intento.value = true
  if (errorDeFecha.value) return
  procesando.value = true
  try {
    const lote = { clave: clave.value, fecha: fecha.value, opcion: opcion.value }
    if (await props.alConfirmar(elegidas.value, lote) === false) return
    emit('hecha', filas.value)
    cerrar()
  } catch (error) {
    const data = error.response?.data
    $swal.fire({
      icon: 'error', title: 'Error',
      html: [data?.error || 'Hubo un problema al ejecutar la acción.', ...(data?.rechazos || [])].join('<br>'),
    })
  } finally {
    procesando.value = false
  }
}

defineExpose({ open, filas, marcadas })
</script>

<style scoped>
/* La ultima celda queda entera: ahi va el boton que puede desbloquear la fila. */
.fila-bloqueada :deep(td:not(:last-child)) {
  opacity: 0.55;
}

.campo-de-la-accion {
  max-width: 16.25rem;
}

.que-va-a-pasar {
  min-width: 13rem;
}

.columna-de-marcar {
  width: 3.125rem;
}
</style>
