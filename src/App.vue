<template>
  <v-app id="materialpro" :class="`${!display.smAndDown.value ? 'full-sidebar' : 'mini-sidebar'}`">
      <router-view />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTheme, useDisplay } from 'vuetify'

const theme = useTheme()
const display = useDisplay()

onMounted(() => {
  const VERSION_CSS = 'v3_dark_mode_update'
  const yaActualizado = localStorage.getItem(VERSION_CSS)

  if (!yaActualizado) {
    localStorage.setItem('dark', 'true')
    theme.global.name.value = 'dark'
    localStorage.setItem(VERSION_CSS, 'true')
    console.log("Sistema: Se ha forzado la actualización de CSS y Modo Oscuro.")
  } else {
    const isDark = localStorage.getItem('dark') !== 'false'
    theme.global.name.value = isDark ? 'dark' : 'light'
  }
})
</script>
<style>
/* Layout fijo: el v-app ocupa toda la ventana, v-main hace scroll */
body {
  overflow: hidden;            /* evita que el body tenga scroll */
}
.v-application {
  min-height: 100vh;
}
.v-application--wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.v-main {
  flex: 1 1 auto;
  overflow-y: auto;            /* solo el contenido principal hace scroll */
}
</style>