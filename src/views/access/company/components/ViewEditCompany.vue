<template>
  <v-card variant="flat" class="rounded-lg overflow-hidden" :loading="is_loading">
    <v-card-title class="pa-4 d-flex align-center">
      <v-icon start color="primary">mdi-domain</v-icon>
      <span class="text-subtitle-1 font-weight-medium ml-2">
        Datos Generales de DAICOM S.A.C.
      </span>
      <v-spacer></v-spacer>
      <v-btn 
        v-if="!isEditing" 
        color="primary" 
        variant="flat" 
        prepend-icon="mdi-pencil" 
        @click="isEditing = true"
      >
        Editar Empresa
      </v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="pa-6">
      <v-form ref="editForm" @submit.prevent v-model="is_valid">
        <v-row>
          <v-col cols="12" md="8">
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-2">Datos de la empresa</div>
            <v-row dense>
              <v-col cols="12" md="8">
                <v-text-field v-model="company.name" label="Nombre (*)" density="compact" variant="outlined" counter="120" hide-details="auto" :rules="name_rules" :disabled="!isEditing" @keypress="isLetterOrSpace" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.document" label="RUC" density="compact" variant="outlined" counter="11" hide-details="auto" :rules="document_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field v-model="company.address" label="Dirección" density="compact" variant="outlined" counter="200" hide-details="auto" :rules="address_rules" :disabled="!isEditing" @keypress="isLetterOrDigit" />
              </v-col>
              <v-col cols="12" md="4">
                <ubigeo-field v-model="company.ubigeo" label="Ubigeo del domicilio fiscal" :disabled="!isEditing" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="company.phone" label="Teléfono" density="compact" variant="outlined" counter="20" hide-details="auto" :rules="phone_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="company.email" label="Email" density="compact" variant="outlined" hide-details="auto" :rules="email_rules" :disabled="!isEditing" />
              </v-col>
            </v-row>
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-2 mt-4">Comprobantes electrónicos (SUNAT)</div>
            <v-row dense>
              <v-col cols="12" md="3">
                <v-text-field v-model="company.invoice_series" label="Serie de facturas" maxlength="4"
                              placeholder="F004" density="compact" variant="outlined" hide-details="auto"
                              :disabled="!isEditing" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="company.invoice_correlative" label="Correlativo de facturas"
                              density="compact" variant="outlined" type="number" min="1" hide-details="auto"
                              :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="company.credit_note_series" label="Serie de notas de crédito" maxlength="4"
                              placeholder="F005" density="compact" variant="outlined" hide-details="auto"
                              :disabled="!isEditing" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="company.credit_note_correlative" label="Correlativo de notas"
                              density="compact" variant="outlined" type="number" min="1" hide-details="auto"
                              :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="company.dispatch_series" label="Serie de guías" maxlength="4"
                              placeholder="T003" density="compact" variant="outlined" hide-details="auto"
                              :disabled="!isEditing" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="company.dispatch_correlative" label="Correlativo de guías"
                              density="compact" variant="outlined" type="number" min="1" hide-details="auto"
                              :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
            </v-row>
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-2 mt-4">Certificados · correlativos</div>
            <v-row dense>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.accredited_correlative" label="Acreditados" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.non_accredited_correlative" label="No acreditados" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.operationality_correlative" label="Operatividad" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
            </v-row>
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-2 mt-4">Documentos y órdenes · correlativos</div>
            <v-row dense>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.quote_correlative" label="Cotización" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.valuation_correlative" label="Valorización"
                              density="compact" variant="outlined" type="number" min="1" hide-details="auto"
                              :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.order_service_correlative" label="Orden de servicio" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.order_rental_correlative" label="Orden de alquiler" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="company.inventory_correlative" label="Inventario (DAI-XXX)" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
            </v-row>

            <v-row class="mt-4">
              <v-col cols="12">
                <v-divider></v-divider>
                <div class="d-flex align-center my-3">
                  <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mr-auto">Cuentas bancarias de la factura</div>
                  <v-btn v-if="isEditing" variant="outlined" size="small" prepend-icon="mdi-plus"
                         @click="company.bank_accounts.push(cuentaVacia())">Cuenta</v-btn>
                </div>
                <v-row dense class="mb-2">
                  <v-col cols="12" md="6">
                    <v-text-field v-model="company.detraction_account" label="Cuenta de detracciones"
                                  maxlength="30" hint="Banco de la Nación · también va a SUNAT" persistent-hint
                                  v-bind="CAMPO_DE_CUENTA" hide-details="auto" />
                  </v-col>
                </v-row>
                <div v-if="!company.bank_accounts.length" class="text-caption text-medium-emphasis">
                  Sin cuentas: la factura no las imprime.
                </div>
                <div v-for="(cuenta, i) in company.bank_accounts" :key="i" class="border rounded-lg pa-2 mb-2">
                  <v-row dense class="align-center">
                    <v-col cols="12" md="4">
                      <v-text-field v-model="cuenta.banco" label="Banco" v-bind="CAMPO_DE_CUENTA" />
                    </v-col>
                    <v-col cols="6" md="4">
                      <v-select v-model="cuenta.moneda" :items="['Soles', 'Dólares']" label="Moneda" v-bind="CAMPO_DE_CUENTA" />
                    </v-col>
                    <v-col cols="6" md="4">
                      <v-select v-model="cuenta.tipo" :items="['Cta. corriente', 'Cta. ahorros']" label="Tipo"
                                v-bind="CAMPO_DE_CUENTA" />
                    </v-col>
                    <v-col cols="12" md="5">
                      <v-text-field v-model="cuenta.numero" label="Número" v-bind="CAMPO_DE_CUENTA" />
                    </v-col>
                    <v-col cols="11" md="6">
                      <v-text-field v-model="cuenta.cci" label="CCI" v-bind="CAMPO_DE_CUENTA" />
                    </v-col>
                    <v-col cols="1" class="text-right">
                      <v-btn v-if="isEditing" icon="mdi-close" variant="text" size="small" title="Quitar la cuenta"
                             @click="company.bank_accounts.splice(i, 1)" />
                    </v-col>
                  </v-row>
                </div>
              </v-col>
            </v-row>

            <v-row class="mt-4">
              <v-col cols="12">
                <v-divider></v-divider>
                <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 my-3">Plantillas de Certificados (PDF, sin sello)</div>
              </v-col>

              <v-col v-for="[campo, etiqueta] in PLANTILLAS" :key="campo" cols="12" md="6" class="mb-2">
                <v-file-input v-model="uploadFiles[campo]" :label="etiqueta" density="compact" variant="outlined" show-size accept="application/pdf" :disabled="!isEditing" hide-details="auto" prepend-icon="" prepend-inner-icon="mdi-file-pdf-box" />
                <v-btn v-if="company[campo]" :href="company[campo]" target="_blank" variant="text" color="info" size="small" class="mt-1 px-0 text-caption" height="auto">
                  <v-icon start size="16">mdi-download</v-icon> Descargar archivo actual
                </v-btn>
              </v-col>
            </v-row>
          </v-col>

          <v-col cols="12" md="4" class="pt-2">
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-3">Logotipo de la compañía</div>
            
            <v-card v-if="logoPreview" variant="flat" class="bg-surface mb-4 rounded-lg d-flex align-center justify-center overflow-hidden border-thin" style="min-height: 180px;">
              <v-img :src="logoPreview" contain max-height="250" class="w-100"></v-img>
            </v-card>
            <v-card v-else variant="flat" class="bg-surface mb-4 rounded-lg d-flex align-center justify-center zona-vacia" style="min-height: 180px;">
              <v-icon size="64" color="grey-lighten-1">mdi-image-outline</v-icon>
            </v-card>

            <v-file-input 
              v-model="uploadFiles.image" 
              label="Seleccione logotipo" 
              density="compact" 
              variant="outlined" 
              show-size 
              accept="image/png, image/gif, image/jpeg" 
              :disabled="!isEditing" 
              hide-details="auto" 
              prepend-icon="" 
              prepend-inner-icon="mdi-camera" 
              class="mb-3"
            />

            <v-divider class="mb-3"></v-divider>
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-3">Cuentas Bancarias</div>

            <v-card v-if="bankAccountsPreview" variant="flat" class="bg-surface mb-4 rounded-lg d-flex align-center justify-center overflow-hidden border-thin" style="min-height: 180px;">
              <v-img :src="bankAccountsPreview" contain max-height="250" class="w-100"></v-img>
            </v-card>
            <v-card v-else variant="flat" class="bg-surface mb-4 rounded-lg d-flex align-center justify-center zona-vacia" style="min-height: 180px;">
              <v-icon size="64" color="grey-lighten-1">mdi-bank-outline</v-icon>
            </v-card>

            <v-file-input 
              v-model="uploadFiles.bank_accounts_image" 
              label="Imagen de Cuentas Bancarias" 
              density="compact" 
              variant="outlined" 
              show-size 
              accept="image/png, image/jpeg" 
              :disabled="!isEditing" 
              hide-details="auto" 
              prepend-icon="" 
              prepend-inner-icon="mdi-bank" 
            />

            <v-divider class="my-3"></v-divider>
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-3">Sello del metrólogo</div>

            <v-card v-if="selloPreview" variant="flat" class="bg-white mb-4 rounded-lg d-flex align-center justify-center overflow-hidden border-thin" style="min-height: 180px;">
              <v-img :src="selloPreview" contain max-height="160" class="w-100"></v-img>
            </v-card>
            <v-card v-else variant="flat" class="bg-surface mb-4 rounded-lg d-flex align-center justify-center zona-vacia" style="min-height: 180px;">
              <v-icon size="64" color="grey-lighten-1">mdi-stamper</v-icon>
            </v-card>

            <v-file-input v-model="uploadFiles.sello" label="Sello (PNG con fondo transparente)" density="compact"
                          variant="outlined" show-size accept="image/png" :disabled="!isEditing" hide-details="auto"
                          prepend-icon="" prepend-inner-icon="mdi-stamper" />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-divider v-if="isEditing"></v-divider>

    <v-card-actions v-if="isEditing" class="pa-4">
      <v-spacer></v-spacer>
      <v-btn variant="flat" class="font-weight-bold mr-3 px-6" @click="cancelEdit">
        Cancelar
      </v-btn>
      <v-btn color="primary" variant="flat" class="font-weight-bold px-6" :loading="is_on_sending_process" :disabled="!is_valid" @click="save">
        Guardar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/appStore'
import CompanyRules from "@/validators/rules/companyRules"
import Characters from "@/validators/commonValidators/characters"
import CompanyDataService from "@/services/company/companyDataService"
import CompanyMappers from "@/mappers/companyMappers"
import { mensajeDeError } from '@/utils/errors'
import UbigeoField from '@/components/shared/UbigeoField.vue'

const appStore = useAppStore()

const editForm = ref(null)
const isEditing = ref(false)
const is_loading = ref(false)
const is_valid = ref(false)
const is_on_sending_process = ref(false)

const CAMPO_DE_CUENTA = computed(() => ({ density: 'compact', variant: 'outlined', hideDetails: true, disabled: !isEditing.value }))
const cuentaVacia = () => ({ banco: '', moneda: 'Soles', tipo: 'Cta. corriente', numero: '', cci: '' })

const company = reactive({
  name: '',
  address: '',
  phone: '',
  email: '',
  image: '',
  bank_accounts_image: '',
  bank_accounts: [],
  accredited_correlative: '',
  non_accredited_correlative: '',
  operationality_correlative: '',
  quote_correlative: '',
  valuation_correlative: '',
  dispatch_series: '',
  dispatch_correlative: '',
  ubigeo: '',
  invoice_series: '',
  invoice_correlative: '',
  credit_note_series: '',
  credit_note_correlative: '',
  detraction_account: '',
  order_service_correlative: '',
  order_rental_correlative: '',
  inventory_correlative: '',
  plantilla_acr: '',
  plantilla_nacr: '',
  sello: '',
  document: '',
})

// Los archivos de Company que se suben, con el nombre de su campo.
const ARCHIVOS = ['image', 'bank_accounts_image', 'sello', 'plantilla_acr', 'plantilla_nacr']
const PLANTILLAS = [['plantilla_acr', 'Plantilla ACR'], ['plantilla_nacr', 'Plantilla NACR']]
const uploadFiles = reactive(Object.fromEntries(ARCHIVOS.map(campo => [campo, []])))

const name_rules = CompanyRules.name_rules()
const address_rules = CompanyRules.address_rules()
const phone_rules = CompanyRules.phone_rules()
const email_rules = CompanyRules.email_rules()
const document_rules = CompanyRules.document_rules()
const correlative_rules = CompanyRules.correlative_rules()

const elegido = (campo) => (Array.isArray(uploadFiles[campo]) ? uploadFiles[campo][0] : uploadFiles[campo])
// La imagen recien elegida o, si no hay, la guardada.
const vistaPrevia = (campo) => {
  const f = elegido(campo)
  return f instanceof File ? URL.createObjectURL(f) : company[campo] || null
}
const logoPreview = computed(() => vistaPrevia('image'))
const bankAccountsPreview = computed(() => vistaPrevia('bank_accounts_image'))
const selloPreview = computed(() => vistaPrevia('sello'))

const getCompany = () => {
  is_loading.value = true
  CompanyDataService.get().then((response) => {
    let mapped = CompanyMappers.putMap(response.data)
    Object.assign(company, mapped)
  }).finally(() => {
    is_loading.value = false
  })
}

const clearUploads = () => {
  for (const campo of ARCHIVOS) uploadFiles[campo] = []
}

const initCompany = () => {
  getCompany()
  clearUploads()
  isEditing.value = false
  if (editForm.value) editForm.value.resetValidation()
}

const cancelEdit = () => {
  initCompany()
}

const saveCompany = async () => {
  is_on_sending_process.value = true
  is_loading.value = true

  let data = new FormData()

  // Un archivo va solo si se eligio uno nuevo; la URL del guardado no se manda.
  let prepare_data = Object.assign({}, company)
  for (const campo of ARCHIVOS) {
    if (elegido(campo) instanceof File) data.append(campo, elegido(campo))
    delete prepare_data[campo]
  }

  prepare_data.bank_accounts = JSON.stringify(company.bank_accounts)
  for (let key in prepare_data) {
    data.append(key, prepare_data[key] === undefined || prepare_data[key] === null ? '' : prepare_data[key])
  }

  try {
    const response = await CompanyDataService.update(data)
    if (response.status === 200) {
      Swal.fire(appStore.successSavedOptions)
      initCompany()
    }
  } catch (e) {
    const nombres = { email: 'Email', name: 'Nombre', address: 'Dirección', phone: 'Teléfono' }
    Swal.fire({
      ...appStore.errorSavedOptions,
      text: mensajeDeError(e, 'No se pudieron guardar los datos de la empresa.', nombres)
    })
  } finally {
    is_on_sending_process.value = false
    is_loading.value = false
  }
}

const save = async () => {
  const { valid } = await editForm.value.validate()
  if (valid) {
    saveCompany()
  }
}

const isLetterOrSpace = (e) => Characters.checkCharacter(e, true)
const isLetterOrDigit = (e) => Characters.checkCharacterAndDigits(e, true)
const isDigit = (e) => Characters.checkDigits(e, false)

onMounted(() => {
  initCompany()
})
</script>

<style scoped>
/* La linea cortada de una zona sin archivo: no hay utilidad de Vuetify para
   punteado, asi que se arma con sus mismas variables. */
.zona-vacia {
  border: 1px dashed rgba(var(--v-border-color), calc(var(--v-border-opacity) * 2));
}
</style>
