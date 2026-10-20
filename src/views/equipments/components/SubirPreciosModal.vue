<template>
  <v-dialog v-model="dialog" class="dialog-premium" width="720" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header title="Subir precios" icon="mdi-file-upload-outline" @close="close" />

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1;">
        <v-file-input v-model="archivo" label="Excel de precios lleno" accept=".xlsx" :loading="revisando"
                      prepend-icon="" prepend-inner-icon="mdi-microsoft-excel" show-size clearable
                      density="compact" variant="outlined" hide-details @update:model-value="revisar" />

        <template v-if="vista">
          <p class="text-body-2 mt-4 mb-2">
            {{ vista.nuevos.length }} nuevos · {{ vista.cambios.length }} cambian · {{ vista.iguales }} iguales ·
            {{ vista.pendientes }} sin precio (no se tocan)
          </p>

          <v-alert v-if="vista.errores.length" type="error" variant="tonal" density="compact" class="mb-3"
                   title="Corrija el Excel: con errores no se guarda nada">
            <div v-for="error in vista.errores" :key="error" class="text-body-2">{{ error }}</div>
          </v-alert>

          <v-table v-if="vista.cambios.length || vista.nuevos.length" density="compact" class="tabla-mejorada mb-3">
            <thead>
              <tr>
                <th>Servicio</th>
                <th class="text-right">Antes</th>
                <th class="text-right">Ahora</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in vista.cambios" :key="c.nombre">
                <td>{{ c.nombre }}</td>
                <td class="text-right text-medium-emphasis text-no-wrap">{{ par(c.antes) }}</td>
                <td class="text-right font-weight-bold text-no-wrap">{{ par(c.despues) }}</td>
              </tr>
              <tr v-for="n in vista.nuevos" :key="n.nombre">
                <td>{{ n.nombre }}</td>
                <td class="text-right text-medium-emphasis">—</td>
                <td class="text-right font-weight-bold text-no-wrap">{{ par([n.estandar, n.corporativo]) }}</td>
              </tr>
            </tbody>
          </v-table>

          <template v-if="vista.comentarios.length">
            <div class="text-subtitle-2 mb-1">Comentarios del Excel</div>
            <div v-for="comentario in vista.comentarios" :key="comentario" class="text-body-2 text-medium-emphasis">
              {{ comentario }}
            </div>
          </template>
        </template>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :loading="guardando"
               :disabled="!puedeGuardar" @click="guardar">
          Guardar precios
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import { mensajeDeError } from '@/utils/errors'
import { monto } from '@/utils/money'

const emit = defineEmits(['reload'])

const dialog = ref(false)
const archivo = ref(null)
const vista = ref(null)
const revisando = ref(false)
const guardando = ref(false)

const par = ([estandar, corporativo]) => `${monto(estandar)} / ${monto(corporativo)}`

const puedeGuardar = computed(() => vista.value && !vista.value.errores.length
  && (vista.value.nuevos.length || vista.value.cambios.length))

// Lo que cambiaria se ve antes de guardar: el back lo revisa sin escribir nada.
async function revisar() {
  vista.value = null
  if (!archivo.value) return
  revisando.value = true
  try {
    const { data } = await EquipmentDataService.subirPrecios(archivo.value)
    vista.value = data
  } catch (e) {
    archivo.value = null
    Swal.fire('No se pudo leer el Excel', mensajeDeError(e, 'Revise que sea el Excel de precios.'), 'error')
  } finally {
    revisando.value = false
  }
}

async function guardar() {
  guardando.value = true
  try {
    const { data } = await EquipmentDataService.subirPrecios(archivo.value, true)
    emit('reload')
    close()
    Toast.fire({ timer: 2500, icon: 'success', title: `Precios guardados: ${data.nuevos.length} nuevos, ${data.cambios.length} cambiados` })
  } catch (e) {
    Swal.fire('No se guardaron los precios', mensajeDeError(e, 'No se pudo guardar.'), 'error')
  } finally {
    guardando.value = false
  }
}

function open() {
  archivo.value = null
  vista.value = null
  dialog.value = true
}

const close = () => { dialog.value = false }

defineExpose({ open })
</script>
