<template>
  <div>
    <v-dialog v-model="dialog" class="dialog-premium" max-width="900px" persistent>
      <v-card v-if="equipment" class="rounded-lg">
        
        <base-modal-header
          :title="`HOJA DE VIDA: ${equipment.internal_id}`"
          icon="mdi-clipboard-text-clock"
          @close="dialog = false"
        >
          <v-chip color="primary" variant="outlined" size="small" class="font-weight-bold">
            {{ equipment.brand }} {{ equipment.model }}
          </v-chip>
        </base-modal-header>

        <v-tabs v-model="tab" :bg-color="isDark ? 'grey-darken-4' : 'grey-lighten-4'" color="primary" align-tabs="center" grow>
          <v-tab :value="0" class="font-weight-bold"><v-icon start size="small">mdi-truck-fast</v-icon> Historial Viajes</v-tab>
          <v-tab :value="1" class="font-weight-bold"><v-icon start size="small">mdi-certificate</v-icon> Calibración</v-tab>
          <v-tab :value="2" class="font-weight-bold"><v-icon start size="small">mdi-image-multiple</v-icon> Galería Visual</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item :value="0" class="pa-4" style="min-height: 350px;">
            <v-table density="compact" class="elevation-1 rounded-lg" style="border: 1px solid var(--v-border-color, #e0e0e0);">
              <thead>
                <tr :class="isDark ? 'bg-grey-darken-3' : 'bg-grey-lighten-3'">
                  <th class="text-left font-weight-bold text-uppercase">Nro Orden</th>
                  <th class="text-left font-weight-bold text-uppercase">Cliente</th>
                  <th class="text-center font-weight-bold text-uppercase">Salida</th>
                  <th class="text-center font-weight-bold text-uppercase">Retorno Real</th>
                  <th class="text-center font-weight-bold text-uppercase">Estado Viaje</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="h in equipment.rental_history" :key="h.id">
                  <td class="font-weight-medium">{{ h.order_number }}</td>
                  <td>{{ h.client_name }}</td>
                  <td class="text-center">{{ h.departure_date }}</td>
                  <td class="text-center" :class="h.actual_return_date ? 'text-green font-weight-bold' : ''">{{ h.actual_return_date || 'En ruta...' }}</td>
                  <td class="text-center">
                    <v-chip size="x-small" :color="h.return_status === 2 ? 'success' : 'amber-darken-3'" variant="flat" class="text-white">
                      {{ h.return_status === 2 ? 'DEVUELTO' : 'EN OBRA' }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="!equipment.rental_history || equipment.rental_history.length === 0">
                  <td colspan="5" class="text-center py-8 text-grey">
                    <v-icon size="large" color="grey-lighten-2">mdi-history</v-icon><br>
                    El equipo no registra movimientos históricos.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-window-item>

          <v-window-item :value="1" class="pa-4" style="min-height: 350px;">
            <v-card variant="outlined" class="pa-6 rounded-lg text-center" :class="isDark ? 'bg-grey-darken-4 border-grey-darken-3' : 'bg-grey-lighten-5 border-grey-lighten-3'">
              <div class="mb-6">
                <v-icon size="64" :color="equipment.latest_certificate ? 'success' : 'grey'">mdi-certificate-outline</v-icon>
              </div>
              
              <h3 class="text-h6 font-weight-bold mb-2" :class="isDark ? 'text-white' : 'text-grey-darken-4'">Vincular Certificado DAICOM</h3>
              <p class="font-weight-bold text-body-2 px-10" :class="isDark ? 'text-grey-lighten-1' : 'text-grey-darken-2'">Vincula un certificado de operatividad emitido por tu laboratorio a este equipo.</p>

              <div v-if="equipment.latest_certificate" class="mb-6 mt-4">
                <v-chip color="success" variant="flat" class="text-white font-weight-bold text-subtitle-2 px-4 py-4 mb-4">
                  <v-icon start size="20">mdi-check-decagram</v-icon>
                  EQUIPO CERTIFICADO
                </v-chip>
                
                <div class="text-subtitle-1 font-weight-bold" :class="isDark ? 'text-white' : 'text-grey-darken-4'">
                  Expediente: <span class="text-primary">{{ equipment.latest_certificate.registry_code }}</span>
                </div>
                <div class="text-caption mb-4" :class="isDark ? 'text-grey-lighten-1' : 'text-grey-darken-1'">
                  Emitido el: {{ equipment.latest_certificate.emission_date || '---' }}
                </div>

                <div class="d-flex justify-center" style="gap: 10px;">
                  <v-btn color="primary" variant="outlined" :href="equipment.latest_certificate.signed_pdf" target="_blank" :disabled="!equipment.latest_certificate.signed_pdf">
                    <v-icon start>mdi-file-pdf-box</v-icon> Ver PDF Firmado
                  </v-btn>
                  <v-btn color="error" variant="text" @click="unlinkCertificate" :loading="linkingCert">
                    <v-icon start>mdi-link-off</v-icon> Desvincular
                  </v-btn>
                </div>
              </div>

              <div v-else class="mx-auto" style="max-width: 400px;">
                <v-row dense align="center">
                  <v-col cols="8">
                    <v-text-field v-model="correlative_search" label="Nro. Correlativo (Ej: 15)" type="number" variant="outlined" density="compact" hide-details @keyup.enter="buscarCertificado"></v-text-field>
                  </v-col>
                  <v-col cols="4">
                    <v-btn color="secondary" variant="flat" block @click="buscarCertificado" :loading="searchingCert"><v-icon start>mdi-magnify</v-icon> Buscar</v-btn>
                  </v-col>
                </v-row>

                <v-expand-transition>
                  <v-card v-if="foundCert" variant="outlined" class="mt-4 pa-3 text-left" :class="isDark ? 'bg-grey-darken-3' : 'bg-white'">
                    <div class="subtitle-2 font-weight-bold mb-1 text-primary">Vista Previa:</div>
                    <div><strong>Expediente:</strong> {{ foundCert.registry_code }}</div>
                    <div><strong>Equipo:</strong> {{ foundCert.equipment }}</div>
                    <v-btn block color="success" variant="flat" class="mt-3 text-white" @click="linkCertificate" :loading="linkingCert">
                      <v-icon start>mdi-link-variant</v-icon> Vincular a este equipo
                    </v-btn>
                  </v-card>
                </v-expand-transition>
              </div>
            </v-card>
          </v-window-item>

          <v-window-item :value="2" class="pa-4 text-center" style="min-height: 350px;">
            <v-alert variant="tonal" type="info" density="compact" icon="mdi-camera-outline" class="text-left mb-4 text-caption">
              El estado visual del equipo está documentado aquí. Las fotos se añaden desde la opción "Editar Equipo".
            </v-alert>

            <v-row dense>
              <v-col cols="6" sm="4" md="3" v-for="(img, idx) in equipment.gallery" :key="idx">
                <v-card variant="outlined" class="rounded-lg fill-height d-flex flex-column" :class="isDark ? 'bg-grey-darken-4' : ''">
                  <v-img :src="img.image" height="150" :class="[isDark ? 'bg-grey-darken-4' : 'bg-grey-lighten-2', 'align-end', 'text-left']" cover @click="openViewer(idx)" style="cursor: pointer;">
                    <template v-slot:placeholder>
                      <v-row class="fill-height ma-0" align="center" justify="center"><v-progress-circular indeterminate color="primary"></v-progress-circular></v-row>
                    </template>
                    <div class="pa-1" style="background: rgba(0,0,0,0.6);">
                      <span class="text-white text-caption font-weight-medium"><v-icon size="x-small" color="white" start>mdi-calendar</v-icon>{{ formatDate(img.uploaded_at) }}</span>
                    </div>
                  </v-img>
                </v-card>
              </v-col>
            </v-row>

            <div v-if="!equipment.gallery || equipment.gallery.length === 0" class="text-grey py-12">
              <v-icon size="64" color="grey-lighten-2" class="mb-3">mdi-image-off-outline</v-icon><br>
              No hay fotografías de inspección registradas.
            </div>
          </v-window-item>
        </v-window>
      </v-card>
    </v-dialog>

    <v-dialog v-model="viewerDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card tile color="black" class="d-flex flex-column" style="height: 100vh;">
        <v-toolbar color="transparent" class="text-white" flat>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" size="large" @click="viewerDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-carousel v-model="viewerIndex" hide-delimiters height="100%" :show-arrows="equipment && equipment.gallery && equipment.gallery.length > 1 ? 'hover' : false">
          <v-carousel-item v-for="(img, i) in (equipment ? equipment.gallery : [])" :key="i">
            <v-img :src="img.image" height="100%"></v-img>
          </v-carousel-item>
        </v-carousel>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import CertificateDataService from '@/services/certificates/certificateDataService'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const dialog = ref(false)
const tab = ref(0)
const equipment = ref(null)
const correlative_search = ref('')
const searchingCert = ref(false)
const foundCert = ref(null)
const linkingCert = ref(false)
const viewerDialog = ref(false)
const viewerIndex = ref(0)

const formatDate = (val) => {
  return val ? val.substring(0, 10) : ''
}

const open = (item) => {
  equipment.value = item
  tab.value = 0
  correlative_search.value = ''
  foundCert.value = null
  dialog.value = true
}

const openViewer = (index) => {
  viewerIndex.value = index
  viewerDialog.value = true
}

const buscarCertificado = async () => {
  if (!correlative_search.value) return
  searchingCert.value = true
  foundCert.value = null

  try {
    const res = await CertificateDataService.getFiltered(1, 10, '', '', '', '', Number(correlative_search.value), '')
    const validos = res.data.results.filter(c => c.status !== 5)
    if (validos.length > 0) {
      foundCert.value = validos[0]
    } else {
      Swal.fire('No encontrado', 'No existe un certificado válido con ese correlativo.', 'warning')
    }
  } catch (e) {
    Swal.fire('Error', 'Hubo un problema al buscar.', 'error')
  } finally {
    searchingCert.value = false
  }
}

const linkCertificate = async () => {
  linkingCert.value = true
  try {
    await InventoryDataService.update(equipment.value.id, { latest_certificate: foundCert.value.id })
    equipment.value.latest_certificate = foundCert.value
    foundCert.value = null
    correlative_search.value = ''
    Swal.fire('Vinculado', 'Certificado asociado exitosamente', 'success')
  } catch (e) {
    Swal.fire('Error', 'No se pudo vincular', 'error')
  } finally {
    linkingCert.value = false
  }
}

const unlinkCertificate = async () => {
  linkingCert.value = true
  try {
    await InventoryDataService.update(equipment.value.id, { latest_certificate: null })
    equipment.value.latest_certificate = null
    Swal.fire('Desvinculado', 'El certificado fue retirado del equipo', 'info')
  } catch (e) {
    Swal.fire('Error', 'No se pudo desvincular', 'error')
  } finally {
    linkingCert.value = false
  }
}

defineExpose({ open })
</script>