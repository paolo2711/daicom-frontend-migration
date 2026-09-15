<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="500" width="90%" persistent>
    <v-card v-if="certificate" @keydown.enter.stop="guardarConEnter">
      <base-modal-header :title="config.titulo" :icon="config.icono" @close="close">
        <span v-if="certificate">Correlativo: <span class="font-weight-bold text-primary ml-1">{{ certificate.registry_code }}</span></span>
      </base-modal-header>

      <v-card-text class="pt-4 pb-0">
        <v-alert
          type="info" density="compact" variant="tonal"
          class="mb-4 rounded-lg text-caption"
        >
          {{ config.explicacion }}
        </v-alert>

        <v-form ref="uploadForm" @submit.prevent>
          <v-row dense>
            <v-col cols="12" md="12">
              <v-file-input v-model="workbook.file" hide-details="auto" density="compact" show-size ref="file"
                            :accept="config.accept"
                            :placeholder="config.placeholder"
                            :label="config.label"/>
            </v-col>
            <v-col cols="12" md="12" class="mt-2" v-if="config.pideClave">
              <v-text-field v-model="workbook.password" label="Contraseña del archivo (si tiene)" density="compact" counter
                            :append-inner-icon="show ? 'mdi-eye' : 'mdi-eye-off'" autocomplete="off"
                            :type="show ? 'text' : 'password'" @click:append-inner="() => (show = !show)"
                            variant="outlined" hide-details="auto"/>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" @click="generatePreview"
               :disabled="!workbook.file">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { alPresionarEnter } from '@/utils/keyboard'
import { EXCEL_ACCEPT } from '@/utils/certificates/excel'

// Un modo por destino del archivo. Agregar uno es una entrada mas aqui.
const MODOS = {
  excel: {
    titulo: 'Adjuntar Excel',
    icono: 'mdi-file-excel',
    accept: EXCEL_ACCEPT,
    placeholder: 'Seleccione el archivo (.xls, .xlsx, .xlsm)',
    label: 'Documento de Excel',
    pideClave: true,
    explicacion: 'Se convierte a PDF en el servidor y podrá revisarlo antes de guardarlo.',
  },
  'pdf-base': {
    titulo: 'Adjuntar PDF ya hecho',
    icono: 'mdi-file-pdf-box',
    accept: 'application/pdf',
    placeholder: 'Seleccione el PDF del certificado',
    label: 'Documento PDF',
    pideClave: false,
    explicacion: 'Se guarda como certificado base, sin convertir. Queda listo para firmar.',
  },
  pdf: {
    titulo: 'Adjuntar PDF firmado',
    icono: 'mdi-file-pdf-box',
    accept: 'application/pdf',
    placeholder: 'Seleccione el PDF ya firmado',
    label: 'Documento PDF',
    pideClave: false,
    explicacion: 'Se sube directo a la nube tal como está, sin firmarlo de nuevo.',
  },
}

const dialog = ref(false)
const certificate = ref(null)
const show = ref(false)
const workbook = ref({ file: null, password: '' })
const uploadForm = ref(null)
const mode = ref('excel')

const emit = defineEmits(['file-attached'])

const config = computed(() => MODOS[mode.value] || MODOS.excel)

const open = (item, uploadMode = 'excel') => {
  certificate.value = item
  mode.value = uploadMode
  workbook.value.file = null
  workbook.value.password = ''
  if (uploadForm.value) uploadForm.value.reset()
  dialog.value = true
}

const close = () => {
  dialog.value = false
}

const generatePreview = () => {
  if (!workbook.value.file) return
  emit('file-attached', {
    id: certificate.value.id,
    file: workbook.value.file,
    password: workbook.value.password,
    modo: mode.value,
  })
  close()
}

const guardarConEnter = alPresionarEnter(generatePreview)

defineExpose({ open, close })
</script>
