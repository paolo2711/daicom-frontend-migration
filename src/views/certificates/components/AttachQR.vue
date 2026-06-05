<template>
  <v-dialog v-model="dialog" class="dialog-premium" width="500" persistent>
    <v-card v-if="certificate">
      <base-modal-header 
        :title="certificate.uploaded ? 'Reemplazar en la Nube' : 'Generar QR y Firmar'" 
        :icon="certificate.uploaded ? 'mdi-alert' : 'mdi-qrcode'" 
        :iconColor="certificate.uploaded ? 'orange-darken-2' : 'primary'" 
        @close="close"
      >
        Correlativo: <span class="font-weight-bold ml-1" :class="certificate.uploaded ? 'text-orange-darken-2' : 'text-primary'">{{ certificate.registry_code }}</span>
      </base-modal-header>
      
      <v-card-text class="pt-6 pb-0">
        <h3 class="text-subtitle-1 font-weight-bold mb-3" style="line-height: 1.2;">¿Está seguro que desea continuar?</h3>
        
        <v-alert v-if="certificate.uploaded" type="warning" density="compact" variant="tonal" border="start" class="mb-2 rounded-lg text-body-2">
          <strong>CUIDADO:</strong> Este certificado ya está en la nube. Si continúa, sobrescribirá el archivo
          público y todos los códigos QR físicos existentes ahora mostrarán esta nueva versión del PDF.
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        <v-btn :color="certificate.uploaded ? 'orange-darken-2' : 'primary'" class="font-weight-bold px-4" variant="flat" @click="generate">
          {{ certificate.uploaded ? 'Confirmar Reemplazo' : 'Aceptar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getCurrentInstance, ref } from 'vue'

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const dialog = ref(false)
const certificate = ref(null)

const open = (item) => {
  certificate.value = item
  dialog.value = true
}

const close = () => {
  dialog.value = false
}

const generate = () => {
  window.dispatchEvent(new CustomEvent('wss-qr-start', {
    detail: { certificate: certificate.value }
  }))

  const Toast = $swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false,
    timer: 3000, timerProgressBar: true,
  })
  Toast.fire({ icon: 'info', title: `Procesando ${certificate.value.registry_code} en segundo plano...` })

  close()
}

defineExpose({ open, close })
</script>