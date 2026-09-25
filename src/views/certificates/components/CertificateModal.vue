<template>
  <v-dialog v-model="dialog" width="850" class="dialog-premium" persistent>
    <v-card>
      <base-modal-header :title="titulo" icon="mdi-certificate-outline" @close="close">
        <template v-if="!isEdit && codigoNuevo">
          Correlativo: <span class="font-weight-bold text-primary ml-1">{{ codigoNuevo }}</span>
        </template>
      </base-modal-header>

      <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />

      <v-card-text class="pt-5">
        <v-row v-if="!isEdit" justify="center" class="mb-4">
          <v-btn-toggle v-model="tipoNuevo" color="primary" selected-class="bg-primary text-white" rounded="lg" density="compact" mandatory @update:model-value="pedirCorrelativo">
            <v-btn v-for="tipo in TIPOS_CERTIFICADO" :key="tipo.value" :value="tipo.value"
                   class="font-weight-bold px-4">{{ tipo.title }}</v-btn>
          </v-btn-toggle>
        </v-row>

        <v-sheet v-if="isEdit && !cargando" border rounded="lg" class="pa-3 mb-5 text-body-2">
          <v-row dense align="center">
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">Tipo:</span>
              <span class="font-weight-bold ml-1">{{ nombreDelTipo(ficha.certificate_type) }}</span>
              <v-btn v-if="puedeCorregir" variant="text" color="primary" size="small" density="compact" class="ml-1" @click="corregirTipo">
                Corregir
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">Estado:</span>
              <span class="font-weight-bold ml-1">{{ estado }}</span>
            </v-col>
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">Orden:</span>
              <span class="ml-1">{{ ficha.order_number || 'Sin orden' }}</span>
            </v-col>
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">Creado:</span>
              <span class="ml-1">{{ creado }}</span>
            </v-col>
            <v-col v-if="anteriores" cols="12">
              <span class="text-medium-emphasis">Números anteriores:</span>
              <span class="ml-1">{{ anteriores }}</span>
            </v-col>
          </v-row>
        </v-sheet>

        <v-form :disabled="cargando" @submit.prevent>
          <v-row dense>
            <v-col cols="12">
              <ClientLookupBar v-model="form.client" :seed="ficha.client_data" creatable />
            </v-col>

            <v-col cols="12">
              <paginated-autocomplete
                ref="equipCatalogRef"
                v-model="form.equipment"
                :fetch="fetchEquipments" :mapper="EquipmentMappers.getMap" recurso="equipos"
                :return-object="false" item-title="name" item-value="id"
                :seed="equipSeed"
                label="Equipo"
                density="compact" variant="outlined" hide-details="auto"
                prepend-inner-icon="mdi-toolbox-outline"
                clearable
              >
                <template #append>
                  <add-new-button texto="Nuevo equipo en el catálogo" @click="equipoMaestroModalRef?.open()" />
                </template>
              </paginated-autocomplete>
            </v-col>

            <v-col cols="12">
              <paginated-autocomplete ref="labComboRef" v-model="form.lab"
                                      :fetch="fetchLabs" :mapper="LabMappers.getMap" :seed="ficha.lab_data" recurso="labs"
                                      :return-object="false" item-title="name" item-value="id"
                                      density="compact" hide-details="auto"
                                      prepend-inner-icon="mdi-flask-outline"
                                      clearable variant="outlined" label="Laboratorio">
                <template #append>
                  <add-new-button texto="Nuevo laboratorio" @click="labDialogOpen = true" />
                </template>
              </paginated-autocomplete>
            </v-col>

            <v-col cols="12" md="4">
              <date-picker :date="form.emission_date" label="Fecha de emisión" @setPickedDate="(value) => form.emission_date = value" />
            </v-col>
            <v-col cols="12" md="8">
              <v-textarea v-model="form.observations" label="Observaciones internas" maxlength="256"
                          density="compact" variant="outlined" hide-details="auto" rows="1" auto-grow
                          prepend-inner-icon="mdi-comment-text-outline" @keypress="isValidCharacter"/>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" elevation="2" class="text-white font-weight-bold rounded-lg px-6" @click="save"
               :disabled="cargando || !form.client || !form.lab || !form.equipment"
               :loading="guardando">
          {{ isEdit ? 'Guardar Cambios' : 'Registrar' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <lab-form-dialog v-model="labDialogOpen" @reloadListComponent="labComboRef?.reload()" />

    <equipo-maestro-modal ref="equipoMaestroModalRef" @reload="equipCatalogRef?.reload()" />

    <batch-action-modal ref="batchActionModalRef" @corregido="recargarFicha" />
  </v-dialog>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { ref, computed, defineAsyncComponent } from 'vue'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import AddNewButton from '@/components/commonComponents/AddNewButton.vue'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import EquipoMaestroModal from '@/views/equipments/components/EquipoMaestroModal.vue'
import EquipmentDataService from '@/services/equipments/equipmentDataService.js'
import EquipmentMappers from '@/mappers/equipmentMappers.js'
import LabDataService from '@/services/labs/labDataService.js'
import LabMappers from '@/mappers/labMappers.js'
import CertificateDataService from '@/services/certificates/certificateDataService.js'
import CertificateMappers from '@/mappers/certificateMappers.js'
import CorrelativeDataService from '@/services/correlative/correlativeDataService.js'
import Characters from '@/validators/commonValidators/characters.js'
import { TIPOS_CERTIFICADO, nombreDelTipo, siglaDelTipo } from '@/utils/certificates/tipos'
import { ANULADO, estaFirmado } from '@/utils/certificates/estado'
import { estaEntregado } from '@/utils/certificates/entrega'
import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { fechaCorta, hoyISO } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { usePermissions } from '@/composables/usePermissions'
import { useAppStore } from '@/stores/appStore'

const LabFormDialog = defineAsyncComponent(() => import('@/views/labs/components/LabFormDialog.vue'))
const BatchActionModal = defineAsyncComponent(() => import('./BatchActionModal.vue'))

const appStore = useAppStore()
const PERMISO_CORREGIR = 1003

const dialog = ref(false)
const labDialogOpen = ref(false)
const isEdit = ref(false)
const cargando = ref(false)
const guardando = ref(false)

// `ficha` es el certificado como lo mando el server; `form`, lo que se edita.
const ficha = ref({})
const form = ref({})
const tipoNuevo = ref(1)
const correlativoNuevo = ref('')

const equipoMaestroModalRef = ref(null)
const batchActionModalRef = ref(null)
const equipCatalogRef = ref(null)
const labComboRef = ref(null)
const fetchLabs = (page, size, query) => LabDataService.getFiltered(page, size, query)
const fetchEquipments = (page, size, query) => EquipmentDataService.getFiltered(page, size, query)
// El equipo se guarda como texto, no como id del catalogo.
const equipSeed = computed(() => ficha.value.equipment ? { id: ficha.value.equipment, name: ficha.value.equipment } : null)

const NOMBRES = {
  client: 'Cliente', lab: 'Laboratorio', equipment: 'Equipo',
  emission_date: 'Fecha de emisión', observations: 'Observaciones',
}

const titulo = computed(() => {
  if (!isEdit.value) return 'Nuevo Certificado'
  return ficha.value.registry_code ? `Certificado ${ficha.value.registry_code}` : 'Certificado'
})

const codigoNuevo = computed(() => {
  if (!correlativoNuevo.value) return ''
  return `${(form.value.emission_date || '').slice(0, 4)}-${String(correlativoNuevo.value).padStart(8, '0')}`
})

const puedeCorregir = computed(() => ficha.value.status !== ANULADO && usePermissions().hasAction(PERMISO_CORREGIR))

const estado = computed(() => {
  const cert = ficha.value
  if (cert.status === ANULADO) return 'Anulado'
  let avance = 'Sin Excel'
  if (cert.uploaded) avance = 'En la nube'
  else if (estaFirmado(cert)) avance = 'Firmado'
  else if (tieneExcelBase(cert)) avance = 'Con Excel, sin firmar'

  const partes = [avance]
  if (cert.signature_requested && !estaFirmado(cert)) partes.push('firma solicitada')
  if (estaEntregado(cert)) partes.push(`entregado el ${fechaCorta(cert.sent_date)}`)
  return partes.join(' · ')
})

const creado = computed(() =>
  [fechaCorta(ficha.value.created_at), ficha.value.created_by].filter(Boolean).join(' · ')
)

const anteriores = computed(() => (ficha.value.previous_numbers || [])
  .map(n => `${siglaDelTipo(n.certificate_type)} ${n.registry_code} (${fechaCorta(n.created_at)} · ${n.created_by})`)
  .join(', '))

// La fila no trae el certificado entero: se pide al abrir.
const open = async (item = null) => {
  isEdit.value = Boolean(item)
  ficha.value = {}
  form.value = { client: null, lab: null, equipment: null, emission_date: hoyISO(), observations: '' }
  dialog.value = true

  if (!item) {
    tipoNuevo.value = 1
    pedirCorrelativo()
    return
  }

  cargando.value = true
  try {
    const { data } = await CertificateDataService.get(item.id)
    ficha.value = data
    form.value = CertificateMappers.putMap(data)
  } catch (e) {
    dialog.value = false
    Toast.fire({ ...appStore.toastErrorRed, title: mensajeDeError(e, 'No se pudo abrir el certificado.') })
  } finally {
    cargando.value = false
  }
}

const close = () => { dialog.value = false }

const pedirCorrelativo = () => {
  correlativoNuevo.value = ''
  CorrelativeDataService.get(tipoNuevo.value).then(({ data }) => {
    correlativoNuevo.value = data.correlative
  })
}

const corregirTipo = () => batchActionModalRef.value?.open('tipo', [ficha.value])

// Solo la ficha: lo que se estaba editando sigue en el formulario.
const recargarFicha = async () => {
  try {
    const { data } = await CertificateDataService.get(ficha.value.id)
    ficha.value = data
  } catch (e) {
    Toast.fire({ ...appStore.toastErrorRed, title: mensajeDeError(e, 'No se pudo recargar el certificado.') })
  }
}

const isValidCharacter = (e) => Characters.checkCharacterDigitsAndSymbols(e, true)

// Solo viaja lo que el modal edita: el estado, la firma o la entrega pudieron
// cambiar mientras estaba abierto.
const save = async () => {
  if (guardando.value) return
  guardando.value = true
  try {
    if (isEdit.value) await CertificateDataService.patch(ficha.value.id, form.value)
    else await CertificateDataService.create({ ...form.value, certificate_type: tipoNuevo.value })
    close()
    Toast.fire(appStore.toastGuardadoExito)
  } catch (e) {
    Toast.fire({ ...appStore.toastErrorRed, title: 'No se guardó', text: mensajeDeError(e, 'No se pudo guardar el certificado.', NOMBRES) })
  } finally {
    guardando.value = false
  }
}

defineExpose({ open })
</script>
