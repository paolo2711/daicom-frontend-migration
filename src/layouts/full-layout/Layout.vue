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
import CertificateDataService from '@/services/certificates/certificateDataService.js'

let socket = null
const appStore = useAppStore()
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

  socket.onopen = () => {}

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    wsNotificationService.handle(data, appStore, $swal)
  }

  window.enviarProgresoWebSocket = (certId, progress, status, code, attempts, task_type = 'qr') => {
    const user = JSON.parse(localStorage.getItem('user')) || {}
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        action: 'broadcast_progress',
        cert_id: certId, progress, status, code, attempts,
        username: user.username || 'unknown',
        task_type,
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
  window.notificarActualizacionFila = (certId, orderId = null) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      let payload = { action: 'broadcast_update_row' };
      if (certId) payload.cert_id = certId;
      if (orderId) payload.order_id = orderId;
      socket.send(JSON.stringify(payload));
    }
  }

  window.enviarNotificacionGlobal = (sender, msg_type, title, body) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'GLOBAL_NOTIFY', sender, msg_type, title, body }))
    }
  }

  socket.onclose = () => {
    setTimeout(() => conectarWebSocket(), 5000)
  }

  socket.onerror = () => {}
}

onMounted(() => {
  conectarWebSocket()
  
  // Consultar métricas iniciales si el usuario tiene permiso de firmar (Permiso 10)
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const userObj = JSON.parse(userStr)
    const permissions = userObj.action_permissions || []
    const isAdmin = userObj.kind !== undefined && userObj.kind < 1
    
    if (isAdmin || permissions.includes(10)) {
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