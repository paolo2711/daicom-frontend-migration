<template>
  <v-container fluid class="down-top-padding pa-0">

    <!-- ═══════════════════════════════════════════════════
         FILTROS DE BÚSQUEDA
    ════════════════════════════════════════════════════ -->
    <v-card variant="flat" class="border rounded-lg mb-4 pa-4 bg-surface">
      <div class="d-flex flex-wrap align-center" style="gap: 16px;">
        
        <v-text-field
          v-model="correlative"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          label="Buscar Cód. Equipo"
          type="number"
          min="0"
          clearable
          max="99999999"
          style="flex: 0 0 240px;"
        />

        <v-text-field
          v-model="equipment"
          hide-details
          density="compact"
          prepend-inner-icon="mdi-toolbox-outline"
          variant="outlined"
          label="Buscar Equipo"
          clearable
          style="flex: 0 0 220px;"
        />

        <v-divider vertical class="mx-2 d-none d-md-block" style="height: 32px;"></v-divider>

        <filter-pill
          v-if="ver_bandeja_firmas"
          :active="filtro_firma_pendiente"
          :count="appStore.pendingSignaturesCount"
          color="primary"
          badge-color="error"
          icon="mdi-draw"
          tooltip="Filtrar certificados que requieren atención"
          @click="toggleFiltroFirma"
        >Pendientes de Firma</filter-pill>

        <filter-pill
          :active="filtro_excel_pendiente"
          :variant="filtro_excel_pendiente ? 'elevated' : 'tonal'"
          color="orange-darken-2"
          icon="mdi-file-excel-outline"
          tooltip="Filtrar certificados que aún no tienen archivo base"
          @click="toggleFiltroExcel"
        >Pendientes de Excel</filter-pill>

        <!-- ── TEMPORAL Antapacay — borrar esta píldora al terminar contrato (~ago 2026) ── -->
        <v-chip
          variant="flat"
          :class="['antapaccay-chip', 'font-weight-bold', 'cursor-pointer', 'ml-2', { 'antapaccay-chip--active': filtro_antapacay }]"
          @click="toggleFiltroAntapacay"
        >
          <v-icon start size="small" class="antapaccay-pico">mdi-pickaxe</v-icon>
          Antapaccay
          <v-tooltip activator="parent" location="top">Ver solo los certificados de Antapaccay (ocultos en el listado normal)</v-tooltip>
        </v-chip>
        <!-- ── FIN TEMPORAL Antapacay ── -->

        <v-spacer></v-spacer>

        <v-btn 
          :variant="mostrar_filtros_avanzados ? 'tonal' : 'text'" 
          color="primary"
          class="font-weight-bold text-none"
          @click="mostrar_filtros_avanzados = !mostrar_filtros_avanzados"
        >
          <v-icon start>{{ mostrar_filtros_avanzados ? 'mdi-filter-minus' : 'mdi-filter-plus' }}</v-icon>
          {{ mostrar_filtros_avanzados ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-show="mostrar_filtros_avanzados">
          <v-divider class="my-4 border-opacity-25"></v-divider>
          <v-row dense>
            
            <v-col cols="12" md="3">
              <date-range-filter
                v-model:desde="emission_date__gt"
                v-model:hasta="emission_date__lt"
                label="Rango de Emisión"
                @apply="aplicarFiltroFechas"
              />
            </v-col>

            <v-col cols="12" md="3">
              <client-select v-model="client_id" />
            </v-col>

            <v-col cols="12" md="3">
              <v-autocomplete v-model="lab_id" v-model:search="search_lab" @update:menu="cargarLabs" hide-details="auto" density="compact" :loading="loading_labs" prepend-inner-icon="mdi-factory" :items="labs" item-title="name" item-value="id" placeholder="Buscar laboratorio..." clearable variant="outlined" label="Laboratorio" no-filter />
            </v-col>

            <v-col cols="12" md="2">
              <v-autocomplete v-model="certificate_type" hide-details="auto" density="compact" prepend-inner-icon="mdi-cog" :items="TIPOS_CERTIFICADO" clearable variant="outlined" label="Tipo" />
            </v-col>
            
          </v-row>
        </div>
      </v-expand-transition>
    </v-card>

    <selection-bar
      :count="certificados_seleccionados.length"
      label="seleccionado(s)"
      @clear="certificados_seleccionados = []"
    >
      <v-btn v-if="permiso_elaborar" variant="text" size="small" class="mx-1 font-weight-bold"
             prepend-icon="mdi-file-pdf-box" @click="abrirModalLote('excel')">
        Subir Excels
      </v-btn>

      <v-btn v-if="permiso_qr" variant="text" size="small" class="mx-1 font-weight-bold"
             prepend-icon="mdi-qrcode-scan" @click="abrirModalLote('qr')">
        Firmar QR
      </v-btn>

      <v-btn v-if="permiso_solicitar_firma" variant="text" size="small" class="mx-1 font-weight-bold"
             prepend-icon="mdi-bell-ring" @click="abrirModalLote('notify')">
        Solicitar Firma
      </v-btn>

      <v-btn v-if="permiso_entrega" variant="text" size="small" class="mx-1 font-weight-bold"
             prepend-icon="mdi-package-variant-closed-check" @click="abrirModalLote('entrega')">
        Marcar Entregados
      </v-btn>
    </selection-bar>

    <table-loading-overlay :loading="loading_list" :isEmpty="certificates.length === 0">
      <v-data-table-server
        :headers="headers"
        :items="certificates"
        class="elevation-0 rounded-lg tabla-mejorada tabla-certificados-interactiva bg-surface"
        :row-props="getRowProps"
        v-model="certificados_seleccionados"
        show-select
        :item-selectable="(item) => item.status !== 5"
        item-value="id"
        return-object
        :loading="loading_list"
        @click:row="handleRowClick"
        @contextmenu:row="handleRightClick"
        :items-length="total_certificates"
        v-model:page="options.page"
        v-model:items-per-page="options.itemsPerPage"
        hide-default-footer
      >

        <template v-slot:bottom>
          <fluent-pagination
            v-model:page="options.page"
            v-model:itemsPerPage="options.itemsPerPage"
            :totalItems="total_certificates"
          />
        </template>

        <!-- ── Header: columna XLS ── -->
        <template v-slot:header.uploaded_xls>
          <v-tooltip location="bottom" color="info">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props">mdi-file-pdf-box</v-icon>
            </template>
            <span>¿EXCEL Subido?</span>
          </v-tooltip>
        </template>

        <!-- ── Header: columna QR ── -->
        <template v-slot:header.uploaded>
          <v-tooltip location="bottom" color="info">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props">mdi-qrcode</v-icon>
            </template>
            <span>¿QR y Firma Generado?</span>
          </v-tooltip>
        </template>

        <!-- ── Chip de código de registro ── -->
        <template v-slot:item.registry_code="{ item }">
          <v-chip
            :color="item.status === 5
              ? 'red'
              : (item.uploaded
                ? 'green'
                : (item.signed_pdf
                  ? 'blue'
                  : (tieneExcelBase(item) ? 'orange' : 'grey')))"
            class="text-white font-weight-bold"
          >
            {{ item.registry_code }}
          </v-chip>
        </template>

        <!-- ── Tipo abreviado ── -->
        <template v-slot:item.certificate_type_label="{ item }">
          <span class="text-no-wrap">
            <span :class="item.status === 5 ? 'anulado-atenuado' : ''">
              {{ siglaDelTipo(item.certificate_type) }}
            </span>
            <numeros-anteriores :numeros="item.previous_numbers" />
          </span>
        </template>

        <!-- ── Cliente ── -->
        <template v-slot:item.client_data.name="{ item }">
          <span :class="item.status === 5 ? 'anulado-atenuado' : ''">
            {{ item.client_data?.name }}
          </span>
        </template>

        <!-- ── Lab ── -->
        <template v-slot:item.lab_data.code="{ item }">
          <span :class="item.status === 5 ? 'anulado-atenuado font-weight-medium' : 'font-weight-medium'">
            {{ item.lab_data?.code }}
          </span>
        </template>

        <!-- ── Nombre equipo ── -->
        <template v-slot:item.equipment="{ item }">
          <span :class="item.status === 5 ? 'anulado-atenuado' : ''">
            {{ item.equipment }}
          </span>
        </template>

        <template v-slot:item.uploaded_xls="{ item }">
          <div class="d-flex align-center justify-center">
            <v-progress-circular v-if="estadoSubida(item.id, 'sheet') === 'subiendo'"
                                 indeterminate color="primary" size="24" width="3" />

            <!-- El manager solo deja descartar un Excel fallido, porque reintentar
                 el mismo archivo vuelve a fallar. Lo que resuelve es subir otro,
                 y eso se hace desde aca. -->
            <v-tooltip v-else-if="estadoSubida(item.id, 'sheet') === 'fallo'" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props" icon variant="text" density="comfortable" color="error"
                  :disabled="!puedeSubirExcel(item)" @click.stop="openUploadDialog(item)"
                >
                  <v-icon>mdi-file-alert</v-icon>
                </v-btn>
              </template>
              <span>Fallo la subida. Subir otro Excel</span>
            </v-tooltip>

            <!-- El PDF ya salio pero nadie lo aprobo: no hay nada guardado todavia. -->
            <v-tooltip v-else-if="estadoSubida(item.id, 'sheet') === 'revisando'" location="bottom">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" color="amber-darken-2">mdi-file-eye</v-icon>
              </template>
              <span>Listo para revisar en el panel de subidas</span>
            </v-tooltip>

            <v-tooltip v-else location="bottom">
              <template v-slot:activator="{ props }">
                <!-- El link sale del back ya armado. Los certificados viejos tienen
                     el Excel marcado pero sin ruta, y antes se les armaba /media/1
                     que no existe: ahora sin url, no hay boton de ver. -->
                <v-btn
                  v-if="item.uploaded_xls_url"
                  v-bind="props" icon variant="text" density="comfortable" color="primary"
                  :href="item.uploaded_xls_url" target="_blank"
                  :disabled="item.status === 5" @click.stop
                >
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
                <!-- Termino pero la fila todavia no trae la ruta: se ve listo, sin link. -->
                <v-btn
                  v-else-if="estadoSubida(item.id, 'sheet') === 'logrado'"
                  v-bind="props" icon variant="text" density="comfortable" color="primary" disabled
                >
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
                <v-btn
                  v-else
                  v-bind="props" icon variant="text" density="comfortable" color="grey"
                  :disabled="!puedeSubirExcel(item)" @click.stop="openUploadDialog(item)"
                >
                  <v-icon>mdi-file-pdf-box</v-icon>
                </v-btn>
              </template>
              <span v-if="item.uploaded_xls_url">Ver PDF Base Local</span>
              <span v-else-if="estadoSubida(item.id, 'sheet') === 'logrado'">Listo, preparando el enlace</span>
              <span v-else>Subir Excel</span>
            </v-tooltip>
          </div>
        </template>

        <template v-slot:item.uploaded="{ item }">
          <div class="d-flex align-center justify-center">
            <v-progress-circular v-if="estadoSubida(item.id, 'qr') === 'subiendo'"
                                 indeterminate color="primary" size="24" width="3"></v-progress-circular>

            <v-tooltip v-else-if="estadoSubida(item.id, 'qr') === 'fallo'" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props" icon variant="text" density="comfortable" color="error"
                  :disabled="!puedeGenerarQr(item)"
                  @click.stop="openQRDialog(item)"
                >
                  <v-icon>mdi-cloud-alert</v-icon>
                </v-btn>
              </template>
              <span>Fallo. Volver a generar</span>
            </v-tooltip>

            <template v-else>
              <v-tooltip location="bottom" v-if="item.uploaded || estadoSubida(item.id, 'qr') === 'logrado'">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props" icon variant="text" density="comfortable" color="primary"
                    :href="linkNube(item)" target="_blank"
                    :disabled="item.status === 5" @click.stop="onNubeClick($event, item)"
                  >
                    <v-icon>{{ estaEntregado(item) ? 'mdi-cloud-check' : 'mdi-cloud' }}</v-icon>
                  </v-btn>
                </template>
                <span>
                  Ver PDF en Nube Pública
                  <template v-if="estaEntregado(item)"><br>Entregado el {{ fechaCorta(item.sent_date) }}</template>
                  <br><small>Ctrl+clic: copiar link</small>
                </span>
              </v-tooltip>

              <v-tooltip location="bottom" v-else>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props" icon variant="text" density="comfortable" color="grey"
                    :disabled="!puedeGenerarQr(item)"
                    @click.stop="openQRDialog(item)"
                  >
                    <v-badge :model-value="item.signature_requested === true" color="warning" dot offset-x="2" offset-y="2">
                      <v-icon>mdi-qrcode-plus</v-icon>
                    </v-badge>
                  </v-btn>
                </template>
                <span>Generar QR y Firmar</span>
              </v-tooltip>
            </template>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn 
            icon 
            variant="text" 
            density="comfortable" 
            color="grey-darken-1" 
            @click.stop="handleMenuButton($event, { item })"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <!-- ── Número de orden ── -->
        <template v-slot:item.order_number="{ item }">
          <span v-if="item.order_number">
            <v-menu
              v-if="permiso_resumen"
              :model-value="menu_abierto_id === item.id"
              location="right"
              :close-on-content-click="false"
              transition="slide-x-transition"
              @update:model-value="(val) => {
                menu_abierto_id = val ? item.id : null;
                orden_resonancia = val ? item.order_number : null;
              }"
            >
              <template v-slot:activator="{ props: menuProps }">
                <v-tooltip location="top" :color="getSemaforoColor(item)">
                  <template v-slot:activator="{ props: tooltipProps }">
                    <v-badge
                      :color="getSemaforoColor(item)"
                      dot
                      :class="{
                        'boton-orden-atenuado': menu_abierto_id !== null
                          && menu_abierto_id !== item.id
                          && orden_resonancia === item.order_number
                      }"
                    >
                      <v-btn icon variant="text" density="comfortable" color="primary" v-bind="mergeProps(menuProps, tooltipProps)" @click.stop>
                        <v-icon>mdi-file-document-arrow-right-outline</v-icon>
                      </v-btn>
                    </v-badge>
                  </template>
                  <span class="font-weight-bold">{{ getSemaforoText(item) }}</span>
                </v-tooltip>
              </template>

              <order-summary-card
                v-if="menu_abierto_id === item.id"
                :orderId="item.order"
                :orderNumber="item.order_number"
                @cerrar-tarjeta="menu_abierto_id = null; orden_resonancia = null;"
                @seleccionar-orden="seleccionarTodaLaOrden(item.order_number)"
              />
            </v-menu>

            <v-tooltip location="bottom" color="black" v-else>
              <template v-slot:activator="{ props }">
                <v-icon size="small" color="grey-lighten-1" v-bind="props">mdi-paperclip</v-icon>
              </template>
              <span>Vinculado a una Orden</span>
            </v-tooltip>
          </span>
          <span v-else class="text-grey-lighten-1">---</span>
        </template>

        <!-- ── Fecha ── -->
        <template v-slot:item.created_at="{ item }">
          <span :class="item.status === 5 ? 'anulado-atenuado' : ''">
            {{ item.created_at ? item.created_at.substring(0, 10) : '---' }}
          </span>
        </template>

      </v-data-table-server>
    </table-loading-overlay>

    <!-- ═══════════════════════════════════════════════════
         LEYENDA DE ESTADOS
    ════════════════════════════════════════════════════ -->
    <v-card
      variant="flat"
      class="border mt-4 py-4 px-4 rounded-lg"
    >
      <v-row align="center" justify="center" no-gutters>
        <span class="text-caption font-weight-bold mr-4 text-uppercase text-medium-emphasis">
          Estados del Código:
        </span>
        <div class="d-flex flex-wrap justify-center">
          <v-chip size="small" color="grey"   class="mr-3 mb-1 text-white">Borrador (Sin Excel)</v-chip>
          <v-chip size="small" color="orange" class="mr-3 mb-1 text-white">En Proceso (Con Excel)</v-chip>
          <v-chip size="small" color="blue"   class="mr-3 mb-1 text-white">Firmado (Con PDF)</v-chip>
          <v-chip size="small" color="green"  class="mr-3 mb-1 text-white">Listo (En Nube / QR)</v-chip>
          <v-chip size="small" color="red"    class="mb-1 text-white">Anulado</v-chip>
        </div>
      </v-row>
    </v-card>

    <!-- ═══════════════════════════════════════════════════
         MODALES Y COMPONENTES EXTERNOS
    ════════════════════════════════════════════════════ -->
    
    
    
    
    
    <certificate-modal ref="certificateModal" />

    <batch-action-modal
      ref="batchActionModalRef"
      @clearSelection="certificados_seleccionados = []"
      @reloadListComponent="retrieveAllCertificates"
    />

    <!-- El menu se ancla a las coordenadas del cursor. Son una prop reactiva, asi
         que abrir uno con otro abierto lo reubica solo. -->
    <v-menu
      v-model="contextMenu.show"
      :target="[contextMenu.x, contextMenu.y]"
      :transition="false"
    >
      <v-list v-if="contextMenu.item" density="compact" class="elevation-4 border rounded-lg bg-surface">
        <v-list-item v-if="contextMenu.item.status !== 5" @click="certificateModal?.open(contextMenu.item)">
          <template v-slot:prepend><v-icon size="small">mdi-pencil</v-icon></template>
          <v-list-item-title class="font-weight-medium text-body-2">Editar Datos</v-list-item-title>
        </v-list-item>

        <v-list-item v-if="contextMenu.item.uploaded" @click="copiarLinkCertificado(contextMenu.item)">
          <template v-slot:prepend><v-icon size="small">mdi-link-variant</v-icon></template>
          <v-list-item-title class="font-weight-medium text-body-2">Copiar link</v-list-item-title>
        </v-list-item>

        <v-list-item v-if="puedeSubirExcel(contextMenu.item)" @click="openUploadDialog(contextMenu.item)">
          <template v-slot:prepend><v-icon size="small">mdi-file-excel</v-icon></template>
          <v-list-item-title class="font-weight-medium text-body-2">
            {{ tieneExcelBase(contextMenu.item) ? 'Reemplazar Excel' : 'Subir Excel' }}
          </v-list-item-title>
        </v-list-item>

        <v-list-item v-if="permiso_solicitar_firma && contextMenu.item.status !== 5 && tieneExcelBase(contextMenu.item)" @click="contextMenu.item.signature_requested ? cancelarSolicitudFirma(contextMenu.item) : solicitarFirmaIndividual(contextMenu.item)">
          <template v-slot:prepend>
            <v-icon size="small">
              {{ contextMenu.item.signature_requested ? 'mdi-bell-cancel-outline' : 'mdi-bell-ring' }}
            </v-icon>
          </template>
          <v-list-item-title class="font-weight-medium text-body-2">
            {{ contextMenu.item.signature_requested ? 'Cancelar Solicitud' : 'Solicitar Firma' }}
          </v-list-item-title>
        </v-list-item>

        <v-list-item v-if="permiso_entrega && (esEntregable(contextMenu.item) || estaEntregado(contextMenu.item))"
                     @click="estaEntregado(contextMenu.item) ? quitarEntrega(contextMenu.item) : abrirEntrega(contextMenu.item)">
          <template v-slot:prepend>
            <v-icon size="small">
              {{ estaEntregado(contextMenu.item) ? 'mdi-package-variant-closed-remove' : 'mdi-package-variant-closed-check' }}
            </v-icon>
          </template>
          <v-list-item-title class="font-weight-medium text-body-2">
            {{ estaEntregado(contextMenu.item) ? 'Quitar entrega' : 'Marcar como entregado' }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="estaEntregado(contextMenu.item)" class="text-caption">
            Entregado {{ fechaCorta(contextMenu.item.sent_date) }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="puedeGenerarQr(contextMenu.item)" @click="openQRDialog(contextMenu.item)">
          <template v-slot:prepend><v-icon size="small">{{ contextMenu.item.uploaded ? 'mdi-refresh' : 'mdi-qrcode-scan' }}</v-icon></template>
          <v-list-item-title class="font-weight-medium text-body-2">
            {{ contextMenu.item.uploaded ? 'Regenerar QR' : 'Generar QR y Firmar' }}
          </v-list-item-title>
        </v-list-item>

        <v-divider v-if="contextMenu.item.status !== 5 && permiso_anular" class="my-1 border-opacity-25"></v-divider>

        <v-list-item v-if="permiso_anular && contextMenu.item.uploaded && contextMenu.item.status !== 5" @click="eliminarDeLaNubeConfirm(contextMenu.item)">
          <template v-slot:prepend><v-icon size="small">mdi-cloud-remove-outline</v-icon></template>
          <v-list-item-title class="font-weight-medium text-body-2">Eliminar de la Nube</v-list-item-title>
        </v-list-item>

        <v-list-item v-if="contextMenu.item.status !== 5 && permiso_anular" @click="anularCertConfirm(contextMenu.item)">
          <template v-slot:prepend><v-icon size="small">mdi-delete-outline</v-icon></template>
          <v-list-item-title class="font-weight-medium text-body-2">Anular Certificado</v-list-item-title>
        </v-list-item>
        
        <v-list-item v-if="contextMenu.item.status === 5 && permiso_anular" @click="revivirCertConfirm(contextMenu.item)">
          <template v-slot:prepend><v-icon size="small">mdi-backup-restore</v-icon></template>
          <v-list-item-title class="font-weight-medium text-body-2">Restaurar Certificado</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

  </v-container>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, getCurrentInstance, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/appStore'

import FluentPagination    from '@/components/commonComponents/FluentPagination.vue'
import SelectionBar         from '@/components/commonComponents/SelectionBar.vue'
import CertificateDataService from '@/services/certificates/certificateDataService.js'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { useUploadState }   from '@/composables/useUploadState'
import { debounce }         from '@/utils/debounce'
import OrderDataService    from '@/services/orders/orderDataService.js'
import CertificateMappers  from '@/mappers/certificateMappers'
import CertificateModal    from '@/views/certificates/components/CertificateModal.vue'
import LabDataService      from '@/services/labs/labDataService'
import LabMappers          from '@/mappers/labMappers'

import OrderSummaryCard    from './OrderSummaryCard.vue'
import TableLoadingOverlay from '@/components/commonComponents/TableLoadingOverlay.vue'
import ClientSelect        from '@/components/shared/ClientSelect.vue'
import { tieneExcelBase }  from '@/utils/certificates/excelBase'
import { esEntregable, estaEntregado } from '@/utils/certificates/entrega'
import { TIPOS_CERTIFICADO, siglaDelTipo } from '@/utils/certificates/tipos'
import NumerosAnteriores from '@/components/shared/NumerosAnteriores.vue'
import { fechaCorta }      from '@/utils/dates'
import FilterPill          from '@/components/shared/FilterPill.vue'
import DateRangeFilter     from '@/components/shared/DateRangeFilter.vue'
import { copiarConAviso } from '@/utils/clipboard'
import { decidirRefresco } from '@/utils/changedRows'

// Componentes async (lazy-loading igual que en Vue 2)
// carga diferida de LoadSheet movida a BatchActionModal
const BatchActionModal = defineAsyncComponent(() => import('./BatchActionModal.vue'))

// ─── Composables ──────────────────────────────────────────────────────────────
const router = useRouter()
const route  = useRoute()

const appStore = useAppStore()
const { tareaDe, estadoSubida, confirmarFila } = useUploadState()

// Acceso a $swal (registrado globalmente con vue-sweetalert2)
const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

// ─── Template refs ────────────────────────────────────────────────────────────
const certificateModal     = ref(null)
const batchActionModalRef  = ref(null)
// uploadSheetModalRef eliminado, ahora se maneja desde batch


// ─── Estado de la tabla ───────────────────────────────────────────────────────
const certificados_seleccionados = ref([])
const certificates             = ref([])
const total_certificates       = ref(0)
const loading_list             = ref(false)
const options                  = ref({ page: 1, itemsPerPage: 30 })

const filtro_firma_pendiente   = ref(false) // Estado del Smart Chip
const filtro_excel_pendiente   = ref(false) // Estado del Smart Chip Excel
const filtro_antapacay         = ref(false) // TEMPORAL Antapacay — borrar al terminar contrato (~ago 2026)
const mostrar_filtros_avanzados = ref(false) // Toggle de la UI

// ─── Filtros de fecha ─────────────────────────────────────────────────────────
const emission_date__gt = ref((() => {
  const d = new Date()
  d.setMonth(d.getMonth() - 8) // ventana por defecto: últimos 8 meses
  return d.toISOString().substring(0, 10)
})())
const emission_date__lt = ref(
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().substring(0, 10)
)


// ─── Laboratorios ─────────────────────────────────────────────────────────────
const lab_id = ref(null)

const { 
  items: labs, 
  loading: loading_labs, 
  searchQuery: search_lab, 
  retrieveData: retrieveLabs 
} = usePaginatedSearch(
  (page, size, query) => LabDataService.getFiltered(page, size, query),
  LabMappers.getMap,
  () => lab_id.value,
  'labs'
)

// El filtro vive dentro del panel plegado: la lista se pide al desplegarlo.
const labs_pedidos = ref(false)
const cargarLabs = (abierto) => {
  if (!abierto || labs_pedidos.value) return
  labs_pedidos.value = true
  retrieveLabs()
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
const client_id = ref(null)

// ─── Tipo de certificado ──────────────────────────────────────────────────────
const certificate_type  = ref(null)
const correlative = ref('')
const equipment = ref('')

// ─── Órdenes / menús ─────────────────────────────────────────────────────────
const menu_abierto_id = ref(null)
const orden_resonancia = ref(null)

// ─── Permisos ─────────────────────────────────────────────────────────────────
const is_admin                = ref(false)
const user_permissions        = ref([])
const permiso_qr              = ref(false)
const permiso_resumen         = ref(false)
const permiso_anular          = ref(false)
const permiso_solicitar_firma = ref(false)
const permiso_elaborar        = ref(false)  // 15: subir Excel base (metrólogo)
const permiso_entrega         = ref(false)

// Las mismas reglas se pedian en los botones de la fila y en el menu contextual.
const puedeSubirExcel = (item) => item.status !== 5 && permiso_elaborar.value
const puedeGenerarQr  = (item) => tieneExcelBase(item) && item.status !== 5 && permiso_qr.value
//permisos pildora
const ver_bandeja_firmas = computed(() => {
  return is_admin.value || user_permissions.value.includes(1001) || user_permissions.value.includes(1005)
})

// ─── Headers de la tabla ──────────────────────────────────────────────────────
// Vuetify 3: "title" en lugar de "text", "key" en lugar de "value"
const baseHeaders = [
  { title: 'Cód. Registro',       key: 'registry_code',         align: 'start',  sortable: false },
  { title: 'Tipo',                key: 'certificate_type_label', align: 'start',  sortable: false },
  { title: 'Cliente Certificado', key: 'client_data.name',                        sortable: false },
  { title: 'Lab.',                key: 'lab_data.code',                            sortable: false },
  { title: 'Nombre',              key: 'equipment',                               sortable: false },
  { title: 'XLS',                 key: 'uploaded_xls',          align: 'center', sortable: false },
  { title: 'Firma/QR',            key: 'uploaded',              align: 'center', sortable: false },
  { title: 'Orden',               key: 'order_number',                            sortable: false },
  { title: 'F. Agregado',         key: 'created_at',                              sortable: false },
  { title: 'Opciones',            key: 'actions',               align: 'center', sortable: false },
]

// Con el filtro Antapaccay todas las filas son el mismo cliente → ocultamos esa
// columna. TEMPORAL Antapaccay — al quitar el filtro, volver headers a baseHeaders.
const headers = computed(() =>
  filtro_antapacay.value
    ? baseHeaders.filter(h => h.key !== 'client_data.name')
    : baseHeaders
)



// ─── Row props (reemplaza item-class de Vuetify 2) ───────────────────────────
function getRowProps ({ item }) {
  const esResonancia = orden_resonancia.value && item.order_number === orden_resonancia.value;
  const esOpcionesAbiertas = contextMenu.value.show && contextMenu.value.item?.id === item.id;

  return {
    class: (esResonancia || esOpcionesAbiertas) ? 'resonancia-activa' : ''
  }
}

// El uuid puede venir de la tarea antes que la fila se actualice.
function linkNube(item) {
  const uuid = item.uuid || tareaDe(item.id, 'qr')?.uuid
  return uuid ? `https://daicomperu.com/${uuid}` : ''
}

// Guard de secuencia: si dos cargas se solapan, solo se aplica la mas reciente
// (evita que la carga sin filtro pise la busqueda enlazada).
const { begin: beginCertLoad, isLatest: isLatestCertLoad } = useLatestRequest()

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(options, () => retrieveAllCertificates(), { deep: true })

// Busqueda enlazada: si llega/cambia ?correlativo (incluso ya estando en la
// pestana), lo aplicamos y el watch de `correlative` dispara la busqueda.
watch(() => route.query.correlativo, (v) => { correlative.value = v || '' })

// Igual para ?firma_pendiente (notificacion de firma solicitada): activa el filtro.
watch(() => route.query.firma_pendiente, (v) => {
  if (v) { filtro_firma_pendiente.value = true; options.value.page = 1; retrieveAllCertificates() }
})

// Desde Inicio ("Ver los N" de por elaborar) llega ?excel_pendiente=1.
watch(() => route.query.excel_pendiente, (v) => {
  if (v) { filtro_excel_pendiente.value = true; options.value.page = 1; retrieveAllCertificates() }
})

watch(correlative,       () => { options.value.page = 1; retrieveAllCertificates() })
// Texto libre: espera a que termine de escribir en vez de consultar por letra.
watch(equipment, debounce(() => { options.value.page = 1; retrieveAllCertificates() }))
watch(certificate_type,  () => { options.value.page = 1; retrieveAllCertificates() })
watch(client_id,         () => { options.value.page = 1; retrieveAllCertificates() })
watch(lab_id,            () => { options.value.page = 1; retrieveAllCertificates() })

function abrirModalLote (accion) {
  if (batchActionModalRef.value) {
    batchActionModalRef.value.open(accion, certificados_seleccionados.value)
  }
}

// Marcar pasa por el modal aunque sea uno: hay que elegir la fecha.
function abrirEntrega (cert) {
  batchActionModalRef.value?.open('entrega', [cert], true)
}

function quitarEntrega (cert) {
  $swal.fire({
    title: '¿Quitar la entrega?',
    text: `${cert.registry_code} volverá a figurar como no entregado.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, quitar',
    cancelButtonText: 'Cancelar',
  }).then((result) => {
    if (!result.isConfirmed) return
    CertificateDataService.registrarEntrega([cert.id], null).then(() => {
      Toast.fire({ timer: 2500, icon: 'info', title: 'Entrega quitada' })
    }).catch(() => {
      $swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo quitar la entrega.' })
    })
  })
}

// ─── Expose ───────────────────────────────────────────────────────────────────
defineExpose({
  certificateModal,
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  retrieveAllCertificates() 
  const user = JSON.parse(localStorage.getItem('user')) || {}
  
  is_admin.value         = user.kind !== undefined && user.kind < 1
  user_permissions.value = user.action_permissions || []
  permiso_qr.value              = is_admin.value || user_permissions.value.includes(1001)
  permiso_resumen.value         = is_admin.value || user_permissions.value.includes(1002)
  permiso_anular.value          = is_admin.value || user_permissions.value.includes(1003)
  permiso_solicitar_firma.value = is_admin.value || user_permissions.value.includes(1005)
  permiso_elaborar.value        = is_admin.value || user_permissions.value.includes(1006)
  permiso_entrega.value         = is_admin.value || user_permissions.value.includes(1010)

  if (route.query.correlativo) {
    correlative.value = route.query.correlativo
  }

  // Desde la notificacion de "firma solicitada": llega ?firma_pendiente=1 -> activa
  // el filtro de la pildora de pendientes de firma (el guard de secuencia evita
  // que la carga sin filtro pise este resultado).
  if (route.query.firma_pendiente) {
    filtro_firma_pendiente.value = true
    options.value.page = 1
    retrieveAllCertificates()
  }

  if (route.query.excel_pendiente) {
    filtro_excel_pendiente.value = true
    options.value.page = 1
    retrieveAllCertificates()
  }

  window.addEventListener('wss-reload-certificates', recargarPorWebSocket)
  window.addEventListener('wss-update-row',       fetchAndInjectSingleCert)
  window.addEventListener('wss-update-rows',      aplicarFilasCambiadas)
  window.addEventListener('wss-update-order-row', fetchAndInjectOrderUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('wss-reload-certificates', recargarPorWebSocket)
  window.removeEventListener('wss-update-row',       fetchAndInjectSingleCert)
  window.removeEventListener('wss-update-rows',      aplicarFilasCambiadas)
  window.removeEventListener('wss-update-order-row', fetchAndInjectOrderUpdate)
})

// ─── Métodos ──────────────────────────────────────────────────────────────────





function toggleFiltroFirma () {
  filtro_firma_pendiente.value = !filtro_firma_pendiente.value
  options.value.page = 1
  retrieveAllCertificates() // Ejecuta la búsqueda
}

function toggleFiltroExcel () {
  filtro_excel_pendiente.value = !filtro_excel_pendiente.value
  options.value.page = 1
  retrieveAllCertificates() // Ejecuta la búsqueda
}

// ── TEMPORAL Antapacay — borrar al terminar contrato (~ago 2026) ──
function toggleFiltroAntapacay () {
  filtro_antapacay.value = !filtro_antapacay.value
  options.value.page = 1
  retrieveAllCertificates()
}

function aplicarFiltroFechas () {
  options.value.page = 1    // Reinicia la paginación a la página 1
  retrieveAllCertificates() // Dispara 1 sola búsqueda limpia al backend
}

function seleccionarTodaLaOrden (orderNum) {
  const certificadosDeOrden = certificates.value.filter(c => c.order_number === orderNum && c.status !== 5)
  
  certificadosDeOrden.forEach(cert => {
    if (!certificados_seleccionados.value.find(s => s.id === cert.id)) {
      certificados_seleccionados.value.push(cert)
    }
  })
  
  // Apagamos la resonancia azul y cerramos el menú
  orden_resonancia.value = null
  menu_abierto_id.value = null
}

import { mergeProps } from 'vue' // <--- Inyectamos mergeProps para que el Tooltip y el Menu convivan

// ---  SEMAFORO INTELIGENTE (FINANCIERO + OPERATIVO) ---

const getSemaforoColor = (item) => {
  if (item.order_status === 4) return 'grey-darken-3' // Anulada
  // Sin cargo va en verde: no hay nada que facturar ni cobrar, o sea que por el
  // lado del dinero esta cerrado igual que una pagada.
  if (item.order_requiere_pago === false) return 'success'

  const hasInv = item.order_has_invoices
  const hasPay = item.order_has_payments

  if (hasInv && hasPay) return 'success'  // Verde: Facturado y pagado
  if (hasInv || hasPay) return 'warning'  // Amarillo: Hay plata moviéndose (falta factura o falta pago)
  
  // Si llegamos aquí, es porque NO hay factura y NO hay pago
  if (tieneExcelBase(item)) return 'red'  // Rojo Alerta: Trabajo técnico hecho, pero no han cobrado
  return 'primary'                        // Azul: Borrador recién creado, nadie ha trabajado ni cobrado
}

const getSemaforoText = (item) => {
  if (item.order_status === 4) return 'Orden Anulada'
  if (item.order_requiere_pago === false) return 'Sin cargo, no se cobra'

  const hasInv = item.order_has_invoices
  const hasPay = item.order_has_payments

  if (hasInv && hasPay) return 'Facturación y Liquidación Completadas'
  if (hasInv && !hasPay) return 'Facturada (Pendiente de Liquidación)'
  if (!hasInv && hasPay) return 'Liquidación en Proceso (Pendiente de Facturación)'
  
  // Si llegamos aquí, es porque NO hay factura y NO hay pago
  if (tieneExcelBase(item)) return 'Trabajo técnico listo, falta Facturar y Cobrar'
  return 'Pendiente de Trabajo Técnico y Cobro'
}
// --------------------------------------

// Estado del menú contextual global
// Vuetify voltea el menu solo cuando no entra en pantalla, en los dos ejes.
const contextMenu = ref({ show: false, x: 0, y: 0, item: null })

function abrirMenu (x, y, cert) {
  // El menu es de una fila sola: la seleccion de lote se cancela para que la
  // barra de abajo no ofrezca acciones sobre otros certificados.
  if (certificados_seleccionados.value.length) certificados_seleccionados.value = []

  // Posicion y contenido en una sola asignacion: el menu se mueve y cambia sus
  // opciones en el mismo render, sin mostrar las de la fila anterior.
  contextMenu.value = { show: true, item: cert, x, y }
}

function handleRightClick (event, { item }) {
  event.preventDefault()
  abrirMenu(event.clientX, event.clientY, item.raw || item)
}

// Con el menu abierto, este click ya dejo encolado el cierre de Vuetify: la
// apertura va detras. El click derecho no lo sufre, Vuetify no lo escucha.
function handleMenuButton (event, { item }) {
  const { clientX, clientY } = event
  const cert = item.raw || item

  if (!contextMenu.value.show) return abrirMenu(clientX, clientY, cert)
  setTimeout(() => abrirMenu(clientX, clientY, cert), 0)
}

function handleRowClick (event, { item }) {
  // Prevenir selección si el clic fue en un botón, enlace o ícono interactivo
  if (event.target.closest('button, a, .v-btn, .v-icon')) return

  // Vuetify 3 a veces envuelve el objeto en 'raw' durante los eventos
  const cert = item.raw || item 
  
  // No permitir selección de elementos anulados
  if (cert.status === 5) return

  // Verificar si ya está seleccionado para agregarlo o quitarlo del array
  const index = certificados_seleccionados.value.findIndex(c => c.id === cert.id)
  if (index === -1) {
    certificados_seleccionados.value.push(cert)
  } else {
    certificados_seleccionados.value.splice(index, 1)
  }
}



// `silencioso` lo usa la recarga que llega por WebSocket: la disparo otro, el
// usuario no esta esperando nada, y un "cargando" ahi es una interrupcion.
function retrieveAllCertificates (opciones) {
  const silencioso = opciones?.silencioso === true

  // AL RECARGAR DATOS: Reiniciamos las selecciones para evitar filas fantasma (filtros o paginación)
  certificados_seleccionados.value = []

  if (!silencioso) loading_list.value = true
  const token = beginCertLoad()   // guard de secuencia: solo aplica la carga más reciente
  const pedidoEn = Date.now()     // lo que termine despues de esto, esta carga no lo vio
  const itemsPerPage       = options.value.itemsPerPage > 0 ? options.value.itemsPerPage : 100000
  const correlativeNumber  = correlative.value > 0 ? Number(correlative.value) : ''

  // Pasamos los parámetros al final
  CertificateDataService.getFiltered({
    page: options.value.page,
    page_size: itemsPerPage,
    correlative: correlativeNumber,
    equipment: equipment.value || '',
    client: client_id.value || '',
    lab: lab_id.value || '',
    emission_date__gt: emission_date__gt.value,
    emission_date__lt: emission_date__lt.value,
    certificate_type: certificate_type.value || '',
    signature_requested: filtro_firma_pendiente.value,
    pending_excel: filtro_excel_pendiente.value,
    antapacay: filtro_antapacay.value ? 1 : '', // TEMPORAL Antapacay — borrar al terminar contrato
  }).then((response) => {
    if (!isLatestCertLoad(token)) return   // llegó una carga más nueva → no pisar
    certificates.value = response.data.results.map(cert => CertificateMappers.getMap(cert))
    total_certificates.value = response.data.count
    // La lista viene del server, asi que manda ella sobre cualquier tarea terminada.
    certificates.value.forEach(c => confirmarFila(c.id, pedidoEn))
  }).catch((e) => {
    if (e.response?.status === 401) {
      localStorage.clear()
      router.replace('/login')
    }
  }).finally(() => {
    if (isLatestCertLoad(token)) loading_list.value = false
  })
}

const recargarPorWebSocket = () => retrieveAllCertificates({ silencioso: true })

function traerFilaCert (certId) {
  const pedidoEn = Date.now()
  CertificateDataService.get(certId).then(response => {
    if (response?.data) updateSingleCertificateInList(response.data, pedidoEn)
  }).catch(() => {})
}

function fetchAndInjectSingleCert (event) { traerFilaCert(event.detail) }

// Cambio una tanda entera: solo se toca lo que hay en pantalla.
function aplicarFilasCambiadas (event) {
  const visibles = certificates.value.map(c => c.id)
  const { accion, ids } = decidirRefresco(event.detail || [], visibles)
  if (accion === 'parchear') ids.forEach(traerFilaCert)
  else if (accion === 'refrescar') recargarPorWebSocket()
}

function updateSingleCertificateInList (updatedCert, pedidoEn) {
  // Llego el dato del server: la tarea ya no tiene que suplir a la fila.
  confirmarFila(updatedCert.id, pedidoEn)

  const index = certificates.value.findIndex(c => c.id === updatedCert.id)
  if (index !== -1) {
    // Al tener el mapper actualizado, obtenemos el objeto limpio.
    // Object.assign muta el proxy reactivo directamente para que Vue 3 repinte solo esta fila.
    Object.assign(certificates.value[index], CertificateMappers.getMap(updatedCert))
  }
}

// El semaforo llega ya calculado desde el back, con los mismos nombres que usa
// la fila. Antes se recalculaba aca a partir de la orden completa, con una regla
// propia que podia discrepar de la del serializer.
function fetchAndInjectOrderUpdate (event) {
  OrderDataService.getEstado(event.detail).then(response => {
    const estado = response?.data
    if (!estado) return
    certificates.value.forEach((cert, index) => {
      if (cert.order_number === estado.order_number) {
        certificates.value[index] = { ...certificates.value[index], ...estado }
      }
    })
    certificates.value = [...certificates.value]
  }).catch(() => {})
}

function anularCertConfirm (cert) {
  $swal.fire({
    title: '¿Anular este certificado?',
    text: `El correlativo ${cert.registry_code} se marcará como anulado.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, anular',
  }).then((result) => {
    if (result.isConfirmed) {
      CertificateDataService.patch(cert.id, { status: 5 }).then(() => {
        Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo anulado' })
        // El aviso a los demas lo da la notificacion `cert_anulado` (dirigida, persistente).
      })
    }
  })
}

function revivirCertConfirm (cert) {
  $swal.fire({
    title: '¿Restaurar certificado?',
    text: `El correlativo ${cert.registry_code} volverá a estado Borrador.`,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Sí, restaurar',
    cancelButtonText: 'Cancelar',
  }).then((result) => {
    if (result.isConfirmed) {
      CertificateDataService.patch(cert.id, { status: 1 })
        .then(() => {
          Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo restaurado' })
        })
        .catch(() => {
          $swal.fire('Error', 'No se pudo restaurar el equipo.', 'error')
        })
    }
  })
}

function solicitarFirmaIndividual(cert) {
  CertificateDataService.requestBatchSignatures([cert.id]).then(() => {
    Toast.fire({ timer: 3000,
      icon: 'success', title: `Firma solicitada para ${cert.registry_code}`
    })
  }).catch(() => {
    $swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo notificar a gerencia.' })
  })
}

function cancelarSolicitudFirma(cert) {
  CertificateDataService.cancelSignatureRequest(cert.id).then(() => {
    Toast.fire({ timer: 3000,
      icon: 'info', title: `Solicitud cancelada para ${cert.registry_code}`
    })
  }).catch(() => {
    $swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cancelar la solicitud.' })
  })
}


// Copia el link público del certificado al portapapeles con un toast breve.
function copiarLinkCertificado(cert) {
  const link = linkNube(cert)
  if (link) copiarConAviso(link, 'Link copiado')
}

// Clic normal en el botón de nube: abre el PDF (href). Ctrl/Cmd+clic: copia el link.
function onNubeClick(event, cert) {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    copiarLinkCertificado(cert)
  }
}

function eliminarDeLaNubeConfirm(cert) {
  $swal.fire({
    title: '¿Eliminar de la Nube Pública?',
    text: `El QR físico dejará de funcionar y el PDF ya no será visible en daicomperu.com, pero el equipo NO será anulado en el sistema interno.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      CertificateDataService.removeFromCloud(cert.id).then((response) => {
        // Leemos la data de forma agnóstica como lo hicimos en Uploadqr.vue
        const data = response.data || response;
        
        if (data.warning) {
          $swal.fire('Nube Limpia', data.success, 'warning')
        } else {
          Toast.fire({ timer: 2200, icon: 'success', title: data.success || 'Documento eliminado' })
        }
        
        cert.uploaded = false
        cert.status = 3 // Lo retrocedemos a Firmado localmente
      }).catch((error) => {
        const errorMsg = error.response?.data?.error || 'No se pudo contactar con el FTP.'
        $swal.fire('Error al eliminar de la Nube', errorMsg, 'error')
      })
    }
  })
}

function openUploadDialog (item) {
  if (batchActionModalRef.value) {
    batchActionModalRef.value.open('excel', [item], true)
  }
}

function openQRDialog (item) {
  if (batchActionModalRef.value) {
    batchActionModalRef.value.open('qr', [item], true)
  }
}

</script>

<style>

/* ── TEMPORAL Antapaccay — borrar este bloque al terminar contrato (~ago 2026) ── */
.antapaccay-chip {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(184, 115, 51, 0.45) !important;
  background: rgba(184, 115, 51, 0.10) !important;
  color: #8a5a2b !important;
  transition: transform .2s ease, box-shadow .25s ease, background .25s ease;
}
.antapaccay-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(184, 115, 51, 0.35) !important;
}
.antapaccay-chip--active {
  background: linear-gradient(120deg, #6d3810, #b87333 42%, #e6b483 52%, #b87333 62%, #6d3810) !important;
  color: #fff !important;
  border-color: transparent !important;
  box-shadow: 0 3px 14px rgba(184, 115, 51, 0.55) !important;
}
/* Brillo metálico que barre de lado a lado */
.antapaccay-chip--active::after {
  content: "";
  position: absolute;
  top: 0;
  left: -70%;
  width: 45%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transform: skewX(-20deg);
  pointer-events: none;
  animation: antapaccay-shine 2.6s ease-in-out infinite;
}
.antapaccay-chip .v-chip__content {
  position: relative;
  z-index: 1;
}
@keyframes antapaccay-shine {
  0%   { left: -70%; }
  55%  { left: 130%; }
  100% { left: 130%; }
}
/* El pico "pica" mientras está activa */
.antapaccay-chip--active .antapaccay-pico {
  transform-origin: 65% 65%;
  animation: antapaccay-pick 1.5s ease-in-out infinite;
}
@keyframes antapaccay-pick {
  0%, 100% { transform: rotate(0deg); }
  40%      { transform: rotate(-22deg); }
  55%      { transform: rotate(8deg); }
  70%      { transform: rotate(0deg); }
}
/* ── FIN TEMPORAL Antapaccay ── */


/* =========================================================
   ESTADO ANULADO
   ========================================================= */
.anulado-atenuado {
  opacity: 0.3 !important;
  pointer-events: none;
}



/* =========================================================
   BOTÓN DE ORDEN: HERMANOS ATENUADOS
   Cuando un menú de orden está abierto, los botones de las
   otras filas de la MISMA orden se apagan y no son clicables.
   La transición es suave para no ser brusca.
   ========================================================= */
.boton-orden-atenuado {
  opacity: 0.2 !important;
  pointer-events: none !important;
  transition: opacity 0.25s ease !important;
}



/* =========================================================
   EFECTO RESONANCIA (Fila activa por orden o por opciones)
   ========================================================= */
.tabla-certificados-interactiva tbody tr.resonancia-activa,
.tabla-certificados-interactiva tbody tr.resonancia-activa td {
  background-color: #E3F2FD !important;
  transition: background-color 0.2s ease-in-out;
}
.v-theme--dark .tabla-certificados-interactiva tbody tr.resonancia-activa,
.v-theme--dark .tabla-certificados-interactiva tbody tr.resonancia-activa td {
  background-color: #0f1d31 !important;
}

/* La píldora de selección flotante vive ahora en el componente común
   @/components/commonComponents/SelectionBar.vue (estilos incluidos). */

/* =========================================================
   EFECTO GMAIL: CHECKBOXES INVISIBLES Y FILAS CLIQUEABLES
   ========================================================= */
/* Cursor de puntero para toda la fila */
.tabla-certificados-interactiva tbody tr {
  cursor: pointer;
}

/* Hover NORMAL (Aplica SOLO si la fila NO está en resonancia azul) */
.tabla-certificados-interactiva tbody tr:not(.resonancia-activa):hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.v-theme--dark .tabla-certificados-interactiva tbody tr:not(.resonancia-activa):hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* Hover EN RESONANCIA (Intensifica el azul ligeramente al pasar el mouse por la fila activa) */
.tabla-certificados-interactiva tbody tr.resonancia-activa:hover,
.tabla-certificados-interactiva tbody tr.resonancia-activa:hover td {
  background-color: #BBDEFB !important; /* Azul claro más intenso (Modo Claro) */
}
.v-theme--dark .tabla-certificados-interactiva tbody tr.resonancia-activa:hover,
.v-theme--dark .tabla-certificados-interactiva tbody tr.resonancia-activa:hover td {
  background-color: #152945 !important; /* Azul noche más intenso (Modo Oscuro) */
}

/* Checkboxes con opacidad baja (efecto marca de agua) por defecto */
.tabla-certificados-interactiva tbody tr td:first-child .v-selection-control {
  opacity: 0.25; /* 25% crea la pista visual sin generar ruido */
  transition: opacity 0.2s ease-in-out;
}

/* Mostrar checkbox al hacer hover, o si el checkbox ya está marcado/sucio */
.tabla-certificados-interactiva tbody tr:hover td:first-child .v-selection-control,
.tabla-certificados-interactiva tbody tr td:first-child .v-selection-control--dirty,
.tabla-certificados-interactiva tbody tr td:first-child .v-selection-control[aria-checked="true"] {
  opacity: 1 !important;
}
</style>