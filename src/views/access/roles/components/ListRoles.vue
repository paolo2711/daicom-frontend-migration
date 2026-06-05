<template>
  <v-container fluid class="down-top-padding pa-0">
    
    <v-card variant="flat" class="border rounded-lg mb-4 pa-2 elevation-0">
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Buscar rol..."
        single-line
        hide-details
        variant="outlined"
        density="compact"
        @update:model-value="options.page = 1"
      />
    </v-card>

    <div style="position: relative; border-radius: 8px; z-index: 1;">
      <div
        v-if="loading"
        style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2; pointer-events: all; border-radius: 8px; display: flex; flex-direction: column;"
        :style="{ backgroundColor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)' }"
      >
        <div style="position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
          <v-progress-circular indeterminate color="primary" size="64" width="6" />
          <div class="mt-4 font-weight-bold text-h6" :class="isDark ? 'text-white' : 'text-primary'">
            Cargando roles...
          </div>
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="roles"
        :search="search"
        class="elevation-0 rounded-lg tabla-mejorada bg-surface"
        style="border: 1px solid var(--v-border-color, rgba(0,0,0,0.12));"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
        hover
        @click:row="onRowClick"
      >
        <template v-slot:bottom>
          <fluent-pagination
            :page="options.page"
            :itemsPerPage="options.itemsPerPage"
            :totalItems="filteredRolesCount"
            @update:page="options.page = $event"
            @update:itemsPerPage="onItemsPerPageChange"
          />
        </template>

        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-icon color="primary" size="small" class="mr-2">mdi-shield-check-outline</v-icon>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="text-right">
            <v-btn icon variant="text" size="small" v-if="item.id !== -2" @click.stop="openEditDialog(item)">
              <v-icon size="small">mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon variant="text" color="red-darken-2" size="small" v-if="item.id !== -2" @click.stop="deleteConfirm(item)">
              <v-icon size="small">mdi-delete</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </div>

    <role-form-dialog v-model="dialogOpen" :role="selectedRole" @reloadListComponent="retrieveAllRoles" />

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import RoleDataService from '@/services/roles/roleDataService'
import RoleMappers from '@/mappers/roleMappers'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import { useAppStore } from '@/stores/appStore'

const RoleFormDialog = defineAsyncComponent(() => import('@/views/access/roles/components/RoleFormDialog.vue'))

const emit = defineEmits(['selectedRole'])

const theme = useTheme()
const appStore = useAppStore()

const isDark = computed(() => theme.global.current.value.dark)

const headers = [
  { title: 'Nombre del Rol', key: 'name', align: 'start' },
  { title: 'Opciones', key: 'actions', align: 'end', sortable: false, width: '120px' },
]

const roles = ref([])
const loading = ref(false)
const search = ref('')
const options = ref({ page: 1, itemsPerPage: 30 })

const dialogOpen = ref(false)
const selectedRole = ref(null)

const filteredRolesCount = computed(() => {
  if (!search.value) return roles.value.length
  const s = search.value.toLowerCase()
  return roles.value.filter(item => item.name && item.name.toLowerCase().includes(s)).length
})

const retrieveAllRoles = () => {
  loading.value = true
  RoleDataService.getAll().then((response) => {
    roles.value = response.data.map(RoleMappers.fullMap)
  }).catch((e) => {
    console.error(e)
    Swal.fire(appStore.networkErrorOptions)
  }).finally(() => {
    loading.value = false
  })
}

const onItemsPerPageChange = (newVal) => {
  options.value.itemsPerPage = newVal
  options.value.page = 1
}

const deleteRole = (role) => {
  RoleDataService.delete(role.id).then((response) => {
    if (response.status === 204) {
      Swal.fire(appStore.successDeletedOptions).then(() => {
        const index = roles.value.findIndex(r => r.id === role.id)
        if (index !== -1) roles.value.splice(index, 1)
      })
    }
  }).catch(() => {
    Swal.fire(appStore.errorDeleteOptions)
  })
}

const deleteConfirm = (role) => {
  Swal.fire(appStore.deleteConfirmOptions).then((result) => {
    if (result.isConfirmed) {
      deleteRole(role)
    }
  })
}

const openEditDialog = (role) => {
  selectedRole.value = role
  dialogOpen.value = true
}

const openAddDialog = () => {
  selectedRole.value = null
  dialogOpen.value = true
}

const onRowClick = (event, { item }) => {
  const rawItem = item.raw || item
  emit('selectedRole', rawItem)
}

onMounted(() => {
  retrieveAllRoles()
})

defineExpose({ retrieveAllRoles, openAddDialog })
</script>

<style scoped>
.tabla-mejorada {
  border: 1px solid var(--v-border-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>