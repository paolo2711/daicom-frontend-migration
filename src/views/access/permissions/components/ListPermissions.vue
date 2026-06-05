<template>
  <v-card variant="flat" class="border rounded-lg bg-surface elevation-0 h-100 d-flex flex-column">
    
    <div class="d-flex align-center pa-4" style="border-bottom: 1px solid var(--v-border-color, rgba(0,0,0,0.12));">
      <v-icon start color="primary" class="mr-2">mdi-lock-open-check</v-icon>
      <h3 class="text-subtitle-1 font-weight-bold mb-0 d-flex align-center">
        Permisos: <v-chip v-if="selected_role?.name" color="primary" variant="tonal" size="small" class="ml-2 font-weight-bold">{{ selected_role.name }}</v-chip>
      </h3>
      <v-spacer></v-spacer>
      
      <v-btn 
        v-if="selected_role?.id > 0" 
        color="primary" 
        variant="flat" 
        prepend-icon="mdi-content-save-outline" 
        @click="save"
        :loading="is_on_sending_process"
        size="small"
      >
        Guardar Permisos
      </v-btn>
    </div>

    <div style="position: relative; flex-grow: 1; z-index: 1;">
      
      <div
        v-if="is_loading"
        style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2; pointer-events: all; border-radius: 0 0 8px 8px; display: flex; flex-direction: column;"
        :style="{ backgroundColor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)' }"
      >
        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
          <v-progress-circular indeterminate color="primary" size="64" width="6" />
          <div class="mt-4 font-weight-bold text-subtitle-1" :class="isDark ? 'text-white' : 'text-primary'">
            Cargando árbol de permisos...
          </div>
        </div>
      </div>

      <v-card-text class="pa-4">
        
        <template v-if="selected_role?.id > 0">
          <v-treeview
            v-model:selected="selection"
            :items="items"
            selectable
            select-strategy="independent"
            selected-color="primary"
            hoverable
            item-title="name"
            item-value="id"
            density="compact"
            class="text-body-2"
          ></v-treeview>
        </template>
        
        <template v-else-if="selected_role?.id === -2 || selected_role?.id === 0">
          <div class="text-center py-10">
             <v-icon size="64" color="amber-darken-2" class="mb-2">mdi-shield-star</v-icon>
             <h3 class="text-grey-darken-1 mt-2">Permisos Totales</h3>
             <p class="text-grey">El rol de administrador tiene acceso irrestricto a todas las funciones.</p>
          </div>
        </template>

        <template v-else>
          <div class="text-center py-12">
            <v-icon size="64" color="grey-lighten-2" class="mb-2">mdi-cursor-default-click</v-icon>
            <h3 class="text-grey-darken-1 mt-2">Seleccione un rol de la izquierda</h3>
            <p class="text-grey">Aquí podrá habilitar las vistas y botones <br>(como Firma y QR) para el rol seleccionado.</p>
          </div>
        </template>

      </v-card-text>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/appStore'
import SidebarItems from '@/layouts/full-layout/sidebar/SidebarItems'
import PermissionDataService from '@/services/permissions/permissionDataService'

const theme = useTheme()
const appStore = useAppStore()

const isDark = computed(() => theme.global.current.value.dark)

const items = ref([])
const selection = ref([])
const selected_role = ref(null)
const is_on_sending_process = ref(false)
const is_loading = ref(false)

onMounted(() => {
  let menuItems = JSON.parse(JSON.stringify(SidebarItems))
  
  menuItems.push({
    name: 'Acciones del Sistema',
    id: 'sys_root', // Aislar carpeta
    children: [
      { name: 'Firmar / Generar QR', to: 'FIRMAR_QR', id: 'sys_10', real_id: 10 },
      { name: 'Ver Resumen de Orden', to: 'VER_RESUMEN_ORDEN', id: 'sys_11', real_id: 11 },
      { name: 'Anular / Restaurar Certificados', to: 'ANULAR_CERTIFICADO', id: 'sys_12', real_id: 12 },
      { name: 'Anular Órdenes', to: 'ANULAR_ORDEN', id: 'sys_13', real_id: 13 },
      { name: 'Solicitar Firma', to: 'SOLICITAR_FIRMA', id: 'sys_14', real_id: 14 }
    ]
  })
  
  items.value = menuItems
})

const flattenItems = (nodes) => {
  let result = []
  nodes.forEach(node => {
    result.push(node)
    if (node.children) {
      result.push(...flattenItems(node.children))
    }
  })
  return result
}

const permissionsWrapper = () => {
  const allFlat = flattenItems(items.value)
  let permissions = []
  selection.value.forEach(selectedId => {
    const found = allFlat.find(node => node.id === selectedId)
    if (found && found.to) {
      permissions.push({
        name: found.name,
        endpoint: found.to,
        // Usar el ID real numérico si existe, de lo contrario usar el normal
        permission_id: found.real_id ? found.real_id : found.id 
      })
    }
  })
  return {
    role: selected_role.value.id,
    permission_list: permissions,
  }
}

const retrievePermissions = async (id) => {
  if (id > 0) {
    is_loading.value = true
    try {
      const response = await PermissionDataService.get(id)
      selection.value = response.data.permission_list.map(p => {
        // Mapear los IDs numéricos de acciones del sistema a su ID virtual de interfaz
        if ([10, 11, 12, 13, 14].includes(p.permission_id)) {
          return 'sys_' + p.permission_id
        }
        return p.permission_id
      })
    } catch (e) {
      Swal.fire(appStore.networkErrorOptions)
    } finally {
      is_loading.value = false
    }
  } else {
    selection.value = []
  }
}

const save = async () => {
  if (is_on_sending_process.value) return
  is_on_sending_process.value = true
  
  try {
    const response = await PermissionDataService.create(permissionsWrapper())
    if (response && (response.status === 201 || response.status === 200)) {
      Swal.fire(appStore.successSavedOptions)
    }
  } catch (e) {
    let errorText = ''
    if (e.response && e.response.data) {
      errorText = e.response.data[0] || 'Ocurrió un error al guardar los permisos.'
    }
    Swal.fire({ ...appStore.errorSavedOptions, text: errorText })
  } finally {
    is_on_sending_process.value = false
  }
}

defineExpose({ selected_role, retrievePermissions })
</script>