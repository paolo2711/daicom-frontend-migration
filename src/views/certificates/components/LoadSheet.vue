<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="500" width="90%" persistent>
    <v-card v-if="certificate">
      <base-modal-header 
        :title="mode === 'pdf' ? 'Subir PDF Rescatado' : 'Adjuntar Excel'" 
        :icon="mode === 'pdf' ? 'mdi-file-pdf-box' : 'mdi-file-excel'" 
        @close="close"
      >
        <span v-if="certificate">Correlativo: <span class="font-weight-bold text-primary ml-1">{{ certificate.registry_code }}</span></span>
      </base-modal-header>

      <v-card-text class="pt-4 pb-0">
        <v-form ref="uploadForm" @submit.prevent>
          <v-row dense>
            <v-col cols="12" md="12">
              <v-file-input v-model="workbook.file" hide-details="auto" density="compact" show-size ref="file"
                            :accept="mode === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'"
                            :placeholder="mode === 'pdf' ? 'Seleccione su PDF offline' : 'Seleccione su documento XLSX'"
                            :label="mode === 'pdf' ? 'Documento PDF' : 'Documento de excel'"/>
            </v-col>
            <v-col cols="12" md="12" class="mt-2" v-if="mode === 'excel'">
              <v-text-field v-model="workbook.password" label="Contraseña de la hoja" density="compact" counter
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
        <v-btn color="primary" @click="generatePreview"
               :disabled="!workbook.file">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'

const dialog = ref(false)
const certificate = ref(null)

const show = ref(false)
const workbook = ref({ file: null, password: '', related_certificate: '' })
const uploadForm = ref(null)
const emit = defineEmits(['file-attached'])

const mode = ref('excel')

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
  emit('file-attached', {
    id: certificate.value.id,
    file: workbook.value.file,
    password: workbook.value.password
  })
  close()
}

defineExpose({ open, close })
</script>