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

        <!-- Escaneos de vencimientos. La lista la arma el back: escaneo nuevo alla
             = fila nueva aca, sin tocar este archivo. -->
        <v-card variant="outlined" rounded="lg" max-width="720" class="mb-6">
          <div class="pa-4 pb-2 d-flex align-center">
            <v-icon size="small" color="teal-darken-1" class="mr-2">mdi-radar</v-icon>
            <span class="text-subtitle-1 font-weight-medium">Escaneo de vencimientos</span>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">automático</span>
          </div>
          <div class="px-4 pb-3 text-body-2 text-medium-emphasis">
            Relee el listado de patrones del laboratorio y los expedientes del inventario,
            y actualiza el bloque de <strong>Vencimientos</strong> de Inicio. Se hace solo
            cuando el primero entra cada día; el botón es para no esperar.
          </div>

          <v-divider />
          <div class="pa-4 d-flex flex-wrap align-center ga-3">
            <div style="flex: 1 1 300px; min-width: 240px;">
              <div class="text-caption" :class="ultima && ultima.error ? 'text-error' : 'text-medium-emphasis'">
                <v-icon size="12" class="mr-1">
                  {{ ultima && ultima.error ? 'mdi-alert-circle-outline' : 'mdi-clock-outline' }}
                </v-icon>
                <template v-if="ultima">{{ ultima.fecha }} {{ ultima.hora }} · {{ detalleCorto(ultima.detalle) }}</template>
                <template v-else-if="cargandoScan">Cargando…</template>
                <template v-else>Todavía no se ha ejecutado</template>
              </div>
            </div>
            <v-btn size="small" color="teal-darken-1" variant="flat" prepend-icon="mdi-radar"
                   :loading="corriendo" @click="correrScan">
              Escanear ahora
            </v-btn>
          </div>
        </v-card>

        <!-- Accion disruptiva (no destructiva): recargar pagina de todos -->
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

        <!-- Area de PRUEBAS (testing de toasts y notificaciones) -->
        <v-card variant="outlined" rounded="lg" max-width="720" class="mb-6">
          <div class="pa-4 pb-1 d-flex align-center">
            <v-icon size="small" color="primary" class="mr-2">mdi-flask-outline</v-icon>
            <span class="text-subtitle-1 font-weight-medium">Pruebas (testing)</span>
          </div>
          <div class="px-4 text-body-2 text-medium-emphasis mb-3">
            Dispara toasts y notificaciones a voluntad para ver cómo se ven, sin esperar un evento real.
          </div>

          <div class="px-4 pb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">Toast de evento</div>
          <div class="px-4 pb-3 d-flex flex-wrap ga-2">
            <v-btn v-for="p in PRUEBAS" :key="p.category" size="small" variant="tonal" @click="probarToast(p)">{{ p.text }}</v-btn>
            <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-lightning-bolt" @click="probarRafaga">Ráfaga ×5</v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-layers-triple" @click="probarVariosTipos">Varios tipos a la vez</v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-refresh" @click="probarAvisoTrasRecarga">
              Aviso tras recargar (recarga esta pestaña)
            </v-btn>
          </div>

          <div class="px-4 pb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">Otros toasts</div>
          <div class="px-4 pb-3 d-flex flex-wrap ga-2">
            <v-btn size="small" variant="tonal" @click="probarFeedback">Feedback</v-btn>
          </div>

          <div class="px-4 pb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">Banners de estado (persistentes)</div>
          <div class="px-4 pb-4 d-flex flex-wrap ga-2">
            <v-btn size="small" variant="tonal" @click="statusStore.raise('ws_down')">Sin conexión</v-btn>
            <v-btn size="small" variant="tonal" @click="statusStore.raise('update_available')">Nueva versión</v-btn>
            <v-btn size="small" variant="text" @click="statusStore.active = []">Limpiar banners</v-btn>
          </div>

          <div class="px-4 pb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">Notificación real (aparece en tu panel)</div>
          <div class="px-4 pb-4 d-flex flex-wrap ga-2 align-center">
            <v-btn size="small" variant="flat" color="primary" prepend-icon="mdi-bell-plus-outline" :loading="loadingTest" @click="crearNotifReal('cert_subido')">
              Crear notificación de prueba
            </v-btn>
            <span class="text-caption text-medium-emphasis">Se limpia con "Borrar notificaciones".</span>
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
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import { useAppStore } from '@/stores/appStore'
import { useStatusStore } from '@/stores/statusStore'
import MaintenanceDataService from '@/services/maintenance/maintenanceDataService'
import { showEventToast, queueToastForNextLoad } from '@/services/notifications/eventToasts'

const appStore = useAppStore()
const statusStore = useStatusStore()

const loadingLogout = ref(false)
const loadingNotif = ref(false)
const loadingReload = ref(false)
const loadingTest = ref(false)

//  Escaneo de vencimientos: cuando corrio la ultima vez
const ultima = ref(null)
const cargandoScan = ref(true)
const corriendo = ref(false)

// El detalle del log viene con el nombre del comando adelante
// ("scan_vencimientos: 53 patrones leidos..."). En pantalla ya se sabe cual es.
const detalleCorto = (d) => (d || '').replace(/^scan_\w+:\s*/, '')

const cargarScan = async () => {
  try {
    const { data } = await MaintenanceDataService.scanStatus()
    ultima.value = data?.ultima || null
  } catch (e) {
    ultima.value = null
  } finally {
    cargandoScan.value = false
  }
}

onMounted(cargarScan)

//  Area de pruebas
const PRUEBAS = [
  { category: 'cert_subido',      level: 'info',     ref: '008159',        text: 'Cert. elaborado' },
  { category: 'qr_subido',        level: 'info',     ref: '008159',        text: 'Cert. firmado' },
  { category: 'firma_solicitada', level: 'info',     ref: '',              text: 'Firma solicitada' },
  { category: 'orden_creada',     level: 'info',     ref: 'OS-2026-00042', text: 'Orden creada' },
  { category: 'cert_anulado',     level: 'warning',  ref: '008159',        text: 'Cert. anulado' },
  { category: 'orden_anulada',    level: 'warning',  ref: 'OS-2026-00042', text: 'Orden anulada' },
  { category: 'app_recargada',    level: 'info',     ref: '',              text: 'App recargada' },
]

const probarToast = (p) => showEventToast({ category: p.category, level: p.level, ref: p.ref })

// Dispara 5 seguidas para ver la AGREGACION ("5 certificados anulados").
const probarRafaga = () => {
  for (let i = 1; i <= 5; i++) {
    showEventToast({ category: 'cert_anulado', level: 'warning', ref: `00815${i}` })
  }
}

// 3 tipos distintos a la vez: se APILAN (antes se pisaban).
const probarVariosTipos = () => {
  showEventToast({ category: 'cert_subido', level: 'info', ref: '008159' })
  showEventToast({ category: 'firma_solicitada', level: 'info', ref: '' })
  showEventToast({ category: 'orden_anulada', level: 'warning', ref: 'OS-2026-00042' })
}

// Prueba del flujo REAL de la recarga forzada: encola el aviso y recarga esta
// pestana. El toast debe aparecer DESPUES de que la pagina vuelva a cargar.
const probarAvisoTrasRecarga = () => {
  queueToastForNextLoad('app_recargada')
  window.location.reload()
}

const probarFeedback = () => Toast.fire({ icon: 'success', title: 'Guardado (prueba)' })

const crearNotifReal = async (category) => {
  loadingTest.value = true
  try {
    const { data } = await MaintenanceDataService.testNotification(category)
    Toast.fire({ icon: 'success', title: data?.success || 'Notificación de prueba creada.' })
  } catch (e) {
    Swal.fire('Error', e.response?.data?.detail || 'No se pudo crear la notificación.', 'error')
  } finally {
    loadingTest.value = false
  }
}

const confirmar = (opts) => Swal.fire({
  showCancelButton: true,
  cancelButtonText: 'Cancelar',
  reverseButtons: true,
  ...opts,
})

const correrScan = async () => {
  // Accion segura: solo relee y reescribe el resumen. No pide confirmacion.
  corriendo.value = true
  try {
    const { data } = await MaintenanceDataService.scan()
    Toast.fire({ icon: 'success', title: data?.success || 'Escaneo listo.' })
  } catch (e) {
    const msg = e.response?.data?.error || e.response?.data?.detail
    Swal.fire('Error', msg || 'No se pudo escanear.', 'error')
  } finally {
    corriendo.value = false
    await cargarScan()   // el error tambien queda registrado, que se vea
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
