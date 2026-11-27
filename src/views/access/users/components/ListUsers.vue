<template>
  <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
    <div class="d-flex flex-wrap align-center ga-2">
      <v-text-field
        v-model="filtros.search"
        hide-details
        density="compact"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        label="Buscar usuario"
        clearable
        style="max-width: 18.75rem;"
      />
      <v-select
        v-model="filtros.kind"
        :items="roles"
        item-title="name"
        item-value="id"
        :item-props="propsDeRol(isSuperAdmin, 'Solo los ve un administrador')"
        label="Rol"
        clearable
        hide-details
        density="compact"
        variant="outlined"
        style="max-width: 15rem;"
      />
      <v-spacer />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="abrirFormulario(null)">
        Nuevo usuario
      </v-btn>
    </div>
  </v-card>

  <table-loading-overlay :loading="loading" :isEmpty="users.length === 0">
    <v-data-table-server
      :headers="headers"
      :items="users"
      :items-length="total_users"
      :loading="loading"
      item-value="id"
      :hover="false"
      class="elevation-0 rounded-lg tabla-mejorada bg-surface"
      v-model:page="options.page"
      v-model:items-per-page="options.itemsPerPage"
      hide-default-footer
      @contextmenu:row="alClickDerecho"
      :row-props="({ item }) => ({ class: { 'fila-en-menu': estaEnElMenu(item) } })"
    >
      <template v-slot:bottom>
        <fluent-pagination
          v-model:page="options.page"
          v-model:itemsPerPage="options.itemsPerPage"
          :totalItems="total_users"
        />
      </template>

      <template v-slot:item.username="{ item }">
        <span class="font-weight-bold">{{ item.username }}</span>
      </template>

      <template v-slot:item.acciones="{ item }">
        <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
               @click.stop="alBotonDeFila($event, item)" />
      </template>
    </v-data-table-server>
  </table-loading-overlay>

  <user-form-dialog v-model="dialogOpen" :user="selectedUser" :roles="roles" @reloadListComponent="retrieveAllUsers" />
  <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
               @accion="clave => ejecutarAccion(clave, menu.filas)" />
</template>

<script setup>
import { ref, watch, onMounted, defineAsyncComponent } from 'vue'
import Swal from 'sweetalert2'
import RoleDataService from '@/services/roles/roleDataService'
import UserDataService from '@/services/users/userDataService'
import RoleMappers from '@/mappers/roleMappers'
import UserMappers from '@/mappers/userMappers'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import { useActionCall } from '@/composables/useActionCall'
import { useContextMenu } from '@/composables/useContextMenu'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePage } from '@/composables/usePage'
import { usePermissions } from '@/composables/usePermissions'
import { accionesPara } from '@/utils/actions'
import { debounce } from '@/utils/debounce'
import { mensajeDeError } from '@/utils/errors'
import { leerPagina, porPagina } from '@/utils/pagination'
import { ACCIONES_USUARIO } from '@/utils/users/acciones'
import { propsDeRol } from '@/utils/users/roles'

const UserFormDialog = defineAsyncComponent(() => import('@/views/access/users/components/UserFormDialog.vue'))

const headers = [
  { title: 'Usuario', key: 'username', sortable: false },
  { title: 'Nombre', key: 'first_name', sortable: false },
  { title: 'Apellidos', key: 'last_name', sortable: false },
  { title: 'Correo', key: 'email', sortable: false },
  { title: 'Rol', key: 'kind_description', sortable: false },
  { title: 'Opciones', key: 'acciones', align: 'center', sortable: false },
]

const users = ref([])
const total_users = ref(0)
const loading = ref(false)
const filtros = ref({ search: '', kind: null })
const { opciones: options, alInicio } = usePage(() => retrieveAllUsers())

// Los roles del filtro, que el formulario usa tambien.
const roles = ref([])
const { isSuperAdmin } = usePermissions()
const cargarRoles = () => RoleDataService.getAll().then((res) => {
  roles.value = res.data.map(RoleMappers.fullMap)
}).catch((err) => {
  Swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, 'No se pudieron leer los roles.') })
})

const dialogOpen = ref(false)
const selectedUser = ref(null)
const abrirFormulario = (user) => { selectedUser.value = user; dialogOpen.value = true }

const { begin: beginLoad, isLatest: isLatestLoad } = useLatestRequest()

const retrieveAllUsers = () => {
  loading.value = true
  const token = beginLoad()
  const pagina = porPagina(options.value.page, options.value.itemsPerPage)
  UserDataService.getFiltered({ ...filtros.value, ...pagina }).then((res) => {
    if (!isLatestLoad(token)) return
    const leida = leerPagina(res.data)
    users.value = leida.filas.map(UserMappers.getMap)
    total_users.value = leida.total
  }).catch((err) => {
    Swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, 'No se pudo leer la lista de usuarios.') })
  }).finally(() => {
    if (isLatestLoad(token)) loading.value = false
  })
}

watch(filtros, debounce(alInicio), { deep: true })

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(users)
const { confirmarYLlamar } = useActionCall()
const accionesDe = (filas) => accionesPara(ACCIONES_USUARIO, filas, () => true)

async function ejecutarAccion (clave, [usuario]) {
  switch (clave) {
    case 'editar': return abrirFormulario(usuario)
    case 'eliminar': {
      const hecho = await confirmarYLlamar({
        titulo: `¿Eliminar a ${usuario.username}?`, boton: 'Sí, eliminar',
        texto: 'Ya no podrá entrar a la app. Lo que registró se conserva.',
        llamar: () => UserDataService.delete(usuario.id),
        exito: 'Usuario eliminado', fallo: 'No se pudo eliminar el usuario.',
      })
      if (hecho) retrieveAllUsers()
    }
  }
}

onMounted(() => { retrieveAllUsers(); cargarRoles() })
</script>
