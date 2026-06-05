<template>
  <v-dialog width="850" :model-value="dialog" @update:model-value="dialog = $event" class="dialog-premium" persistent>
    
    <v-card>
      <base-modal-header :title="isEdit ? 'Editar Certificado' : 'Nuevo Certificado'" icon="mdi-certificate-outline" @close="close">
        Página: <v-chip variant="outlined" label color="primary" size="small" class="font-weight-bold mx-1">{{window_step}} de 2</v-chip>
        <span v-if="isEdit" class="ml-2">Tipo: <span class="font-weight-bold text-primary">{{certificate.certificate_type_label}}</span></span>
        <span v-if="certificate.emission_date" class="ml-2">Correlativo: <span class="font-weight-bold text-primary">{{correlative_preview}}</span></span>
      </base-modal-header>

      <v-form ref="smartForm" @submit.prevent v-model="is_valid">
        <v-window v-model="window_step">
          <v-window-item :value="1">
            <v-card-text class="pt-6">
              
              <v-row align="center" justify="center" v-if="!isEdit" class="mb-4">
                <v-btn-toggle v-model="certificate.certificate_type" color="primary" selected-class="bg-primary text-white" rounded="lg" density="compact" mandatory @update:model-value="retrieveCorrelative">
                  <v-btn :value="1" class="font-weight-bold px-4">ACREDITADO</v-btn>
                  <v-btn :value="2" class="font-weight-bold px-4">NO ACREDITADO</v-btn>
                  <v-btn :value="3" class="font-weight-bold px-4">OPERATIVIDAD</v-btn>
                </v-btn-toggle>
              </v-row>

              <v-row align="center">
                <v-col cols="12" md="4">
                  <v-autocomplete 
                    v-model="selected_equipment_name" 
                    :items="unique_catalog_names" 
                    :loading="loading_equipments"
                    label="Equipo (Familia)"
                    density="compact" variant="outlined" hide-details="auto" 
                    prepend-inner-icon="mdi-toolbox-outline"
                    placeholder="Seleccione familia..."
                    @update:model-value="onFamilyChange"
                    clearable
                  />
                </v-col>            
                <v-col cols="12" md="4">
                  <v-autocomplete 
                    v-model="selected_variant_obj" 
                    :items="filtered_equipment_variants" 
                    :disabled="!selected_equipment_name"
                    item-title="type_display" 
                    return-object
                    label="Característica / Tipo"
                    density="compact" variant="outlined" hide-details="auto" 
                    prepend-inner-icon="mdi-shape-outline"
                    placeholder="Seleccione tipo..."
                    no-data-text="No hay variantes registradas"
                    @update:model-value="onVariantSelect"
                    clearable
                  />
                </v-col>            
                <v-col cols="12" md="4">
                  <v-btn color="secondary" variant="outlined" block class="font-weight-bold" style="height: 40px;" @click="equipmentModalRef.open()">
                    <v-icon start>mdi-plus</v-icon> Nuevo al Catálogo
                  </v-btn>
                </v-col>
              </v-row>

              <v-row align="center" class="mt-2">
                <v-col cols="12" md="9">
                  <v-autocomplete v-model="certificate.client" hide-details="auto" density="compact"
                            :loading="loading_clients"
                            :items="clients" v-model:search="search_client"
                            item-title="name" item-value="id" clearable variant="outlined" label="Cliente (*)"/>
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn color="primary" variant="flat" block height="40" @click="clientDialogOpen = true">
                    <v-icon start>mdi-plus</v-icon> NUEVO
                  </v-btn>
                </v-col>
              </v-row>

              <v-row align="center">
                <v-col cols="12" md="9">
                  <v-autocomplete v-model="certificate.lab" density="compact" hide-details="auto"
                                  :loading="loading_labs" :items="labs" v-model:search="search_lab"
                                  item-title="name" item-value="id" clearable variant="outlined" label="Laboratorio"/>
                </v-col>
                <v-col cols="12" md="3">
                  <v-btn color="primary" variant="flat" block height="40" @click="labDialogOpen = true">
                    <v-icon start>mdi-plus</v-icon> NUEVO
                  </v-btn>
                </v-col>
              </v-row>

              <v-row v-if="canUploadSignedPDF()" class="mt-2">
                <v-col cols="12">
                  <v-file-input hide-details="auto" density="compact" show-size variant="outlined" accept="application/pdf"
                                prepend-inner-icon="mdi-file-pdf-box" placeholder="Opcional: Solo si usa firma externa/manual"
                                :label="isEdit ? 'Subir/Reemplazar PDF (Firma Externa Opcional)' : 'PDF (Firma Externa Opcional)'"
                                @update:model-value="selectFile">
                    <template v-slot:append v-if="isEdit && certificate.signed_pdf_url">
                      <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                          <v-btn v-bind="props" icon variant="text" color="info" :href="certificate.signed_pdf_url" target="_blank"><v-icon>mdi-eye</v-icon></v-btn>
                        </template>
                        <span>Ver actual</span>
                      </v-tooltip>
                    </template>
                  </v-file-input>
                </v-col>
              </v-row>
            </v-card-text>
          </v-window-item>

          <v-window-item :value="2">
            <v-card-text class="pt-4">
              <v-row> 
                <v-col cols="12" md="4">
                  <date-picker :date="certificate.emission_date" label="Fecha de emisión" @setPickedDate="(value) => certificate.emission_date = value" />
                </v-col>              
                <v-col cols="12" md="4">
                  <v-text-field v-model="certificate.serie" label="Número de Serie" density="compact" variant="outlined" hide-details="auto" prepend-inner-icon="mdi-barcode" @keypress="isValidCharacter"/>
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center" v-if="permiso_solicitar_firma">
                  <v-switch
                    v-model="certificate.signature_requested"
                    label="Requiere Firma"
                    color="primary"
                    hide-details
                    density="compact"
                    inset
                    class="font-weight-bold"
                  ></v-switch>
                </v-col>
              </v-row>
              
              <v-row class="mt-4">
                <v-col cols="12" md="4">
                  <v-text-field v-model="certificate.brand" label="Marca" density="compact" variant="outlined" hide-details="auto" @keypress="isValidCharacter"/>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model="certificate.model" label="Modelo" density="compact" variant="outlined" hide-details="auto" @keypress="isValidCharacter"/>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model="certificate.identification_code" label="Cód. Identificación" density="compact" variant="outlined" hide-details="auto" @keypress="isValidCharacter"/>
                </v-col>
              </v-row>
              
              <v-row class="mt-4">
                <v-col cols="12" md="4">
                  <v-text-field v-model="certificate.indication_interval" label="Intervalo de Indicación" density="compact" variant="outlined" hide-details="auto" @keypress="isValidCharacter"/>
                </v-col>
                <v-col cols="12" md="4">
                  <date-picker label="Fecha de calibración" :date="certificate.calibration_date" @setPickedDate="(value) => certificate.calibration_date = value" />
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center">
                  <v-btn v-if="certificate.uploaded_xls && certificate.uploaded_xls !== '0' && certificate.uploaded_xls !== 'False' && certificate.uploaded_xls !== 'false'" 
                         color="success" variant="outlined" block class="font-weight-bold" style="height: 40px;"
                         :href="`/media/${certificate.uploaded_xls}`" target="_blank">
                    <v-icon start>mdi-eye</v-icon> Ver PDF Base
                  </v-btn>
                  <div v-else class="text-grey text-center text-subtitle-2 font-weight-bold d-flex align-center justify-center" style="width: 100%; height: 40px; border: 1px dashed #9e9e9e; border-radius: 4px;">
                    <v-icon start size="small" color="grey">mdi-file-excel-outline</v-icon> Excel Pendiente
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-5"/>

              <v-row>
                <v-col cols="12">
                  <v-textarea v-model="certificate.observations" label="Observaciones internas"
                              density="compact" variant="outlined" hide-details="auto" rows="2" prepend-inner-icon="mdi-comment-text-outline"
                              @keypress="isValidCharacter"/>
                </v-col>
              </v-row>
            </v-card-text>
          </v-window-item>
        </v-window>
      </v-form>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-btn :disabled="window_step===1" color="primary" @click="window_step--" icon variant="text" size="large"><v-icon>mdi-arrow-left</v-icon></v-btn>
        <v-btn :disabled="window_step===2" color="primary" @click="window_step++" icon variant="text" size="large" class="ml-2"><v-icon>mdi-arrow-right</v-icon></v-btn>
        <v-spacer/> 
        <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" elevation="2"class="text-white font-weight-bold rounded-lg px-6" @click="save" 
            :disabled="!certificate.client || !certificate.lab || !selected_variant_obj || is_on_sending_process" 
            :loading="is_on_sending_process">
        {{ isEdit ? 'Guardar Cambios' : 'Registrar' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <equipment-modal ref="equipmentModalRef" :existingEquipments="equipments_catalog" :units="units_catalog" @reload="retrieveEquipmentsCatalog" @open-unit-modal="unitModalRef.open()" />
    <unit-modal ref="unitModalRef" @reload="retrieveEquipmentsCatalog" />

    <client-form-dialog v-model="clientDialogOpen" @reloadListComponent="retrieveClientes('')" />
    <lab-form-dialog v-model="labDialogOpen" @reloadListComponent="retrieveLabs('')" />

  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance, onMounted, nextTick } from 'vue'
import DatePicker from "@/components/commonComponents/DatePicker.vue"
import CertificatesRules from "@/validators/rules/certificatesRules.js"
import ClientDataService from "@/services/clients/clientDataService.js"
import ClientMappers from "@/mappers/clientMappers.js"
import LabDataService from "@/services/labs/labDataService.js"
import LabMappers from "@/mappers/labMappers.js"
import CertificateDataService from "@/services/certificates/certificateDataService.js"
import Characters from "@/validators/commonValidators/characters.js"
import CertificateMappers from "@/mappers/certificateMappers.js"
import EquipmentDataService from "@/services/equipments/equipmentDataService.js"
import UnitDataService from "@/services/equipments/unitDataService.js"
import CorrelativeDataService from "@/services/correlative/correlativeDataService.js"
import EquipmentModal from "@/views/equipments/components/EquipmentModal.vue"
import UnitModal from "@/views/equipments/components/UnitModal.vue"

import { useAppStore } from '@/stores/appStore'
import { defineAsyncComponent } from 'vue'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'

const ClientFormDialog = defineAsyncComponent(() => import('@/views/clients/components/ClientFormDialog.vue'))
const LabFormDialog = defineAsyncComponent(() => import('@/views/labs/components/LabFormDialog.vue'))

const emit = defineEmits(['updateCertificate', 'reloadListComponent'])

const appStore = useAppStore()
const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const equipmentModalRef = ref(null)
const unitModalRef = ref(null)
const smartForm = ref(null)

const dialog = ref(false)
const clientDialogOpen = ref(false)
const labDialogOpen = ref(false)
const isEdit = ref(false)
const window_step = ref(1)
const is_valid = ref(false)
const is_on_sending_process = ref(false)

const certificate = ref({})

const permiso_solicitar_firma = computed(() => {
  const user = JSON.parse(localStorage.getItem('user')) || {}
  const isAdmin = user.kind !== undefined && user.kind < 1
  const permissions = user.action_permissions || []
  return isAdmin || permissions.includes(14) || permissions.includes(10)
})

const equipments_catalog = ref([])
const units_catalog = ref([])
const loading_equipments = ref(false)
const selected_equipment_name = ref(null)
const selected_variant_obj = ref(null)

const certificate_client_rules = CertificatesRules.client_rules()

// Instancia del buscador de Clientes usando el Composable global
const { 
  items: clients, 
  loading: loading_clients, 
  searchQuery: search_client, 
  retrieveData: retrieveClientes 
} = usePaginatedSearch(
  (page, size, query) => ClientDataService.getFiltered(page, size, query),
  ClientMappers.getMap,
  () => certificate.value.client
)

// Instancia del buscador de Laboratorios usando el Composable global
const { 
  items: labs, 
  loading: loading_labs, 
  searchQuery: search_lab, 
  retrieveData: retrieveLabs 
} = usePaginatedSearch(
  (page, size, query) => LabDataService.getFiltered(page, size, query),
  LabMappers.getMap,
  () => certificate.value.lab
)

const correlative_preview = computed(() => {
  let mask = ''
  if (certificate.value.emission_date) mask = certificate.value.emission_date.slice(0,4) + '-'
  let correlative = String(certificate.value.correlative || '')
  if (correlative) mask += correlative.padStart(8, '0')
  return mask
})

const unique_catalog_names = computed(() => {
  const names = equipments_catalog.value.map(e => e.equipment_name)
  return [...new Set(names)].sort()
})

const filtered_equipment_variants = computed(() => {
  if (!selected_equipment_name.value) return []
  return equipments_catalog.value.filter(e => e.equipment_name === selected_equipment_name.value)
})

onMounted(() => {
  retrieveEquipmentsCatalog()
})

const open = (item = null) => {
  if (item) {
    isEdit.value = true
    certificate.value = CertificateMappers.putMap(item)
    const tipos = { 1: 'ACREDITADO', 2: 'NO ACREDITADO', 3: 'OPERATIVIDAD' }
    certificate.value.certificate_type_label = tipos[certificate.value.certificate_type] || '---'
    
    certificate.value.signed_pdf_url = item.signed_pdf 
    certificate.value.signed_pdf = null
    certificate.value.signature_requested = item.signature_requested === true
    
    if (item.client_data) clients.value = [item.client_data]
    if (item.lab_data) labs.value = [item.lab_data]

    const found = equipments_catalog.value.find(eq => eq.clean_name === certificate.value.equipment)
    if (found) {
      selected_equipment_name.value = found.equipment_name
      selected_variant_obj.value = found
    } else {
      selected_equipment_name.value = certificate.value.equipment
      selected_variant_obj.value = null
    }
  } else {
    isEdit.value = false
    let today = (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10)
    certificate.value = {
      certificate_type: 1, correlative: '', client: null, lab: '', equipment: '', brand: '',
      model: '', serie: '', indication_interval: '', identification_code: '', 
      calibration_date: today, emission_date: today, signed_pdf: null, uploaded_xls: '', observations: '',
      signature_requested: false
    }
    selected_equipment_name.value = null
    selected_variant_obj.value = null
    retrieveClientes('')
    retrieveLabs('')
    retrieveCorrelative()
  }
  dialog.value = true
  if (smartForm.value) smartForm.value.resetValidation()
  window_step.value = 1
}

const close = () => {
  dialog.value = false
  window_step.value = 1
}

const retrieveEquipmentsCatalog = () => {
  loading_equipments.value = true
  
  UnitDataService.getAll().then(res => {
    units_catalog.value = res.data.results || res.data
  })

  EquipmentDataService.getAll().then((response) => {
    let items = response.data.results || response.data
    equipments_catalog.value = items.map(eq => {
      let fullName = eq.type ? `${eq.equipment_name} - ${eq.type}` : eq.equipment_name
      let unitSym = eq.unit_detail ? eq.unit_detail.symbol : '--'
      return {
        ...eq,
        display_name: `${fullName} (${unitSym})`,
        clean_name: fullName,
        type_display: eq.type ? `${eq.type} (${unitSym})` : `Estándar (${unitSym})`,
        unit_symbol: eq.unit_detail ? eq.unit_detail.symbol : ''
      }
    })
  }).finally(() => { loading_equipments.value = false })
}

const onFamilyChange = () => {
  selected_variant_obj.value = null
  certificate.value.equipment = ''

  if (selected_equipment_name.value) {
    nextTick(() => {
      if (filtered_equipment_variants.value.length === 1) {
        selected_variant_obj.value = filtered_equipment_variants.value[0]
        onVariantSelect(filtered_equipment_variants.value[0])
      }
    })
  }
}

const onVariantSelect = (val) => {
  if (val && typeof val === 'object') {
    certificate.value.equipment = val.clean_name
    if (!certificate.value.indication_interval) {
      certificate.value.indication_interval = val.unit_symbol
    }
  } else {
    certificate.value.equipment = ''
  }
}



const retrieveCorrelative = () => {
  CorrelativeDataService.get(certificate.value.certificate_type).then((response) => {
    certificate.value.correlative = response.data.correlative
  })
}

const canUploadSignedPDF = () => {
  const user = JSON.parse(localStorage.getItem('user'))
  return user?.username.toString().toLowerCase() === 'gerente'
}

const selectFile = (file) => { certificate.value.signed_pdf = file }
const isValidCharacter = (e) => { return Characters.checkCharacterDigitsAndSymbols(e, true) }

const save = () => {
  if (smartForm.value.validate()) {
    if(is_on_sending_process.value) return
    is_on_sending_process.value = true
    
    let data = new FormData()
    
    if (certificate.value.signed_pdf && certificate.value.signed_pdf.name) {
      let blob = new Blob([certificate.value.signed_pdf], {type: 'application/pdf'})
      data.append('signed_pdf', blob, certificate.value.signed_pdf.name)
    } else {
      delete certificate.value['signed_pdf']
    }

    const camposObsoletos = ['signed_pdf_url', 'billed_pdf', 'billed', 'payment_proof', 'attached_pdf', 'sent', 'sent_to', 'sent_date', 'client_data', 'lab_data']
    
    for (let key in certificate.value){
      if (!camposObsoletos.includes(key) && key !== 'signed_pdf') {
        data.append(key, certificate.value[key] === null || certificate.value[key] === undefined ? '' : certificate.value[key])
      }
    }

    dialog.value = false
    $swal.fire(appStore.ToastGuardando || { title: 'Guardando...' })

    let request = isEdit.value 
      ? CertificateDataService.update(certificate.value.id, data)
      : CertificateDataService.create(data)

    request.then((response) => {
      if (response.status === 200 || response.status === 201) {
        if (isEdit.value) {
          if (window.notificarActualizacionFila) window.notificarActualizacionFila(certificate.value.id, null);
        }
        // Nota: Si es nuevo, el backend (signals.py) ya emite el RELOAD_CERTIFICATES por WebSocket
        close()
        $swal.fire(appStore.ToastGuardadoExito || { title: 'Éxito', icon: 'success' })
      }
    }).catch((e) => {
      dialog.value = true
      let errorMsg = 'Error al procesar la solicitud.'
      if (e.response && e.response.data) errorMsg = JSON.stringify(e.response.data).substring(0, 150)
      $swal.fire({ ...(appStore.ToastErrorRed || {}), title: 'Error', text: errorMsg, icon: 'error' })
    }).finally(() => {
      is_on_sending_process.value = false
    })
  }
}

defineExpose({
  open
})
</script>