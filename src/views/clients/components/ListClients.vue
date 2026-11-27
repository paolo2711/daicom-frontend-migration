<template>
  <v-container fluid class="down-top-padding pa-0">

    <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
      <div class="d-flex flex-wrap align-center ga-4">
        <v-text-field
          v-model="search"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          label="Buscar cliente por nombre o documento..."
          clearable
          style="max-width: 18.75rem;"
          @update:model-value="alInicio"
        />
        <v-switch
          v-model="filterNeedsReview"
          label="Solo posibles duplicados"
          color="warning"
          hide-details
          density="compact"
          @update:model-value="alInicio"
        />
      </div>
    </v-card>

    <table-loading-overlay :loading="loading_list" :isEmpty="clients.length === 0">
      <v-data-table-server
        :headers="headers"
        :items="clients"
        :items-length="total_clients"
        :loading="loading_list"
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
            :totalItems="total_clients"
          />
        </template>

        <template v-slot:item.name="{ item }">
          <copyable-text :texto="item.name" etiqueta="razón social" ancho="21.25rem" class="font-weight-bold" />
          <div v-if="item.needs_review" class="text-caption text-medium-emphasis">Posible duplicado</div>
        </template>

        <template v-slot:item.document="{ item }">
          <copyable-text :texto="item.document" etiqueta="documento" />
        </template>

        <template v-slot:item.address="{ item }">
          <copyable-text :texto="item.address" etiqueta="dirección" ancho="20rem" />
        </template>

        <template v-slot:item.acciones="{ item }">
          <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" color="grey-darken-1"
                 @click.stop="alBotonDeFila($event, item)" />
        </template>

      </v-data-table-server>
    </table-loading-overlay>

  <client-form-dialog v-model="dialogOpen" :client="selectedClient" @reloadListComponent="retrieveAllClients" />
  <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
               @accion="clave => ejecutarAccion(clave, menu.filas)" />

  </v-container>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'

import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'
import { useActionCall } from '@/composables/useActionCall'
import { useContextMenu } from '@/composables/useContextMenu'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePage } from '@/composables/usePage'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import CopyableText from '@/components/shared/CopyableText.vue'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_CLIENTE } from '@/utils/clients/acciones'
import { leerPagina } from '@/utils/pagination'

const ClientFormDialog = defineAsyncComponent(() => import('@/views/clients/components/ClientFormDialog.vue'))


const headers = [
  { title: 'Razón social', key: 'name', align: 'start' },
  { title: 'Tipo Doc.', key: 'documentType_name', sortable: false },
  { title: 'N° Documento', key: 'document', sortable: false },
  { title: 'Dirección', key: 'address', sortable: false },
  { title: 'Opciones', key: 'acciones', align: 'center', sortable: false },
]

const clients = ref([])
const total_clients = ref(0)
const loading_list = ref(false)
const { opciones: options, alInicio } = usePage(() => retrieveAllClients())
const search = ref('')
const filterNeedsReview = ref(false)
const dialogOpen = ref(false)
const selectedClient = ref(null)

const { begin: beginLoad, isLatest: isLatestLoad } = useLatestRequest()

const retrieveAllClients = () => {
  loading_list.value = true
  const token = beginLoad()   // guard de secuencia: gana la carga más reciente

  const reviewParam = filterNeedsReview.value ? 'true' : ''

  ClientDataService.getFiltered(options.value.page, options.value.itemsPerPage, search.value || '', reviewParam)
    .then((response) => {
      if (!isLatestLoad(token)) return
      const pagina = leerPagina(response.data)
      clients.value = pagina.filas.map(ClientMappers.getMap)
      total_clients.value = pagina.total
    })
    .finally(() => {
      if (isLatestLoad(token)) loading_list.value = false
    })
}



const openEditDialog = (client) => {
  selectedClient.value = client
  dialogOpen.value = true
}

const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(clients)
const { confirmarYLlamar } = useActionCall()
const accionesDe = (filas) => accionesPara(ACCIONES_CLIENTE, filas, () => true)

async function ejecutarAccion (clave, [cliente]) {
  switch (clave) {
    case 'editar': return openEditDialog(cliente)
    case 'revisado': {
      const hecho = await confirmarYLlamar({
        titulo: '¿Sacarle la marca de posible duplicado?', icono: 'question', boton: 'Sí, ya lo revisé',
        texto: 'Deja de aparecer en el filtro. Para volver a marcarlo hay que revisar la base.',
        llamar: () => ClientDataService.setNeedsReview(cliente.id, false),
        exito: 'Marcado como revisado', fallo: 'No se pudo quitar la marca.',
      })
      if (hecho) retrieveAllClients()
      return
    }
    case 'eliminar': {
      const hecho = await confirmarYLlamar({
        titulo: `¿Eliminar ${cliente.name}?`, boton: 'Sí, eliminar',
        texto: 'Deja de aparecer en las listas; sus órdenes y certificados se conservan.',
        llamar: () => ClientDataService.delete(cliente.id),
        exito: 'Cliente eliminado', fallo: 'No se pudo eliminar el cliente.',
      })
      if (hecho) retrieveAllClients()
    }
  }
}

onMounted(() => {
  retrieveAllClients()
})

const openAddDialog = () => {
  selectedClient.value = null
  dialogOpen.value = true
}

defineExpose({ retrieveAllClients, openAddDialog })
</script>
