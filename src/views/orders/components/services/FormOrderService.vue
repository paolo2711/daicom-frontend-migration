<template>
  <workspace-layout :detalle-abierto="Boolean(elegida)" @cerrar="cerrarPanel">
    <template v-if="$slots.orden" #apoyo="{ apilado }">
      <div class="titulo-de-hoja">Orden</div>
      <div class="px-3 pb-3">
        <slot name="orden" :apilado="apilado" />
      </div>
    </template>

    <template #lista>
      <div class="titulo-de-hoja titulo-principal flex-wrap ga-2 py-2">
        <span class="mr-auto">Equipos <span class="text-medium-emphasis font-weight-regular">({{ equipments.length }})</span></span>
        <paginated-autocomplete ref="buscador" v-model="buscado" :fetch="fetchEquipments" :mapper="EquipmentMappers.getMap"
                                recurso="equipos" label="Agregar equipo del catálogo" :return-object="false"
                                item-title="name" item-value="id" prepend-inner-icon="mdi-magnify"
                                density="compact" variant="outlined" hide-details class="buscador-de-equipo"
                                @selected="agregar" />
        <v-text-field v-model="correlativo" label="Certificado existente" type="number" class="campo-corto"
                      density="compact" variant="outlined" hide-details @keyup.enter="vincular">
          <template #append-inner>
            <v-btn icon size="small" variant="text" color="primary" :loading="buscandoCertificado" @click="vincular">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
          </template>
          <template v-if="puedeCrearEquipo" #append>
            <add-new-button texto="Nuevo equipo en el catálogo" @click="equipoMaestroModalRef?.open()" />
          </template>
        </v-text-field>
      </div>

      <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
        <v-table v-if="equipments.length > 0" density="compact" class="lista-de-equipos" fixed-header>
          <thead>
            <tr>
              <th style="width: 9rem;">N° estimado</th>
              <th style="width: 26%;">Equipo</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Serie / Código</th>
              <th>Servicio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <row-order-service v-for="(eq, index) in equipments" :key="clave(eq)"
                               v-bind="arrastrable(index)" :class="claseDe(index)" :eq="eq" :indice="index"
                               :estimado="numerosEstimados[index]" :error="errores[index]" :asa="asa(index)"
                               :elegida="eq === elegida" @elegir="elegida = eq" @borrar="borrarFila" />
          </tbody>
        </v-table>
        <div v-else class="d-flex flex-column align-center justify-center fill-height ga-2 pa-8 text-medium-emphasis">
          <v-icon size="x-large">mdi-toolbox-outline</v-icon>
          Agrega un equipo con el buscador de arriba.
        </div>
      </div>
      <equipo-maestro-modal ref="equipoMaestroModalRef" @reload="buscador?.reload()" />
    </template>

    <template #detalle>
      <panel-order-service :eq="elegida" :indice="indiceElegida" :estimado="numerosEstimados[indiceElegida]"
                           :error="errores[indiceElegida]" @cerrar="cerrarPanel" @otro-igual="otroIgual"
                           @borrar="borrarFila" />
    </template>

    <template #sin-detalle>
      <div class="titulo-de-hoja">Equipo</div>
      <div class="px-4 text-body-2 text-medium-emphasis">Elige un equipo de la lista para ver y llenar sus datos.</div>
    </template>
  </workspace-layout>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, getCurrentInstance } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import AddNewButton from '@/components/commonComponents/AddNewButton.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import RowOrderService from './RowOrderService.vue'
import PanelOrderService from './PanelOrderService.vue'
import CertificateDataService from '@/services/certificates/certificateDataService'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import EquipmentMappers from '@/mappers/equipmentMappers'
import EquipoMaestroModal from '@/views/equipments/components/EquipoMaestroModal.vue'
import CorrelativeDataService from '@/services/correlative/correlativeDataService'
import { useOrderServices } from '@/composables/useOrderServices'
import { vivo } from '@/utils/certificates/estado'
import { useRowErrors } from '@/composables/useRowErrors'
import { useRowDrag } from '@/composables/useRowDrag'
import { usePermissions } from '@/composables/usePermissions'
import { EDITAR_CATALOGO } from '@/utils/equipments/catalogo'

const emit = defineEmits(['update-list'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const { opciones } = useOrderServices()
const base_correlatives = ref({ 1: null, 2: null, 3: null })
const equipments = ref([])
const { errores, marcarErrores } = useRowErrors(equipments)
const { asa, arrastrable, claseDe, clave } = useRowDrag(equipments)

// La fila abierta en el panel.
const elegida = ref(null)
const indiceElegida = computed(() => equipments.value.indexOf(elegida.value))

const fetchEquipments = (page, size, query) => EquipmentDataService.getFiltered(page, size, query)
const buscador = ref(null)
const buscado = ref(null)
const equipoMaestroModalRef = ref(null)
// Un equipo nuevo en el catalogo es parte de editarlo: sin el permiso, se pide a quien lo tenga.
const puedeCrearEquipo = usePermissions().hasAction(EDITAR_CATALOGO)

watch(equipments, (val) => { emit('update-list', val) }, { deep: true })

onMounted(initCorrelatives)

async function initCorrelatives() {
  try {
    const { data } = await CorrelativeDataService.getTodos()
    base_correlatives.value = data
  } catch (e) {
    console.error('No se pudieron cargar los correlativos base', e)
  }
}

const conCeros = (n) => (n == null ? '…' : String(n).padStart(8, '0'))

// El numero que tomaria una fila nueva si nadie mas toma numeros antes de guardar.
function estimadoDe(index) {
  const fila = equipments.value[index]
  const base = base_correlatives.value[fila.certificate_type]
  if (!base) return null
  const antes = equipments.value.slice(0, index).filter(e => e.modo === 'nuevo' && e.certificate_type === fila.certificate_type)
  return Number(base) + antes.length
}

const estimados = () => equipments.value.map((e, i) => (e.modo === 'nuevo' ? estimadoDe(i) : null))
const numerosEstimados = computed(() => estimados().map(n => conCeros(n)))

function abrir(fila, despuesDe = equipments.value.length - 1) {
  equipments.value.splice(despuesDe + 1, 0, fila)
  elegida.value = fila
}

// El servicio se repite del ultimo equipo agregado. El laboratorio es el del equipo, o el
// del ultimo si es el mismo equipo.
function agregar(equipo) {
  if (!equipo) return
  const anterior = equipments.value.findLast(e => e.modo === 'nuevo')
  const igual = anterior?.name === equipo.name ? anterior : null
  abrir({
    modo: 'nuevo',
    name: equipo.name,
    lab: equipo.laboratorio?.id ?? igual?.lab ?? null,
    lab_data: equipo.laboratorio ?? igual?.lab_data ?? null,
    tipo_servicio: anterior?.tipo_servicio ?? null,
    certificate_type: anterior?.certificate_type ?? null,
  })
  nextTick(() => { buscado.value = null })
}

function otroIgual() {
  const { name, lab, lab_data, tipo_servicio, certificate_type, marca, modelo } = elegida.value
  abrir({ modo: 'nuevo', name, lab, lab_data, tipo_servicio, certificate_type, marca, modelo }, indiceElegida.value)
}

function cerrarPanel() {
  elegida.value = null
  nextTick(() => buscador.value?.$el.querySelector('input')?.focus())
}

function borrarFila(indice) {
  if (equipments.value[indice] === elegida.value) elegida.value = null
  equipments.value.splice(indice, 1)
}

const correlativo = ref('')
const buscandoCertificado = ref(false)

async function vincular() {
  if (!correlativo.value) return
  buscandoCertificado.value = true
  try {
    const res = await CertificateDataService.getFiltered({ page_size: 50, correlative: Number(correlativo.value) })
    const cert = res.data.results.find(c => !c.order && vivo(c))
    if (!cert) {
      $swal.fire('No encontrado', 'No se encontró un certificado suelto o válido con ese número.', 'warning')
      return
    }
    if (equipments.value.some(e => e.modo === 'existente' && e.cert_id === cert.id)) {
      $swal.fire('Atención', 'Este certificado ya está en la lista.', 'warning')
      return
    }
    abrir({
      modo: 'existente',
      cert_id: cert.id,
      name: cert.equipment,
      registry_code: cert.registry_code,
      lab: cert.lab,
      lab_data: cert.lab_data,
      certificate_type: cert.certificate_type,
      // El servicio de un certificado suelto es el primero que lleva su tipo, como lo decide el back.
      tipo_servicio: opciones.value.find(o => o.certificate_type === cert.certificate_type)?.tipo_servicio,
      marca: cert.brand,
      modelo: cert.model,
      serie: cert.serie,
    })
    correlativo.value = ''
  } catch {
    $swal.fire('Error', 'Hubo un problema al buscar el certificado.', 'error')
  } finally {
    buscandoCertificado.value = false
  }
}

// Las de un borrador o las de una cotizacion.
function cargarFilas({ items }) {
  equipments.value = [...items]
}

defineExpose({ cargarFilas, marcarErrores, estimados })
</script>

<style scoped>
.buscador-de-equipo { width: 22rem; flex: 0 1 22rem; }
.lista-de-equipos thead th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)) !important;
}
</style>
