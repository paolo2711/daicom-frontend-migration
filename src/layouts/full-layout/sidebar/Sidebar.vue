<template>
  <v-navigation-drawer
    permanent
    :expand-on-hover="!notifStore.panelOpen"
    :color="appStore.sidebarColorEffective"
    :theme="appStore.darkStatus ? 'dark' : 'light'"
    :rail="(isRail && !isMenuOpen) || notifStore.panelOpen"
    rail-width="70"
    id="main-sidebar"
    class="office-sidebar"
  >
    <v-list class="py-2" nav density="compact">
      <v-list-item>
        <template v-slot:prepend>
          <v-avatar rounded="0" size="32">
            <img v-if="appStore.darkStatus" src="@/assets/images/logo-light-icon.png" alt="Logo" style="width: 100%; object-fit: contain;" />
            <img v-else src="@/assets/images/logo-icon.png" alt="Logo" style="width: 100%; object-fit: contain;" />
          </v-avatar>
        </template>
        
        <v-list-item-title class="font-weight-bold text-subtitle-1 text-truncate ml-1">
          DAICOM S.A.C.
        </v-list-item-title>
        
        <template v-slot:append>
          <v-btn icon variant="text" size="small" @click.stop="isRail = !isRail" :title="isRail ? 'Fijar' : 'Soltar'">
            <v-icon>{{ isRail ? 'mdi-pin-outline' : 'mdi-pin-off-outline' }}</v-icon>
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list class="mt-1" nav density="compact">
      <!-- Campana de notificaciones (panel estilo IG) -->
      <v-list-item
        title="Notificaciones"
        rounded="lg"
        class="font-weight-medium"
        @click="notifStore.toggle()"
      >
        <template v-slot:prepend>
          <v-badge
            :model-value="notifStore.unreadCount > 0"
            :content="notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount"
            color="error" offset-x="2" offset-y="2"
          >
            <v-icon :class="{ 'bell-shake': bellShake }">mdi-bell-outline</v-icon>
          </v-badge>
        </template>
      </v-list-item>

      <template v-for="(item, i) in mainItems" :key="i">
        
        <v-row v-if="item.header" align="center">
          <v-col cols="12">
            <v-list-subheader class="d-block text-truncate text-uppercase font-weight-bold" style="font-size: 0.75rem;">
              {{ item.header }}
            </v-list-subheader>
          </v-col>
        </v-row>

        <BaseItemGroup
          v-else-if="item.children"
          :item="filterGroupPermission(item)"
        />

        <BaseItem
          v-else
          :item="item"
          v-show="checkItemPermission(item)"
        />
      </template>
    </v-list>

    <template #append>
      <v-list nav density="compact" class="px-2 pb-4">
        
        <v-menu v-model="isMenuOpen" location="end bottom" offset="10" transition="slide-x-transition">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-menu"
              title="Opciones"
              rounded="lg"
              class="font-weight-bold px-2"
            ></v-list-item>
          </template>

          <v-card min-width="260" class="rounded-xl elevation-6 border" :theme="appStore.darkStatus ? 'dark' : 'light'">
            <v-list density="compact" class="pa-2">
              
              <template v-if="adminGroup && hasAdminAccess">
                <v-list-subheader class="text-caption font-weight-bold text-uppercase">
                  Administración
                </v-list-subheader>
                
                <template v-for="child in adminGroup.children" :key="child.id">
                  <v-list-item
                    v-if="checkItemPermission(child)"
                    :prepend-icon="child.icon"
                    :title="child.title"
                    :to="child.to"
                    rounded="lg"
                    class="mb-1"
                  ></v-list-item>
                </template>
                
                <v-divider class="my-2"></v-divider>
              </template>

              <v-list-item
                prepend-icon="mdi-account-circle"
                :title="currentUser?.username || 'Usuario'"
                subtitle="Mis Datos Personales"
                to="/profile"
                rounded="lg"
                class="mb-1"
              ></v-list-item>

              <v-list-item
                :prepend-icon="appStore.darkStatus ? 'mdi-weather-night' : 'mdi-weather-sunny'"
                title="Cambiar Tema"
                @click="toggleTheme"
                rounded="lg"
                class="mb-1"
              ></v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item
                prepend-icon="mdi-power"
                title="Cerrar Sesión"
                base-color="error"
                @click="logOut"
                rounded="lg"
              ></v-list-item>

            </v-list>
          </v-card>
        </v-menu>

      </v-list>
    </template>
  </v-navigation-drawer>

  <notifications-panel />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

import SidebarItems from '@/layouts/full-layout/sidebar/SidebarItems'
import BaseItem from '@/components/commonComponents/BaseItem.vue'
import BaseItemGroup from '@/components/commonComponents/BaseItemGroup.vue'
import NotificationsPanel from '@/components/commonComponents/NotificationsPanel.vue'

const appStore  = useAppStore()
const authStore = useAuthStore()
const theme     = useTheme()
const router    = useRouter()
const notifStore = useNotificationStore()

// ── Campanazo: al llegar una notificación nueva, la campana se sacude y suena. ──
const bellShake = ref(false)

const sonarCampana = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)          // La6, un "ding" suave
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02)  // volumen bajo
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.36)
    osc.onended = () => { try { ctx.close() } catch (e) { /* noop */ } }
  } catch (e) { /* audio bloqueado hasta 1ra interacción: no pasa nada */ }
}

watch(() => notifStore.pulse, () => {
  bellShake.value = false
  requestAnimationFrame(() => { bellShake.value = true })
  setTimeout(() => { bellShake.value = false }, 900)
  sonarCampana()
})

onMounted(() => { notifStore.fetchUnread() })

const isRail = ref(localStorage.getItem('sidebarPinned') !== 'false')
const isMenuOpen = ref(false)
const items = ref(SidebarItems)

watch(isRail, (val) => {
  localStorage.setItem('sidebarPinned', val)
})

const mainItems = computed(() => items.value.filter(item => item.id !== 11))

const adminGroup = computed(() => items.value.find(item => item.id === 11))

watch(
  () => appStore.darkStatus,
  (isDark) => {
    theme.change(isDark ? 'dark' : 'light')
    if (isDark) {
      document.body.classList.add('v-theme--dark')
    } else {
      document.body.classList.remove('v-theme--dark')
    }
  },
  { immediate: true }
)

const currentUser   = computed(() => authStore.user)
const hasTotalAccess = computed(() => currentUser.value ? currentUser.value.kind < 1 : false)

const toggleTheme = () => {
  const isDark = !theme.global.current.value.dark
  appStore.setDarkStatus(isDark)
}

const logOut = async () => {
  await authStore.logout()
  appStore.uploadTasks = []
  router.replace('/login')
}

const getPermissions = () => JSON.parse(localStorage.getItem('permissions')) || []
const getActionPermissions = () => (JSON.parse(localStorage.getItem('user')) || {}).action_permissions || []

// Una entrada se muestra según su tipo:
//  - superAdmin: solo el super-admin (kind<1).
//  - action: por permiso de ACCIÓN (páginas de admin, una sola llave).
//  - resto: por permiso de VISTA (páginas operativas).
const checkItemPermission = (item) => {
  if (!item) return false
  if (hasTotalAccess.value) return true
  if (item.superAdmin) return false
  if (item.action) return getActionPermissions().includes(item.action)
  return getPermissions().some(p => p.id == item.id)
}

// Verifica si el usuario tiene acceso a alguna opción de administración
const hasAdminAccess = computed(() => {
  if (!adminGroup.value || !adminGroup.value.children) return false;
  return adminGroup.value.children.some(child => checkItemPermission(child));
});

const filterGroupPermission = (item) => {
  if (!item) return null
  const copy = JSON.parse(JSON.stringify(item))
  if (!hasTotalAccess.value) {
    copy.children = copy.children.filter(child => child.locked === true || checkItemPermission(child))
    if (copy.children.length === 0) return null
  }
  return copy
}
</script>

<style scoped>
.office-sidebar {
  height: 100vh !important;
  max-height: 100vh !important;
  position: fixed !important;
  top: 0;
  left: 0;
  z-index: 1000;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Campanazo: sacudida tipo "toque de campana" al llegar una notificación. */
.bell-shake {
  transform-origin: 50% 0;
  animation: bell-shake 0.9s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes bell-shake {
  0%   { transform: rotate(0); }
  10%  { transform: rotate(22deg); }
  20%  { transform: rotate(-18deg); }
  30%  { transform: rotate(15deg); }
  40%  { transform: rotate(-12deg); }
  50%  { transform: rotate(9deg); }
  60%  { transform: rotate(-6deg); }
  70%  { transform: rotate(4deg); }
  80%  { transform: rotate(-2deg); }
  100% { transform: rotate(0); }
}
@media (prefers-reduced-motion: reduce) {
  .bell-shake { animation: none; }
}
</style>