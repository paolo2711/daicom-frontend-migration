<template>
  <v-app id="inspire">
    <Sidebar />
    
    <v-main>
      <v-container fluid class="page-wrapper pa-0">
        <router-view/>
      </v-container>
      
      <Footer></Footer>
    </v-main>

    <upload-manager />
    <upload-sheets />
    <upload-q-r />

    <!-- Condiciones persistentes (WS caido, version nueva). No bloquean. -->
    <status-banners />

    <!-- Toasts de evento (pila propia: permite varios a la vez sin pisarse). -->
    <event-toast-stack />
  </v-app>
</template>

<script setup>
import { onMounted, onUnmounted, getCurrentInstance } from 'vue'
import axios from 'axios'
import wsNotificationService from '@/services/websockets/wsNotificationService'
import { useAppStore } from '@/stores/appStore'

import Sidebar from './sidebar/Sidebar.vue'
import Footer from './footer/Footer.vue'
import UploadManager from '@/components/commonComponents/UploadManager.vue'
import UploadSheets from '@/components/commonComponents/UploadSheets.vue'
import UploadQR from '@/components/commonComponents/UploadQR.vue'
import StatusBanners from '@/components/commonComponents/StatusBanners.vue'
import EventToastStack from '@/components/commonComponents/EventToastStack.vue'
import CertificateDataService from '@/services/certificates/certificateDataService.js'
import { useStatusStore } from '@/stores/statusStore'
import { flushQueuedToast } from '@/services/notifications/eventToasts'

let socket = null
const appStore = useAppStore()
const statusStore = useStatusStore()
const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const conectarWebSocket = () => {
  const apiBase  = axios.defaults.baseURL || window.location.origin
  const urlObj   = new URL(apiBase, window.location.origin)
  const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:'

  const userStr = localStorage.getItem('user')
  let tokenParam = ''
  if (userStr) {
    const userObj = JSON.parse(userStr)
    if (userObj.token) tokenParam = `?token=${userObj.token}`
  }

  const wsUrl = `${wsProtocol}//${urlObj.host}/ws/notificaciones/${tokenParam}`
  socket = new WebSocket(wsUrl)

  // Conexion recuperada -> quitamos el banner y refrescamos: mientras estuvo
  // caida se perdieron eventos, asi que la pantalla quedo desactualizada.
  socket.onopen = () => {
    if (statusStore.active.includes('ws_down')) {
      statusStore.clear('ws_down')
      window.dispatchEvent(new CustomEvent('wss-reload-tables'))
    }
  }

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    wsNotificationService.handle(data, appStore, $swal)
  }

  window.enviarProgresoWebSocket = (certId, progress, status, code, attempts, task_type = 'qr', step = '', error_msg = '', is_cloud_error = false, offline_url = null) => {
    const user = JSON.parse(localStorage.getItem('user')) || {}
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        action: 'broadcast_progress',
        cert_id: certId, progress, status, code, attempts,
        username: user.username || 'unknown',
        task_type, step, error_msg, is_cloud_error, offline_url
      }))
    }
  }

  window.cancelarSheetWebSocket = (certId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'cancel_sheet', cert_id: certId }))
    }
  }

  window.confirmarExcelWebSocket = (certId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'broadcast_update_row', cert_id: certId }))
    }
  }

  // NUEVO PUENTE: Envía el aviso de actualización de fila directo al WebSocket
  window.notificarActualizacionFila = (certId, orderId = null, docId = null) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      let payload = { action: 'broadcast_update_row' };
      if (certId) payload.cert_id = certId;
      if (orderId) payload.order_id = orderId;
      if (docId) payload.doc_id = docId; // Agregamos el soporte para documentos
      socket.send(JSON.stringify(payload));
    }
  }

  // Conexion perdida -> banner persistente: el usuario sabe que NO le llegaran
  // los cambios en vivo. Se limpia solo al reconectar (onopen).
  socket.onclose = () => {
    statusStore.raise('ws_down')
    setTimeout(() => conectarWebSocket(), 5000)
  }

  socket.onerror = () => {}
}

onMounted(() => {
  conectarWebSocket()

  // Si veniamos de una recarga forzada por el admin, ahora si mostramos el aviso.
  flushQueuedToast()

  // Consultar métricas iniciales si el usuario tiene permiso de firmar (Permiso 10)
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const userObj = JSON.parse(userStr)
    const permissions = userObj.action_permissions || []
    const isAdmin = userObj.kind !== undefined && userObj.kind < 1
    
    if (isAdmin || permissions.includes(1001)) {
      CertificateDataService.getPendingSignaturesSummary()
        .then(response => {
          appStore.setPendingSignaturesCount(response.data.pending_signatures)
        })
        .catch(() => {}) // Fallo silencioso, no rompemos la UI si la red cae
    }
  }
})

onUnmounted(() => {
  if (socket) socket.close()
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
}
</style> <style>
/* 1. Bloqueamos el scroll a nivel de ventana para evitar que todo crezca */
html, body {
  margin: 0;
  height: 100vh;
  overflow: hidden !important; 
}

/* 2. El contenedor de la app ocupa exactamente la altura del monitor */
.v-application {
  height: 100vh !important;
}

/* 3. Solo el lado derecho (el contenido de la app) puede hacer scroll */
.v-main {
  height: 100vh !important;
  overflow-y: auto !important; 
}
</style>