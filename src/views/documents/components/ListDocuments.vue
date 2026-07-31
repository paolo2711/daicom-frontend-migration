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
      
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" v-bind="props">
            NUEVO DOCUMENTO
          </v-btn>
        </template>
        <v-list density="compact" class="border">
          <v-list-item @click="modalCotizacion?.open()">
            <template v-slot:prepend>
              <v-icon color="primary" size="small" class="mr-2">mdi-file-document-outline</v-icon>
            </template>
            <v-list-item-title>Cotización (FORD-022)</v-list-item-title>
          </v-list-item>
          </v-list>
      </v-menu>
    </div>

    <TableLoadingOverlay :loading="loading" text="Cargando documentos..." :isEmpty="documents.length === 0">
      <v-table density="compact" class="tabla-mejorada border rounded-lg" hover>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Documento</th>
            <th class="text-left font-weight-bold">Fecha</th>
            <th class="text-left font-weight-bold">Cliente</th>
            <th class="text-left font-weight-bold">Total</th>
            <th class="text-center font-weight-bold">Estado</th>
            <th class="text-center font-weight-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id" :class="doc.status === 'ANULADO' ? 'doc-anulado' : ''">
            <td><span class="font-weight-bold text-primary">{{ doc.document_number }}</span></td>
            <td>{{ formatFecha(doc.created_at) }}</td>
            <td>{{ nombreCliente(doc) }}</td>
            <td>{{ formatMonto(doc) }}</td>
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
                title="Editar Cotización"
                class="mr-1"
                :disabled="doc.status === 'ANULADO'"
                @click="editarCotizacion(doc)"
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

    <QuoteTemplate ref="modalCotizacion" @reload="fetchDocuments" />
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, inject } from 'vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import FluentPagination from '@/components/commonComponents/FluentPagination.vue'
import QuoteTemplate from './templates/QuoteTemplate.vue'
import DocumentsDataService from '@/services/documents/documentsDataService'

const search = ref('')
const loading = ref(false)
const documents = ref([])
const page = ref(1)
const totalItems = ref(0)
const itemsPerPage = ref(30)

import { CURRENT_QUOTE_SCHEMA } from '@/utils/documents/quoteDefaults'

const modalCotizacion = ref(null)
const swal = inject('$swal')

const editarCotizacion = (doc) => {
  if (doc.schema_version !== CURRENT_QUOTE_SCHEMA) {
    if (swal) {
      swal.fire({
        title: 'Formato Antiguo',
        text: `Esta cotización fue generada con una versión antigua del formato (v${doc.schema_version}) y no puede ser editada para proteger su estructura. Solo puede ser visualizada.`,
        icon: 'warning'
      })
    }
    return
  }
  modalCotizacion.value?.open(doc)
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
          // ¡Gracias a los WebSockets de la Fase 1, la fila se actualizará sola para todos!
        } catch (error) {
          console.error(error)
          swal.fire('Error', 'Hubo un problema al anular el documento.', 'error')
        }
      }
    })
  }
}

// Esta lista es SOLO de Cotizaciones. Cuando se agreguen Guías / Actas,
// cada una debe vivir en su propio componente de lista pasando su propio
// document_type aquí (FOI, GUS, ACT), para que nunca se mezclen.
const DOCUMENT_TYPE = 'COT'

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

// Al buscar, reiniciamos a la página 1 y esperamos un poco a que el usuario
// termine de escribir antes de golpear la API.
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

const formatMonto = (doc) => {
  const simbolo = doc.currency === 'USD' ? '$' : 'S/'
  const monto = parseFloat(doc.total_amount) || 0
  return `${simbolo} ${monto.toFixed(2)}`
}

const handleUpdateDocumentRow = (event) => {
  // Por ahora recargamos toda la tabla. En la Fase 2 optimizaremos 
  // esto para que solo inyecte la data de la fila usando get(id).
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