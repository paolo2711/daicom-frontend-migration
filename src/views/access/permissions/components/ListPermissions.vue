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

// Catálogo de acciones del sistema, agrupadas por dominio. Para agregar una acción
// nueva: una línea aquí (id = permission_id del backend). `soloSuperAdmin` oculta la
// categoría a quien no es super-admin (los meta-permisos no se otorgan a la ligera).
const ACCIONES_CATEGORIAS = [
  { name: 'Certificados', acciones: [
    { id: 1001, name: 'Firmar / Generar QR', endpoint: 'FIRMAR_QR' },
    { id: 1003, name: 'Anular / Restaurar Certificados', endpoint: 'ANULAR_CERTIFICADO' },
    { id: 1005, name: 'Solicitar Firma', endpoint: 'SOLICITAR_FIRMA' },
    { id: 1006, name: 'Elaborar Certificado (Subir Excel)', endpoint: 'ELABORAR_CERTIFICADO' },
  ]},
  { name: 'Órdenes', acciones: [
    { id: 1002, name: 'Ver Resumen de Orden', endpoint: 'VER_RESUMEN_ORDEN' },
    { id: 1004, name: 'Anular Órdenes', endpoint: 'ANULAR_ORDEN' },
  ]},
  { name: 'Inventario', acciones: [
    { id: 1007, name: 'Eliminar Equipos', endpoint: 'ELIMINAR_EQUIPO' },
  ]},
  { name: 'Administración', soloSuperAdmin: true, acciones: [
    { id: 1008, name: 'Gestionar Usuarios', endpoint: 'GESTIONAR_USUARIOS' },
    { id: 1009, name: 'Gestionar Roles y Permisos', endpoint: 'GESTIONAR_ROLES' },
  ]},
]

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user')) || {}
  const isSuperAdmin = user.kind !== undefined && user.kind < 1

  // 1) Vistas / módulos (el árbol del menú). Se excluyen las páginas de admin que
  // se gobiernan por su ACCIÓN (Usuarios→1008, Permisos→1009) y las solo-super-admin
  // (Mantenimiento): esas no son permisos de vista otorgables.
  const soloVistas = (nodes) => nodes
    .filter(n => !n.action && !n.superAdmin)
    .map(n => (n.children ? { ...n, children: soloVistas(n.children) } : n))

  const vistasRoot = {
    name: 'Vistas / Módulos', id: 'views_root',
    children: soloVistas(JSON.parse(JSON.stringify(SidebarItems))),
  }

  // 2) Acciones del sistema, agrupadas por categoría.
  const accionesRoot = { name: 'Acciones del Sistema', id: 'sys_root', children: [] }
  ACCIONES_CATEGORIAS.forEach(cat => {
    if (cat.soloSuperAdmin && !isSuperAdmin) return   // meta-permisos: solo super-admin
    accionesRoot.children.push({
      name: cat.name,
      id: 'sys_cat_' + cat.name,
      children: cat.acciones.map(a => ({
        name: a.name, to: a.endpoint, id: 'sys_' + a.id, real_id: a.id,
      })),
    })
  })

  items.value = [vistasRoot, accionesRoot]
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
        // Acciones del sistema viven en la banda >= 1000; el resto son vistas.
        if (p.permission_id >= 1000) {
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