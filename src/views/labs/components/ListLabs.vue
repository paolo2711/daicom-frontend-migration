<template>
  <v-container fluid class="down-top-padding pa-0">
    <v-card variant="flat" class="border rounded-lg mb-4 pa-2 elevation-0">
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Buscar laboratorio por nombre o código..."
        single-line
        hide-details
        variant="outlined"
        density="compact"
        @update:model-value="alInicio"
      />
    </v-card>

    <table-loading-overlay :loading="loading_list" :isEmpty="labs.length === 0">
      <v-data-table-server
        :headers="headers"
        :items="labs"
        :items-length="total_labs"
        :loading="loading_list"
        item-value="id"
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
            :totalItems="total_labs"
          />
        </template>

        <template v-slot:item.acciones="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 @click.stop="alBotonDeFila($event, item)" />
        </template>
      </v-data-table-server>
    </table-loading-overlay>

    <lab-form-dialog v-model="dialogOpen" :lab="selectedLab" @reloadListComponent="retrieveAllLabs" />
    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />
  </v-container>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'

import LabDataService from '@/services/labs/labDataService'
import LabMappers from '@/mappers/labMappers'
import { useActionCall } from '@/composables/useActionCall'
import { useContextMenu } from '@/composables/useContextMenu'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePage } from '@/composables/usePage'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_LABORATORIO } from '@/utils/labs/acciones'
import { leerPagina } from '@/utils/pagination'

const LabFormDialog = defineAsyncComponent(() => import('@/views/labs/components/LabFormDialog.vue'))


const headers = [
  { title: 'Nombre', key: 'name', align: 'start', width: '50%' },
  { title: 'Código', key: 'code', sortable: false, width: '30%' },
  { title: 'Opciones', key: 'acciones', sortable: false, align: 'center', width: '20%' },
]

const labs = ref([])
const total_labs = ref(0)
const loading_list = ref(false)
const { opciones: options, alInicio } = usePage(() => retrieveAllLabs())
const search = ref('')
const dialogOpen = ref(false)
const selectedLab = ref(null)

const { begin: beginLoad, isLatest: isLatestLoad } = useLatestRequest()

const retrieveAllLabs = () => {
  loading_list.value = true
  const token = beginLoad()   // guard de secuencia: gana la carga más reciente
  LabDataService.getFiltered(options.value.page, options.value.itemsPerPage, search.value || '')
    .then((response) => {
      if (!isLatestLoad(token)) return
      const pagina = leerPagina(response.data)
      labs.value = pagina.filas.map(LabMappers.getMap)
      total_labs.value = pagina.total
    })
    .catch(() => {})
    .finally(() => {
      if (isLatestLoad(token)) loading_list.value = false
    })
}


const openEditDialog = (lab) => {
  selectedLab.value = lab
  dialogOpen.value = true
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(labs)
const { confirmarYLlamar } = useActionCall()
const accionesDe = (filas) => accionesPara(ACCIONES_LABORATORIO, filas, () => true)

async function ejecutarAccion (clave, [lab]) {
  switch (clave) {
    case 'editar': return openEditDialog(lab)
    case 'eliminar': {
      const hecho = await confirmarYLlamar({
        titulo: `¿Eliminar ${lab.name}?`, boton: 'Sí, eliminar',
        texto: 'Deja de aparecer en las listas; los certificados que lo usan se conservan.',
        llamar: () => LabDataService.delete(lab.id),
        exito: 'Laboratorio eliminado', fallo: 'No se pudo eliminar el laboratorio.',
      })
      if (hecho) retrieveAllLabs()
    }
  }
}

const openAddDialog = () => {
  selectedLab.value = null
  dialogOpen.value = true
}

onMounted(() => {
  retrieveAllLabs()
})

defineExpose({ openAddDialog })
</script>
