<template>
  <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
    <div class="d-flex flex-wrap align-center ga-2">
      <v-text-field
        v-model="search"
        hide-details
        density="compact"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        label="Buscar rol"
        clearable
        style="max-width: 18.75rem;"
      />
      <v-spacer />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="abrirFormulario(null)">
        Nuevo rol
      </v-btn>
    </div>
  </v-card>

  <resizable-split v-model:abierto="panelAbierto" clave="roles.permisos" :inicial="45">
    <table-loading-overlay :loading="loading" :isEmpty="roles.length === 0">
      <v-data-table
        :headers="headers"
        :items="filtrados"
        item-value="id"
        class="elevation-0 rounded-lg tabla-mejorada bg-surface"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
        @click:row="(_, { item }) => elegir(item)"
        @contextmenu:row="alClickDerecho"
        :row-props="({ item }) => ({ class: {
          'fila-elegida': foco?.id === item.id, 'fila-en-menu': estaEnElMenu(item), 'cursor-pointer': true,
        } })"
      >
        <template v-slot:bottom>
          <fluent-pagination
            v-model:page="options.page"
            v-model:itemsPerPage="options.itemsPerPage"
            :totalItems="filtrados.length"
          />
        </template>

        <template v-slot:item.name="{ item }">
          <span class="font-weight-bold">{{ item.name }}</span>
        </template>

        <template v-slot:item.acciones="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 @click.stop="alBotonDeFila($event, item)" />
        </template>
      </v-data-table>
    </table-loading-overlay>

    <template #lado>
      <panel-role-permissions ref="panel" :rol="foco" @cerrar="elegir(null)" />
    </template>
  </resizable-split>

  <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
               @accion="clave => ejecutarAccion(clave, menu.filas)" />
  <role-form-dialog v-model="dialogOpen" :role="selectedRole" @reloadListComponent="retrieveAllRoles" />
</template>

<script setup>
import { computed, ref, watch, onMounted, defineAsyncComponent } from 'vue'
import Swal from 'sweetalert2'
import RoleDataService from '@/services/roles/roleDataService'
import RoleMappers from '@/mappers/roleMappers'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import ResizableSplit from '@/components/shared/ResizableSplit.vue'
import PanelRolePermissions from '@/views/access/permissions/components/PanelRolePermissions.vue'
import { useActionCall } from '@/composables/useActionCall'
import { useContextMenu } from '@/composables/useContextMenu'
import { salirSinGuardar } from '@/composables/useUnsavedChanges'
import { accionesPara } from '@/utils/actions'
import { mensajeDeError } from '@/utils/errors'
import { primeraPagina } from '@/utils/pagination'
import { ACCIONES_ROL } from '@/utils/roles/acciones'
import { contieneSinTildes } from '@/utils/text'

const RoleFormDialog = defineAsyncComponent(() => import('@/views/access/roles/components/RoleFormDialog.vue'))

const headers = [
  { title: 'Rol', key: 'name' },
  { title: 'Opciones', key: 'acciones', align: 'center', sortable: false },
]

const roles = ref([])
const loading = ref(false)
const search = ref('')
const options = ref(primeraPagina())
// Son pocos y el formulario de usuario los usa todos: se traen juntos y se buscan aca.
const filtrados = computed(() => roles.value.filter(rol => contieneSinTildes(rol.name, search.value)))
watch(search, () => { options.value.page = 1 })

const dialogOpen = ref(false)
const selectedRole = ref(null)
const abrirFormulario = (rol) => { selectedRole.value = rol; dialogOpen.value = true }

// El rol cuyos permisos muestra el panel. Cambiarlo con permisos sin guardar pregunta antes.
const panel = ref(null)
const foco = ref(null)
const panelAbierto = ref(false)
async function elegir (rol) {
  if (rol?.id === foco.value?.id) return
  if (panel.value?.cambiado && !(await salirSinGuardar())) return
  foco.value = rol
  panelAbierto.value = Boolean(rol)
}

const retrieveAllRoles = () => {
  loading.value = true
  RoleDataService.getAll().then((res) => {
    roles.value = res.data.map(RoleMappers.fullMap)
    // El elegido sigue elegido con lo que trajo la recarga (su nombre nuevo).
    if (foco.value) foco.value = roles.value.find(r => r.id === foco.value.id) ?? null
  }).catch((err) => {
    Swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, 'No se pudo leer la lista de roles.') })
  }).finally(() => {
    loading.value = false
  })
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(roles)
const { confirmarYLlamar } = useActionCall()
const accionesDe = (filas) => accionesPara(ACCIONES_ROL, filas, () => true)

async function ejecutarAccion (clave, [rol]) {
  switch (clave) {
    case 'editar': return abrirFormulario(rol)
    case 'eliminar': {
      const hecho = await confirmarYLlamar({
        titulo: `¿Eliminar el rol ${rol.name}?`, boton: 'Sí, eliminar',
        texto: 'Deja de aparecer en la lista y ya no se puede asignar a nadie.',
        llamar: () => RoleDataService.delete(rol.id),
        exito: 'Rol eliminado', fallo: 'No se pudo eliminar el rol.',
      })
      if (!hecho) return
      if (rol.id === foco.value?.id) { foco.value = null; panelAbierto.value = false }
      retrieveAllRoles()
    }
  }
}

onMounted(() => { retrieveAllRoles() })
</script>
