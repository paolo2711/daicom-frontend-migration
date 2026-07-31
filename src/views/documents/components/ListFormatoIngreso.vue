<template>
  <v-card variant="flat" class="border rounded-lg bg-surface pa-4">
    <div class="d-flex align-center w-100 mb-4">
      <v-text-field
        v-model="search"
        hide-details
        density="compact"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        label="Buscar Nro. Documento o Cliente"
        clearable
        style="max-width: 300px;"
      />
      <v-spacer />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="modalFormato?.open()">
        NUEVO INGRESO
      </v-btn>
    </div>

    <TableLoadingOverlay :loading="loading" text="Cargando guías..." :isEmpty="documents.length === 0">
      <v-table density="compact" class="tabla-mejorada border rounded-lg" hover>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Documento</th>
            <th class="text-left font-weight-bold">Fecha</th>
            <th class="text-left font-weight-bold">Cliente</th>
            <th class="text-center font-weight-bold">Estado</th>
            <th class="text-center font-weight-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id" :class="doc.status === 'ANULADO' ? 'doc-anulado' : ''">
            <td><span class="font-weight-bold text-primary">{{ doc.document_number }}</span></td>
            <td>{{ formatFecha(doc.created_at) }}</td>
            <td>{{ nombreCliente(doc) }}</td>
            <td class="text-center">
              <v-chip size="x-small" :color="doc.status === 'ANULADO' ? 'error' : 'success'" variant="outlined" class="font-weight-bold">
                {{ doc.status }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                title="Editar Guía"
                class="mr-1"
                :disabled="doc.status === 'ANULADO'"
                @click="editarFormato(doc)"
              >
                <v-icon size="small">mdi-pencil</v-icon>
              </v-btn>

              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                title="Ver / Imprimir PDF"
                class="mr-1"
                :disabled="!doc.pdf_file"
                :href="doc.pdf_file"
                target="_blank"
              >
                <v-icon size="small">mdi-printer</v-icon>
              </v-btn>

              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                title="Anular Documento"
                :disabled="doc.status === 'ANULADO'"
                @click="anularDocumento(doc)"
              >
                <v-icon size="small">mdi-cancel</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </TableLoadingOverlay>

    <FluentPagination
      v-model:page="page"
      :totalItems="totalItems"
      :itemsPerPage="itemsPerPage"
      @update:itemsPerPage="val => { itemsPerPage = val; fetchDocuments() }"
      @update:page="fetchDocuments"
    />

    <FormatoIngresoTemplate ref="modalFormato" @reload="fetchDocuments" />
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, inject } from 'vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import FormatoIngresoTemplate from './templates/FormatoIngresoTemplate.vue'
import DocumentsDataService from '@/services/documents/documentsDataService'
import { CURRENT_FORMATO_INGRESO_SCHEMA } from '@/utils/documents/formatoIngresoDefaults'

const search = ref('')
const loading = ref(false)
const documents = ref([])
const page = ref(1)
const totalItems = ref(0)
const itemsPerPage = ref(30)

const modalFormato = ref(null)
const swal = inject('$swal')

const editarFormato = (doc) => {
  if (doc.schema_version !== CURRENT_FORMATO_INGRESO_SCHEMA) {
    if (swal) {
      swal.fire({
        title: 'Formato Antiguo',
        text: `Esta guía fue generada con una versión antigua del formato (v${doc.schema_version}) y no puede ser editada para proteger su estructura. Solo puede ser visualizada.`,
        icon: 'warning'
      })
    }
    return
  }
  modalFormato.value?.open(doc)
}

const anularDocumento = (doc) => {
  if (swal) {
    swal.fire({
      title: '¿Anular Documento?',
      text: `El documento ${doc.document_number} quedará anulado y su PDF será sellado. Esta acción no se puede revertir.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await DocumentsDataService.cancel(doc.id)
          swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Documento anulado' })
        } catch (error) {
          console.error(error)
          swal.fire('Error', 'Hubo un problema al anular el documento.', 'error')
        }
      }
    })
  }
}

// Esta lista es SOLO de Guías de Ingreso (mismo patrón que ListDocuments.vue
// para Cotizaciones: cada tipo de documento vive en su propio componente
// pasando su propio document_type, para que nunca se mezclen).
const DOCUMENT_TYPE = 'FOI'

let searchTimeout = null

const fetchDocuments = async () => {
  loading.value = true
  try {
    const response = await DocumentsDataService.getAll({
      document_type: DOCUMENT_TYPE,
      search: search.value || undefined,
      page: page.value,
      itemsPerPage: itemsPerPage.value
    })
    documents.value = response.data.results
    totalItems.value = response.data.totalItems
  } catch (error) {
    console.error('Error al obtener documentos:', error)
    documents.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchDocuments()
  }, 400)
})

const formatFecha = (isoDate) => {
  if (!isoDate) return '-'
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('es-PE')
}

const nombreCliente = (doc) => {
  return doc.client_name || 'Sin Cliente Registrado'
}

const handleUpdateDocumentRow = (event) => {
  fetchDocuments()
}

onMounted(() => {
  fetchDocuments()
  window.addEventListener('wss-reload-documents', fetchDocuments)
  window.addEventListener('wss-update-document-row', handleUpdateDocumentRow)
})

onUnmounted(() => {
  window.removeEventListener('wss-reload-documents', fetchDocuments)
  window.removeEventListener('wss-update-document-row', handleUpdateDocumentRow)
})
</script>