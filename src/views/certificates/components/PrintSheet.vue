<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="560" width="90%" persistent>
    <v-card @keydown.enter.stop="imprimirConEnter">
      <base-modal-header title="Excel a PDF" icon="mdi-printer" @close="close">
        <span>Archivos sueltos, sin certificado</span>
      </base-modal-header>

      <v-card-text class="pt-4 pb-0">
        <v-alert
          type="info" density="compact" variant="tonal"
          class="mb-4 rounded-lg text-caption"
        >
          Se imprime la hoja <span class="font-weight-bold">IMPRESION</span> o
          <span class="font-weight-bold">IMPRIMIR</span> de cada archivo, con la carátula y la
          paginación de siempre. El PDF sale para descargar: no se guarda en ningún certificado
          ni se firma.
        </v-alert>

        <v-form ref="formulario" @submit.prevent>
          <v-file-input
            v-model="archivos" multiple show-size chips
            density="compact" hide-details="auto" ref="file"
            :accept="EXCEL_ACCEPT"
            label="Documentos de Excel"
            placeholder="Seleccione uno o varios (.xls, .xlsx, .xlsm)"
          />

          <v-text-field
            v-model="password" class="mt-4"
            label="Contraseña de los archivos (si tienen)"
            density="compact" variant="outlined" counter autocomplete="off"
            hide-details="auto"
            :type="ver_clave ? 'text' : 'password'"
            :append-inner-icon="ver_clave ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="() => (ver_clave = !ver_clave)"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        <v-btn
          color="primary" variant="flat" class="font-weight-bold px-4"
          :disabled="!archivos.length" @click="imprimir"
        >
          <v-icon start>mdi-printer</v-icon> Convertir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { Toast } from '@/plugins/alerts'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'
import { EXCEL_ACCEPT } from '@/utils/certificates/excel'
import { alPresionarEnter } from '@/utils/keyboard'
import { uuid } from '@/utils/uuid'

const dialog = ref(false)
const archivos = ref([])
const password = ref('')
const ver_clave = ref(false)

const open = () => {
  archivos.value = []
  password.value = ''
  ver_clave.value = false
  dialog.value = true
}

const close = () => {
  dialog.value = false
}

const imprimir = () => {
  if (!archivos.value.length) return

  // Cada archivo va como su propia tarea del panel de subidas, con un id
  // propio porque detras no hay certificado que lo identifique.
  archivos.value.forEach(file => {
    window.dispatchEvent(new CustomEvent('wss-sheet-start', {
      detail: {
        tipo: 'suelto',
        id: uuid(),
        code: file.name,
        file,
        password: password.value,
      },
    }))
  })

  Toast.fire({
    timer: 3000, icon: 'success',
    title: archivos.value.length === 1
      ? 'Enviando el archivo a convertir...'
      : `Enviando ${archivos.value.length} archivos a convertir...`,
  })
  close()
}

const imprimirConEnter = alPresionarEnter(imprimir)

defineExpose({ open, close })
</script>
