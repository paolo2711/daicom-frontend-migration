<template>
  <div>
    <v-card variant="flat" class="border pa-4 rounded-lg" :color="isDark ? '#1E1E1E' : 'grey-lighten-4'">
      <div class="d-flex align-center mb-3">
        <div class="text-subtitle-1 font-weight-bold" :class="isDark ? 'text-white' : 'text-grey-darken-3'">
          <v-icon size="small" class="mr-1">mdi-plus-circle</v-icon> Configurar Equipo
        </div>
        
        <v-spacer />

        <v-radio-group v-model="temp_eq.modo" inline density="compact" hide-details class="mt-0 pt-0" style="flex: 0 0 auto;">
          <v-radio label="Crear Nuevo" value="nuevo" color="primary" />
          <v-radio label="Vincular" value="existente" color="secondary" class="ml-4" />
        </v-radio-group>
      </div>

      <template v-if="temp_eq.modo === 'nuevo'">
            <v-row dense>
              <v-col cols="12" md="9">
                <paginated-autocomplete ref="equipCatalogRef" v-model="temp_eq.name" :fetch="fetchEquipments" :mapper="EquipmentMappers.getMap"
                                recurso="equipos" :seed="semillaDeEquipo(temp_eq.name)"
                                label="Equipo" :return-object="false" item-title="name" item-value="id"
                                density="compact" variant="outlined" hide-details="auto"
                                prepend-inner-icon="mdi-toolbox-outline" clearable />
              </v-col>
              <v-col cols="12" md="3" class="ml-auto">
                <v-btn color="primary" variant="flat" block class="font-weight-bold" style="height: 40px;" @click="equipoMaestroModalRef?.open()">
                  <template #prepend><v-icon>mdi-plus</v-icon></template>
                  CATALOGO
                </v-btn>
              </v-col>
            </v-row>

        <v-row dense class="mt-2">
          <v-col cols="12" md="5">
            <paginated-autocomplete v-model="temp_eq.lab" :fetch="fetchLabs" :mapper="LabMappers.getMap"
                            recurso="labs" :seed="labSeleccionado"
                            @selected="l => labSeleccionado = l"
                            label="Laboratorio" :return-object="false" item-title="name" item-value="id"
                            density="compact" variant="outlined" hide-details="auto" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="temp_eq.certificate_type" :items="TIPOS_CERTIFICADO" density="compact" variant="outlined"
                      hide-details="auto" label="Tipo de Certificación" />
          </v-col>
          <v-col v-if="siguienteEstimado" cols="12" md="3" class="text-caption text-medium-emphasis align-self-center">
            Siguiente estimado: <span class="numero-estimado">{{ siguienteEstimado }}</span>
          </v-col>
        </v-row>
      </template>

      <v-row dense v-else align="center">
        <v-col cols="8" md="8">
          <v-text-field v-model="temp_eq.correlative_busqueda" label="Nro. Correlativo (Ej: 15)"
                        type="number" variant="outlined" density="compact" hide-details
                        @keyup.enter="buscarCertificadoHuerfano" />
        </v-col>
        <v-col cols="4" md="4">
          <v-btn color="secondary" block variant="flat" @click="buscarCertificadoHuerfano" :loading="buscando_cert">
            <template #prepend><v-icon size="small">mdi-magnify</v-icon></template>
            Buscar
          </v-btn>
        </v-col>
        <v-col cols="12" v-if="certificado_encontrado" class="mt-1">
          <v-chip color="success" variant="outlined" label class="justify-center font-weight-bold" style="height: 38px; width: 100%;">
            <template #prepend><v-icon size="small">mdi-check-circle</v-icon></template>
            {{ certificado_encontrado.equipment }} ({{ certificado_encontrado.registry_code }})
          </v-chip>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" class="text-right mt-2">
          <v-btn color="primary" variant="flat" size="small" @click="addEquipmentToBatch"
                     density="comfortable"
                     :disabled="(temp_eq.modo === 'nuevo' && (!temp_eq.name || !temp_eq.lab || !temp_eq.certificate_type)) || (temp_eq.modo === 'existente' && !certificado_encontrado)">
            <template #prepend><v-icon size="small">mdi-plus</v-icon></template>
            Añadir a la Lista
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-table density="compact" class="mt-4 tabla-mejorada" v-if="equipments.length > 0">
      <thead>
        <tr :class="isDark ? 'bg-grey-darken-3' : 'bg-grey-lighten-3'">
          <th style="width: 9rem;">N° estimado</th>
          <th>Equipo</th>
          <th style="width: 30%;">Laboratorio</th>
          <th style="width: 22%;">Tipo</th>
          <th class="text-right">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(eq, index) in equipments" :key="index" :class="{ 'fila-con-error': errores[index] }">
          <td>
            <span v-if="eq.modo === 'nuevo'" class="numero-estimado">{{ conCeros(estimadoDe(index)) }}</span>
            <span v-else class="font-weight-medium">{{ eq.registry_code }}</span>
          </td>
          <td>
            <paginated-autocomplete v-if="eq.modo === 'nuevo'" v-model="eq.name" :fetch="fetchEquipments"
                                    :mapper="EquipmentMappers.getMap" recurso="equipos" :seed="semillaDeEquipo(eq.name)"
                                    :return-object="false" item-title="name" item-value="id"
                                    variant="plain" density="compact" hide-details />
            <template v-else>
              <span class="text-subtitle-2">{{ eq.name }}</span>
              <span class="text-caption text-medium-emphasis"> · vinculado</span>
            </template>
            <div v-if="errores[index]" class="text-caption text-error">{{ errores[index] }}</div>
          </td>
          <template v-if="eq.modo === 'nuevo'">
            <td>
              <paginated-autocomplete v-model="eq.lab" :fetch="fetchLabs" :mapper="LabMappers.getMap"
                                      recurso="labs" :seed="eq.lab_data" @selected="l => eq.lab_data = l"
                                      :return-object="false" item-title="name" item-value="id"
                                      variant="plain" density="compact" hide-details />
            </td>
            <td>
              <v-select v-model="eq.certificate_type" :items="TIPOS_CERTIFICADO"
                        variant="plain" density="compact" hide-details />
            </td>
          </template>
          <template v-else>
            <td class="text-medium-emphasis">{{ eq.lab_data?.name || '—' }}</td>
            <td class="text-medium-emphasis">{{ nombreDelTipo(eq.certificate_type) }}</td>
          </template>
          <td class="text-right">
            <v-btn icon size="x-small" variant="text" color="red" density="comfortable" @click="equipments.splice(index, 1)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    
  <equipo-maestro-modal ref="equipoMaestroModalRef" @reload="equipCatalogRef?.reload()" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue'
import { useTheme } from 'vuetify'
import LabDataService from '@/services/labs/labDataService'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import LabMappers from '@/mappers/labMappers'
import CertificateDataService from '@/services/certificates/certificateDataService'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import EquipmentMappers from '@/mappers/equipmentMappers'
import EquipoMaestroModal from '@/views/equipments/components/EquipoMaestroModal.vue'
import CorrelativeDataService from '@/services/correlative/correlativeDataService'
import { TIPOS_CERTIFICADO, nombreDelTipo } from '@/utils/certificates/tipos'
import { useRowErrors } from '@/composables/useRowErrors'

const emit = defineEmits(['update-list', 'update-config'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const temp_eq = ref({ modo: 'nuevo', name: null, lab: null, certificate_type: null, correlative_busqueda: '' })
const certificado_encontrado = ref(null)
const buscando_cert          = ref(false)
const base_correlatives      = ref({ 1: null, 2: null, 3: null })
const equipments             = ref([])
const { errores, marcarErrores } = useRowErrors(equipments)

// Comboboxes server-side
const fetchLabs = (page, size, query) => LabDataService.getFiltered(page, size, query)
const fetchEquipments = (page, size, query) => EquipmentDataService.getFiltered(page, size, query)
// El equipo se guarda como su nombre, que en el catalogo es tambien el id.
const semillaDeEquipo = (nombre) => (nombre ? { id: nombre, name: nombre } : null)
const equipCatalogRef = ref(null)      // para recargar el catálogo tras crear un equipo
const labSeleccionado = ref(null)      // objeto del lab elegido, semilla de su desplegable
const equipoMaestroModalRef = ref(null)


const conCeros = (n) => (n == null ? '…' : String(n).padStart(8, '0'))

// El numero que tomaria una fila nueva si nadie mas toma numeros antes de guardar.
function estimadoDe(index, filas = equipments.value) {
  const fila = filas[index]
  const base = base_correlatives.value[fila.certificate_type]
  if (!base) return null
  const antes = filas.slice(0, index).filter(e => e.modo === 'nuevo' && e.certificate_type === fila.certificate_type)
  return Number(base) + antes.length
}

const siguienteEstimado = computed(() => {
  if (!temp_eq.value.certificate_type) return ''
  const filas = [...equipments.value, { modo: 'nuevo', certificate_type: temp_eq.value.certificate_type }]
  const numero = estimadoDe(filas.length - 1, filas)
  return numero == null ? '' : conCeros(numero)
})

const estimados = () => equipments.value.map((e, i) => (e.modo === 'nuevo' ? estimadoDe(i) : null))

watch(equipments, (val) => { emit('update-list', val) }, { deep: true })

// Lo elegido arriba sigue elegido entre fila y fila, y vuelve con el borrador.
watch([temp_eq, labSeleccionado], () => {
  const { modo, name, lab, certificate_type } = temp_eq.value
  emit('update-config', { modo, name, lab, certificate_type, lab_data: labSeleccionado.value })
}, { deep: true })

onMounted(() => {
  initCorrelatives()   // los comboboxes se auto-cargan solos
})

function inyectarBorrador({ items, config }) {
  equipments.value = items
  if (!config) return
  const { lab_data, ...elegido } = config
  Object.assign(temp_eq.value, elegido)
  labSeleccionado.value = lab_data
}


async function initCorrelatives() {
  try {
    const { data } = await CorrelativeDataService.getTodos()
    base_correlatives.value = data
  } catch (e) {
    console.error('No se pudieron cargar los correlativos base', e)
  }
}



async function buscarCertificadoHuerfano() {
  if (!temp_eq.value.correlative_busqueda) return
  buscando_cert.value = true
  certificado_encontrado.value = null
  try {
    const res = await CertificateDataService.getFiltered({ page_size: 50, correlative: Number(temp_eq.value.correlative_busqueda) })
    const validos = res.data.results.filter(c => !c.order && c.status !== 5)
    if (validos.length > 0) {
      certificado_encontrado.value = validos[0]
    } else {
      $swal.fire('No encontrado', 'No se encontró un certificado suelto o válido con ese número.', 'warning')
    }
  } catch (e) {
    $swal.fire('Error', 'Hubo un problema al buscar el certificado.', 'error')
  } finally {
    buscando_cert.value = false
  }
}

function addEquipmentToBatch() {
  if (temp_eq.value.modo === 'nuevo') {
    if (!temp_eq.value.name || !temp_eq.value.lab || !temp_eq.value.certificate_type) return
    equipments.value.push({
      modo:             'nuevo',
      name:             temp_eq.value.name,
      lab:              temp_eq.value.lab,
      lab_data:         labSeleccionado.value,
      certificate_type: temp_eq.value.certificate_type,
    })
  } else {
    if (!certificado_encontrado.value) return
    
    // UX: Prevenir que el usuario agregue el mismo equipo existente dos veces a la lista
    const yaExiste = equipments.value.some(e => e.modo === 'existente' && e.cert_id === certificado_encontrado.value.id)
    if (yaExiste) {
      $swal.fire('Atención', 'Este equipo ya está en la lista para ser añadido.', 'warning')
      return
    }

    equipments.value.push({
      modo:             'existente',
      cert_id:          certificado_encontrado.value.id,
      name:             certificado_encontrado.value.equipment,
      registry_code:    certificado_encontrado.value.registry_code,
      lab:              certificado_encontrado.value.lab,
      lab_data:         certificado_encontrado.value.lab_data,
      certificate_type: certificado_encontrado.value.certificate_type,
    })
    certificado_encontrado.value = null
    temp_eq.value.correlative_busqueda = ''
  }
  temp_eq.value.name = null
}

defineExpose({ inyectarBorrador, marcarErrores, estimados })
</script>

<style scoped>
.numero-estimado {
  font-family: monospace;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>