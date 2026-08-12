<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-1">
          <v-icon size="large" color="warning" class="mr-3">mdi-tools</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Mantenimiento</h2>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Acciones de administrador. Son operaciones sensibles: se aplican a toda tu empresa.
        </p>

        <!-- Acción segura: forzar escaneo de expedientes -->
        <v-card variant="outlined" rounded="lg" max-width="720" class="mb-6">
          <div class="pa-4 d-flex flex-wrap align-center ga-4">
            <div style="flex: 1 1 320px; min-width: 260px;">
              <div class="text-subtitle-1 font-weight-medium">Escanear expedientes ahora</div>
              <div class="text-body-2 text-medium-emphasis">
                Revisa el inventario y genera los avisos de expedientes <strong>por vencer</strong> (30/15/7 días)
                o <strong>vencidos</strong>. Es seguro repetirlo: no duplica avisos ya existentes.
              </div>
            </div>
            <v-btn
              color="teal-darken-1"
              variant="flat"
              prepend-icon="mdi-radar"
              :loading="loadingScan"
              @click="escanearExpedientes"
            >
              Escanear ahora
            </v-btn>
          </div>
        </v-card>

        <!-- Acción disruptiva (no destructiva): recargar página de todos -->
        <v-card variant="outlined" rounded="lg" max-width="720" class="mb-6">
          <div class="pa-4 d-flex flex-wrap align-center ga-4">
            <div style="flex: 1 1 320px; min-width: 260px;">
              <div class="text-subtitle-1 font-weight-medium">Recargar página de todos</div>
              <div class="text-body-2 text-medium-emphasis">
                Fuerza a todos los usuarios (menos a ti) a recargar <strong>toda</strong> la página.
                Útil para aplicar cambios sin cerrarles la sesión. Ojo: pierden datos sin guardar en formularios abiertos.
              </div>
            </div>
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-refresh"
              :loading="loadingReload"
              @click="recargarTodos"
            >
              Recargar todo
            </v-btn>
          </div>
        </v-card>

        <!-- DANGER -->
        <v-card
          variant="outlined"
          rounded="lg"
          class="danger-zone"
          max-width="720"
        >
          <div class="danger-header px-4 py-2 d-flex align-center">
            <v-icon size="small" color="error" class="mr-2">mdi-alert-octagon-outline</v-icon>
            <span class="text-subtitle-2 font-weight-bold text-error">DANGER</span>
          </div>

          <v-divider />

          <!-- Cerrar sesiones -->
          <div class="pa-4 d-flex flex-wrap align-center ga-4">
            <div style="flex: 1 1 320px; min-width: 260px;">
              <div class="text-subtitle-1 font-weight-medium">Cerrar sesión de todos</div>
              <div class="text-body-2 text-medium-emphasis">
                Envía a todos los usuarios (menos a ti) a la pantalla de inicio de sesión.
                Úsalo tras cambiar roles o permisos, para que nadie quede con accesos viejos.
              </div>
            </div>
            <v-btn
              color="warning"
              variant="flat"
              prepend-icon="mdi-logout-variant"
              :loading="loadingLogout"
              @click="cerrarSesiones"
            >
              Cerrar sesiones
            </v-btn>
          </div>

          <v-divider />

          <!-- Borrar notificaciones -->
          <div class="pa-4 d-flex flex-wrap align-center ga-4">
            <div style="flex: 1 1 320px; min-width: 260px;">
              <div class="text-subtitle-1 font-weight-medium">Borrar notificaciones</div>
              <div class="text-body-2 text-medium-emphasis">
                Elimina <strong>todas</strong> las notificaciones de la empresa (de todos los usuarios).
                No se puede deshacer.
              </div>
            </div>
            <v-btn
              color="error"
              variant="flat"
              prepend-icon="mdi-bell-remove-outline"
              :loading="loadingNotif"
              @click="borrarNotificaciones"
            >
              Borrar todo
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import MaintenanceDataService from '@/services/maintenance/maintenanceDataService'

const loadingLogout = ref(false)
const loadingNotif = ref(false)
const loadingReload = ref(false)
const loadingScan = ref(false)

const confirmar = (opts) => Swal.fire({
  showCancelButton: true,
  cancelButtonText: 'Cancelar',
  reverseButtons: true,
  ...opts,
})

const escanearExpedientes = async () => {
  // Acción segura e idempotente: no pide confirmación.
  loadingScan.value = true
  try {
    const { data } = await MaintenanceDataService.scanExpiries()
    Toast.fire({ icon: 'success', title: data?.success || 'Escaneo listo.' })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.detail || 'No se pudo escanear.', 'error')
  } finally {
    loadingScan.value = false
  }
}

const recargarTodos = async () => {
  const { isConfirmed } = await confirmar({
    icon: 'question',
    title: '¿Recargar la página de todos?',
    text: 'Todos los usuarios (menos tú) recargarán la página. Perderán datos sin guardar en formularios abiertos.',
    confirmButtonText: 'Sí, recargar',
    confirmButtonColor: '#1976d2',
  })
  if (!isConfirmed) return

  loadingReload.value = true
  try {
    const { data } = await MaintenanceDataService.reloadAllTabs()
    Toast.fire({ icon: 'success', title: data?.success || 'Recarga solicitada.' })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.detail || 'No se pudo solicitar la recarga.', 'error')
  } finally {
    loadingReload.value = false
  }
}

const cerrarSesiones = async () => {
  const { isConfirmed } = await confirmar({
    icon: 'warning',
    title: '¿Cerrar sesión de todos?',
    text: 'Todos los usuarios (menos tú) serán enviados a inicio de sesión.',
    confirmButtonText: 'Sí, cerrar sesiones',
    confirmButtonColor: '#fb8c00',
  })
  if (!isConfirmed) return

  loadingLogout.value = true
  try {
    const { data } = await MaintenanceDataService.forceLogoutAll()
    Toast.fire({ icon: 'success', title: data?.success || 'Sesiones cerradas.' })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.detail || 'No se pudo cerrar las sesiones.', 'error')
  } finally {
    loadingLogout.value = false
  }
}

const borrarNotificaciones = async () => {
  const { isConfirmed } = await confirmar({
    icon: 'warning',
    title: '¿Borrar todas las notificaciones?',
    text: 'Se eliminarán las notificaciones de todos los usuarios de la empresa. No se puede deshacer.',
    confirmButtonText: 'Sí, borrar todo',
    confirmButtonColor: '#e53935',
  })
  if (!isConfirmed) return

  loadingNotif.value = true
  try {
    const { data } = await MaintenanceDataService.clearNotifications()
    Toast.fire({ icon: 'success', title: data?.success || 'Notificaciones borradas.' })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.detail || 'No se pudo borrar las notificaciones.', 'error')
  } finally {
    loadingNotif.value = false
  }
}
</script>

<style scoped>
.danger-zone {
  border-color: rgba(229, 57, 53, 0.5) !important;
}
.danger-header {
  background: rgba(229, 57, 53, 0.06);
}
</style>
