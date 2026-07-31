<template>
  <v-footer 
    :color="theme.global.current.value.dark ? 'transparent' : 'white'" 
    :class="['footerpart', theme.global.current.value.dark ? 'footer-dark' : 'footer-light']"
  >
    <v-col cols="12" class="d-flex justify-space-between align-center px-4">
      <span class="text-subtitle-2 text-medium-emphasis">© {{ new Date().getFullYear() }} — DAICOM S.A.C.</span>
      
      <span class="text-caption font-weight-bold text-grey">v{{ appVersion }}</span>
    </v-col>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import packageInfo from '../../../../package.json'
import { useAppStore } from '@/stores/appStore'

const theme = useTheme()
const appStore = useAppStore()
// La versión la manda el back por WS (fuente de verdad). Mientras no llega,
// cae a la del package.json.
const appVersion = computed(() => appStore.serverVersion || packageInfo.version)
</script>

<style lang="scss">
.v-application .footer-light {
  border-top: 1px solid rgba(0,0,0,0.1) !important;
}

.v-application .footer-dark {
  border-top: 1px solid rgba(255,255,255,0.1) !important;
}
</style>