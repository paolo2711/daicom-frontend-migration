<template>
  <v-footer 
    :color="theme.global.current.value.dark ? 'transparent' : 'white'" 
    :class="['footerpart', theme.global.current.value.dark ? 'footer-dark' : 'footer-light']"
  >
    <v-col cols="12">
      <span>© {{ new Date().getFullYear() }} — Powered by Beryllium</span>
    </v-col>
  </v-footer>
</template>

<script setup>
import { useTheme } from 'vuetify'

const theme = useTheme()
</script>

<style lang="scss">
.v-application .footer-light {
  border-top: 1px solid rgba(0,0,0,0.1) !important;
}

.v-application .footer-dark {
  border-top: 1px solid rgba(255,255,255,0.1) !important;
}
</style>