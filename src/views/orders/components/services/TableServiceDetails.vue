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

              <v-tooltip location="bottom" :disabled="!hasValidCloud(cert)">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon variant="text" density="comfortable" size="x-small" class="mx-1"
                    :href="getValidCloudUrl(cert)"
                    target="_blank"
                    :disabled="!hasValidCloud(cert)"
                    @click.stop="onNubeClick($event, cert)"
                  >
                    <v-icon :color="hasValidCloud(cert) ? 'primary' : 'grey-lighten-1'">
                      mdi-cloud-check
                    </v-icon>
                  </v-btn>
                </template>
                <span>Ver PDF en Nube Pública<br><small>Ctrl+clic: copiar link</small></span>
              </v-tooltip>
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

              <v-btn icon variant="text" density="comfortable" size="x-small" color="red" class="mx-1" @click="anularCertConfirm(cert)" v-if="cert.status !== 5 && hasPermission(1003)">
                <v-icon>mdi-minus-circle-outline</v-icon>
              </v-btn>

              <v-tooltip location="bottom" color="success" v-if="cert.status === 5 && hasPermission(1003)">
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
import { Toast } from '@/plugins/alerts'
import { useTheme } from 'vuetify'
import { computed as vueComputed } from 'vue'
import CertificateDataService from "@/services/certificates/certificateDataService";
import { copiarConAviso } from "@/utils/clipboard";

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
    // El back manda uploaded_xls_url ya armada, o null si ese certificado no
    // tiene PDF base. Antes habia que adivinar aca si el campo traia una ruta o
    // el flag viejo ("1", "0", "False"...).
    hasValidPdf(cert) {
      return Boolean(cert.uploaded_xls_url);
    },
    getValidPdfUrl(cert) {
      return cert.uploaded_xls_url || undefined;
    },
    hasValidCloud(cert) {
      const val = cert.uploaded;
      // Previene falsos positivos con strings de base de datos
      return Boolean(val && val !== 'False' && val !== '0' && val !== 'null');
    },
    getValidCloudUrl(cert) {
      return this.hasValidCloud(cert) ? `https://daicomperu.com/${cert.uuid || cert.correlative}` : undefined;
    },
    // Clic normal en el botón de nube: abre el PDF (href). Ctrl/Cmd+clic: copia el link.
    onNubeClick(event, cert) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const link = this.getValidCloudUrl(cert);
        if (!link) return;
        copiarConAviso(link, 'Link copiado');
      }
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
            Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo desvinculado' });
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
            Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo anulado' });
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
            Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo restaurado' });
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