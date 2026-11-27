<template>
  <v-card class="panel-permisos d-flex flex-column" elevation="0" rounded="lg" border>
    <detail-empty v-if="!rol" titulo="Permisos" icono="mdi-lock-open-check-outline"
                  texto="Elige un rol para ver sus permisos." />

    <template v-else>
      <div class="pa-3 border-b-thin flex-shrink-0 position-relative">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-lock-open-check-outline</v-icon>
          <span class="text-subtitle-2 font-weight-bold text-truncate">{{ rol.name }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" density="comfortable" title="Cerrar" @click="emit('cerrar')" />
        </div>
        <v-progress-linear :active="cargando" indeterminate absolute location="bottom" height="2" color="primary" />
      </div>

      <p v-if="esDeLaApp" class="text-body-2 text-medium-emphasis text-center pa-8 mb-0">
        Administrador tiene todos los permisos. Viene con la app: no se cambia.
      </p>

      <template v-else>
        <div class="cuerpo pa-3 flex-grow-1" :class="{ cargando }">
          <v-treeview v-model:selected="marcados" :items="arbol" selectable select-strategy="independent"
                      selected-color="primary" item-title="name" item-value="id" density="compact"
                      class="text-body-2" />
        </div>
        <div class="d-flex justify-end ga-2 px-3 py-3 border-t-thin flex-shrink-0">
          <v-btn variant="tonal" :disabled="!cambiado || guardando" @click="deshacer">Deshacer</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" :loading="guardando"
                 :disabled="!cambiado" @click="guardar">Guardar</v-btn>
        </div>
      </template>
    </template>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import PermissionDataService from '@/services/permissions/permissionDataService'
import DetailEmpty from '@/components/shared/DetailEmpty.vue'
import { useActionCall } from '@/composables/useActionCall'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePermissions } from '@/composables/usePermissions'
import { useLeaveGuard } from '@/composables/useUnsavedChanges'
import { mensajeDeError } from '@/utils/errors'
import { arbolDePermisos, marcadosDe, permisosDe } from '@/utils/roles/permisos'
import { ROL_ADMINISTRADOR } from '@/utils/users/roles'

// Los permisos del rol elegido: se marcan en el arbol y se guardan con su pie (R10). La pantalla pregunta antes
// de cambiar de rol con `cambiado`.
const props = defineProps({
  rol: { type: Object, default: null },
})
const emit = defineEmits(['cerrar'])

const arbol = arbolDePermisos(usePermissions().isSuperAdmin)
const marcados = ref([])
const guardados = ref([])
const cargando = ref(false)
const guardando = ref(false)
const esDeLaApp = computed(() => props.rol?.id === ROL_ADMINISTRADOR)

// Es un conjunto: marcar y desmarcar lo mismo no es un cambio.
const clave = (ids) => [...ids].map(String).sort().join()
const cambiado = computed(() => clave(marcados.value) !== clave(guardados.value))
const deshacer = () => { marcados.value = [...guardados.value] }
useLeaveGuard(() => cambiado.value)

const { begin, isLatest } = useLatestRequest()
const { llamarSinPreguntar } = useActionCall()

async function cargar () {
  const token = begin()
  marcados.value = []
  guardados.value = []
  cargando.value = false
  if (!props.rol || esDeLaApp.value) return
  cargando.value = true
  try {
    const { data } = await PermissionDataService.get(props.rol.id)
    if (!isLatest(token)) return
    guardados.value = marcadosDe(data.permission_list)
    deshacer()
  } catch (err) {
    if (isLatest(token)) Swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, 'No se pudieron leer sus permisos.') })
  } finally {
    if (isLatest(token)) cargando.value = false
  }
}
watch(() => props.rol?.id, cargar, { immediate: true })

async function guardar () {
  guardando.value = true
  const hecho = await llamarSinPreguntar(
    () => PermissionDataService.create({ role: props.rol.id, permission_list: permisosDe(arbol, marcados.value) }),
    'Permisos guardados', 'No se pudieron guardar los permisos.')
  if (hecho) guardados.value = [...marcados.value]
  guardando.value = false
}

defineExpose({ cambiado })
</script>

<style scoped>
/* Lo que queda de la ventana bajo el titulo y la barra: el pie con Guardar siempre a la vista (R10). */
.panel-permisos { max-height: calc(100dvh - 11rem); }
.cuerpo { overflow-y: auto; min-height: 0; }
.cargando { opacity: 0.5; pointer-events: none; }
</style>
