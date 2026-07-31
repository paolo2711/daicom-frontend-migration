<template>
  <v-card flat tile color="transparent" class="elevation-0">
    <v-toolbar density="compact" flat color="transparent" class="pl-3">
      <div class="d-flex align-center">
        <v-icon start color="primary">mdi-clipboard-list</v-icon>
        <span class="text-subtitle-2 font-weight-bold text-primary">
          Equipos en este Servicio: {{ order.order_number }}
        </span>
        <span v-if="order.created_at" class="text-caption text-medium-emphasis ml-3 mt-1 font-weight-medium d-flex align-center">
          <v-icon size="x-small" class="mr-1">mdi-calendar-blank</v-icon>
          {{ order.created_at.substring(0, 10) }}
        </span>
      </div>
      <v-spacer/>
      <!-- size="x-small" | left → start (V3) -->
      <v-btn size="x-small" color="orange-darken-3" variant="flat" class="text-white mr-2" @click="$emit('request-signatures', order.certificates)" :disabled="order.status === 4 || !order.certificates || order.certificates.length === 0">
        <v-icon start size="x-small">mdi-bell-ring</v-icon> Solicitar Firmas
      </v-btn>
      <v-btn size="x-small" color="primary" variant="flat" class="text-white" @click="$emit('add-extra')" :disabled="order.status === 4">
        <v-icon start size="x-small">mdi-plus</v-icon> Añadir Equipo Extra
      </v-btn>
    </v-toolbar>

    <!-- circulo de carga para table orders el div -->
    <div v-if="order.certificates && order.certificates.length > 0 && !order.certificates[0].registry_code" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      <div class="text-caption mt-2 text-medium-emphasis">Cargando detalle de equipos...</div>
    </div>

    <v-table density="compact" :hover="false" v-else class="bg-transparent">
      <thead>
        <tr class="bg-transparent">
          <th class="text-overline">EXPEDIENTE</th>
          <th class="text-overline">EQUIPO</th>
          <th class="text-center text-overline">DOCUMENTACIÓN</th>
          <th class="text-center text-overline">ESTADO</th>
          <th class="text-center text-overline"><v-icon size="small">mdi-dots-vertical</v-icon></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cert in order.certificates" :key="cert.id" :class="cert.status === 5 ? 'fila-anulada' : ''">
          <td><strong>{{ cert.registry_code }}</strong></td>
          <td>{{ cert.equipment }}</td>

          <td class="text-center">
            <div class="d-flex justify-center align-center">
              <v-btn 
                icon variant="text" density="comfortable" size="x-small" class="mx-1"
                :href="getValidPdfUrl(cert)" 
                target="_blank" 
                :disabled="!hasValidPdf(cert)"
              >
                <v-icon :color="hasValidPdf(cert) ? 'primary' : 'grey-lighten-1'">
                  mdi-file-pdf-box
                </v-icon>
              </v-btn>

              <v-btn 
                icon variant="text" density="comfortable" size="x-small" class="mx-1"
                :href="getValidCloudUrl(cert)" 
                target="_blank" 
                :disabled="!hasValidCloud(cert)" 
              >
                <v-icon :color="hasValidCloud(cert) ? 'primary' : 'grey-lighten-1'">
                  mdi-cloud-check
                </v-icon>
              </v-btn>
            </div>
          </td>

          <td class="text-center">
            <!-- v-chip x-small outlined → size="x-small" variant="outlined" -->
            <v-chip size="x-small" :color="getStatusCertColor(cert)" variant="outlined" label>
              {{ getStatusCertLabel(cert) }}
            </v-chip>
          </td>

          <td class="text-center">
            <div class="d-flex justify-center align-center">
              <!-- v-tooltip: bottom → location="bottom" | activator: {on} → {props} v-bind -->
              <v-tooltip location="bottom" color="info">
                <template v-slot:activator="{ props }">
                  <v-btn icon variant="text" density="comfortable" size="x-small" color="blue-darken-2" class="mx-1" v-bind="props" @click="irACertificado(cert)" v-if="cert.status !== 5">
                    <v-icon>mdi-open-in-new</v-icon>
                  </v-btn>
                </template>
                <span>Ir al Certificado</span>
              </v-tooltip>

              <v-tooltip location="bottom" color="primary">
                <template v-slot:activator="{ props }">
                  <v-btn icon variant="text" density="comfortable" size="x-small" color="primary" class="mx-1" v-bind="props" @click="$emit('edit-certificate', cert)" v-if="cert.status !== 5">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Editar Certificado</span>
              </v-tooltip>

              <v-tooltip location="bottom" color="warning" v-if="cert.status !== 5">
                <template v-slot:activator="{ props }">
                  <v-btn icon variant="text" density="comfortable" size="x-small" color="orange-darken-3" class="mx-1" v-bind="props" @click="desvincularCertificado(cert)">
                    <v-icon>mdi-link-variant-off</v-icon>
                  </v-btn>
                </template>
                <span>Desvincular de la Orden</span>
              </v-tooltip>

              <v-btn icon variant="text" density="comfortable" size="x-small" color="red" class="mx-1" @click="anularCertConfirm(cert)" v-if="cert.status !== 5 && hasPermission(12)">
                <v-icon>mdi-minus-circle-outline</v-icon>
              </v-btn>

              <v-tooltip location="bottom" color="success" v-if="cert.status === 5 && hasPermission(12)">
                <template v-slot:activator="{ props }">
                  <!-- [R1] variant="text" | [R2] density="comfortable" -->
                  <v-btn icon variant="text" density="comfortable" size="x-small" color="green-darken-2" class="mx-1" v-bind="props" @click="revivirCertConfirm(cert)">
                    <v-icon>mdi-backup-restore</v-icon>
                  </v-btn>
                </template>
                <span>Restaurar Certificado</span>
              </v-tooltip>
            </div>
          </td>
        </tr>
        <tr v-if="!order.certificates || order.certificates.length === 0">
          <td colspan="5" class="text-center text-grey py-6 font-weight-medium">
            No se encontraron equipos registrados en este expediente.
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script>
import { useTheme } from 'vuetify'
import { computed as vueComputed } from 'vue'
import CertificateDataService from "@/services/certificates/certificateDataService";

export default {
  name: "TableServiceDetails",
  setup() {
    const theme = useTheme()
    const isDark = vueComputed(() => theme.global.current.value.dark)
    return { isDark }
  },
  props: {
    order: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    is_admin: false,
    user_permissions: [],
  }),
  computed: {
    // isDark eliminado de aquí (ahora viene de setup)
  },
  created() {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    this.is_admin = user.kind !== undefined && user.kind < 1;
    this.user_permissions = user.action_permissions || [];
  },
  methods: {
    hasValidPdf(cert) {
      const val = cert.uploaded_xls;
      
      // 1. Escudo de tipos: Si el backend envía un booleano en el primer renderizado (Listado),
      // asumimos 'false' para evitar el parpadeo hasta que llegue la ruta string (Detalle).
      if (typeof val === 'boolean') return false;

      // 2. Validación estricta para la ruta final
      return Boolean(val && val !== '0' && val !== 'False' && val !== 'null' && val !== 'undefined');
    },
    getValidPdfUrl(cert) {
      return this.hasValidPdf(cert) ? `/media/${cert.uploaded_xls}` : undefined;
    },
    hasValidCloud(cert) {
      const val = cert.uploaded;
      // Previene falsos positivos con strings de base de datos
      return Boolean(val && val !== 'False' && val !== '0' && val !== 'null');
    },
    getValidCloudUrl(cert) {
      return this.hasValidCloud(cert) ? `https://daicomperu.com/${cert.uuid || cert.correlative}` : undefined;
    },
    irACertificado(cert) {
      this.$router.push({ path: '/certificates', query: { correlativo: cert.correlative } }).catch(() => {});
    },
    getStatusCertLabel(cert) {
      if (cert.status === 5) return 'ANULADO';
      if (cert.attached_pdf || cert.uploaded) return 'Listo';
      if (cert.uploaded_xls) return 'En Proceso';
      return 'Borrador';
    },
    getStatusCertColor(cert) {
      if (cert.status === 5) return 'red-darken-2';
      if (cert.attached_pdf || cert.uploaded) return 'success';
      if (cert.uploaded_xls) return 'warning';
      return 'grey-darken-1';
    },
    desvincularCertificado(cert) {
      this.$swal.fire({
        title: '¿Desvincular este equipo?',
        text: `El correlativo ${cert.registry_code} quedará "huérfano" y desaparecerá de esta orden.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desvincular',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Mandamos order en null para romper la relación de llave foránea en Django
          CertificateDataService.patch(cert.id, { order: null }).then(() => {
            this.$swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Equipo desvinculado' });
            
            // 1. Avisamos al padre (TabOrdersService) que recargue SOLO esta orden específica
            if (window.notificarActualizacionFila) {
              window.notificarActualizacionFila(null, this.order.id);
              window.notificarActualizacionFila(cert.id, null);
            }
            
          }).catch(err => {
            console.error("Error al desvincular equipo:", err);
            this.$swal.fire('Error', 'No se pudo desvincular el equipo.', 'error');
          });
        }
      });
    },
    anularCertConfirm(cert) {
      this.$swal.fire({
        title: '¿Anular este equipo?',
        text: `El correlativo ${cert.registry_code} se marcará como anulado.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, anular'
      }).then((result) => {
        if (result.isConfirmed) {
          CertificateDataService.patch(cert.id, { status: 5 }).then(() => {
            this.$swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Equipo anulado' });
            
            if (window.notificarActualizacionFila) {
              window.notificarActualizacionFila(null, this.order.id);
              window.notificarActualizacionFila(cert.id, null);
            }
            
          }).catch(err => {
            console.error("Error al anular equipo:", err);
            this.$swal.fire('Error', 'No se pudo comunicar con el servidor.', 'error');
          });
        }
      });
    },
    hasPermission(id) {
      if (this.is_admin) return true;
      return this.user_permissions.includes(id);
    },
    revivirCertConfirm(cert) {
      this.$swal.fire({
        title: '¿Restaurar equipo?',
        text: `El correlativo ${cert.registry_code} volverá a estado Borrador.`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sí, restaurar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          CertificateDataService.patch(cert.id, { status: 1 }).then(() => {
            this.$swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Equipo restaurado' });
            
            if (window.notificarActualizacionFila) {
              window.notificarActualizacionFila(null, this.order.id);
              window.notificarActualizacionFila(cert.id, null);
            }
            
          }).catch(() => {
            this.$swal.fire('Error', 'No se pudo restaurar el equipo.', 'error');
          });
        }
      });
    }
  }
}
</script>

<style scoped>
.fila-anulada {
  opacity: 0.5;
}
.text-overline {
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px !important;
  color: #757575 !important;
}
.justify-center.align-center .v-btn {
  margin: 0 2px;
}
</style>