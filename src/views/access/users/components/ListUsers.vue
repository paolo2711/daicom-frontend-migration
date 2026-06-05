<template>
  <v-container fluid class="down-top-padding pa-0">

    <v-card variant="flat" class="border rounded-lg mb-4 pa-2 elevation-0">
      <v-text-field 
        v-model="search" 
        append-inner-icon="mdi-magnify"
        label="Buscar usuario por nombre o correo..."
        single-line 
        hide-details 
        variant="outlined" 
        density="compact"
        @update:model-value="options.page = 1"
      />
    </v-card>

    <table-loading-overlay :loading="loading" :isEmpty="users.length === 0">
      <v-data-table 
        :headers="headers"
        :items="users"
        :search="search"
        class="elevation-0 rounded-lg tabla-mejorada bg-surface"
        style="border: 1px solid var(--v-border-color, rgba(0,0,0,0.12));"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
      >
        <template v-slot:bottom>
          <fluent-pagination
            :page="options.page"
            :itemsPerPage="options.itemsPerPage"
            :totalItems="filteredUsersCount"
            @update:page="options.page = $event"
            @update:itemsPerPage="onItemsPerPageChange"
          />
        </template>

        <template v-slot:item.kind_description="{ item }">
          <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
            {{ item.kind_description }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon variant="text" size="small" class="mr-1" @click="openEditDialog(item)">
            <v-icon size="small">mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon variant="text" color="red-darken-2" size="small" @click="deleteUserConfirm(item)">
            <v-icon size="small">mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </table-loading-overlay>

    <user-form-dialog v-model="dialogOpen" :user="selectedUser" @reloadListComponent="retrieveAllUsers" />

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'

import Swal from 'sweetalert2'
import UserDataService from '@/services/users/userDataService'
import UserMappers from '@/mappers/userMappers'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import { useAppStore } from '@/stores/appStore'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'

const UserFormDialog = defineAsyncComponent(() => import('@/views/access/users/components/UserFormDialog.vue'))


const appStore = useAppStore()



const headers = [
  { title: 'Usuario', key: 'username', align: 'start'},
  { title: 'Nombre', key: 'first_name'},
  { title: 'Apellidos', key: 'last_name'},
  { title: 'Correo', key: 'email'},
  { title: 'Rol', key: 'kind_description'},
  { title: 'Opciones', key: 'actions', sortable: false, align: 'center', width: '120px'},
]

const users = ref([])
const loading = ref(false)
const search = ref('')
const options = ref({ page: 1, itemsPerPage: 30 })

const dialogOpen = ref(false)
const selectedUser = ref(null)

const filteredUsersCount = computed(() => {
  if (!search.value) return users.value.length
  const s = search.value.toLowerCase()
  return users.value.filter(item => 
    (item.username && item.username.toLowerCase().includes(s)) ||
    (item.first_name && item.first_name.toLowerCase().includes(s)) ||
    (item.last_name && item.last_name.toLowerCase().includes(s)) ||
    (item.email && item.email.toLowerCase().includes(s))
  ).length
})

const retrieveAllUsers = () => {
  loading.value = true
  UserDataService.getAll().then((response) => {
    users.value = response.data.results ? response.data.results.map(UserMappers.getMap) : response.data.map(UserMappers.getMap)
  }).catch((e) => {
    console.error(e)
  }).finally(() => {
    loading.value = false
  })
}

const onItemsPerPageChange = (newVal) => {
  options.value.itemsPerPage = newVal
  options.value.page = 1
}

const deleteUser = (user) => {
  UserDataService.delete(user.id).then((response) => {
    if (response.status === 204) {
      Swal.fire(appStore.successDeletedOptions).then(() => {
        const index = users.value.findIndex(u => u.id === user.id)
        if (index !== -1) users.value.splice(index, 1)
      })
    }
  }).catch(() => {
    Swal.fire(appStore.errorDeleteOptions)
  })
}

const deleteUserConfirm = (user) => {
  Swal.fire(appStore.deleteConfirmOptions).then((result)=> {
    if (result.isConfirmed) { deleteUser(user) }
  })
}

const openEditDialog = (user) => {
  selectedUser.value = user
  dialogOpen.value = true
}

const openAddDialog = () => {
  selectedUser.value = null
  dialogOpen.value = true
}

onMounted(() => {
  retrieveAllUsers()
})

defineExpose({ retrieveAllUsers, openAddDialog })
</script>

<style scoped>
.tabla-mejorada {
  border: 1px solid var(--v-border-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>