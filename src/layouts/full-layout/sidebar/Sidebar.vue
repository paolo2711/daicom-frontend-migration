<template>
  <v-navigation-drawer
    permanent
    expand-on-hover
    :color="appStore.sidebarColorEffective"
    :theme="appStore.darkStatus ? 'dark' : 'light'"
    :rail="isRail && !isMenuOpen"
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
          v-show="checkItemPermission(item.id)"
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
                    v-if="checkItemPermission(child.id)"
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'

import SidebarItems from '@/layouts/full-layout/sidebar/SidebarItems'
import BaseItem from '@/components/commonComponents/BaseItem.vue'
import BaseItemGroup from '@/components/commonComponents/BaseItemGroup.vue'

const appStore  = useAppStore()
const authStore = useAuthStore()
const theme     = useTheme()
const router    = useRouter()

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
    theme.global.name.value = isDark ? 'dark' : 'light'
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

const checkItemPermission = (id) => {
  if (hasTotalAccess.value) return true
  return getPermissions().some(p => p.id == id)
}

// Verifica si el usuario tiene acceso a alguna opción de administración
const hasAdminAccess = computed(() => {
  if (!adminGroup.value || !adminGroup.value.children) return false;
  return adminGroup.value.children.some(child => checkItemPermission(child.id));
});

const filterGroupPermission = (item) => {
  if (!item) return null
  const permSet = getPermissions()
  const copy = JSON.parse(JSON.stringify(item))
  if (!hasTotalAccess.value) {
    copy.children = copy.children.filter(
      child => child.locked === true || permSet.some(p => p.id == child.id)
    )
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
</style>