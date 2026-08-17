<template>
  <teleport to="body">
    <!-- Scrim: atenua el contenido y cierra al hacer clic afuera -->
    <transition name="notif-fade">
      <div v-if="store.panelOpen" class="notif-scrim" @click="store.close()"></div>
    </transition>

    <!-- Panel que se despliega desde detras del rail del sidebar (estilo IG) -->
    <transition name="notif-slide">
      <aside v-if="store.panelOpen" class="notif-panel" :class="{ 'notif-panel--dark': isDark }"
             :style="{ background: appStore.sidebarColorEffective }">
        <header class="notif-header">
          <span class="notif-title-main">Notificaciones</span>
          <v-btn icon variant="text" size="small" @click="store.close()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </header>

        <!-- Pildoras de filtro (estilo IG) -->
        <div class="notif-pills">
          <button
            v-for="p in pildorasVisibles" :key="p.value"
            class="notif-pill" :class="{ 'notif-pill--active': store.filter === p.value }"
            @click="store.setFilter(p.value)"
          >{{ p.label }}</button>
        </div>

        <div v-if="store.unreadCount > 0" class="notif-actions">
          <button class="notif-markall" @click="store.markAll()">Marcar todo como leído</button>
        </div>

        <div class="notif-list" ref="listEl" @scroll="onScroll">
          <template v-for="grupo in grupos" :key="grupo.label">
            <div v-if="grupo.items.length" class="notif-group">{{ grupo.label }}</div>
            <button
              v-for="n in grupo.items" :key="n.id"
              class="notif-item" :class="{ 'notif-item--unread': !n.read }"
              @click="abrir(n)"
            >
              <span class="notif-avatar" :class="'ntone-' + toneForCategory(n.category, n.level)">
                <v-icon size="20">{{ iconoCategoria(n.category) }}</v-icon>
              </span>
              <div class="notif-text">
                <div class="notif-title">{{ n.title }}</div>
                <div class="notif-sub"><template v-if="n.body">{{ n.body }} · </template>{{ tiempoRelativo(n.created_at) }}</div>
              </div>
              <span v-if="!n.read" class="notif-dot" aria-label="No leída"></span>
            </button>
          </template>

          <div v-if="store.loading" class="notif-state">
            <v-progress-circular indeterminate size="24" width="2" color="primary" />
          </div>
          <div v-else-if="store.items.length === 0" class="notif-state notif-empty">
            <v-icon size="44" color="grey">mdi-bell-outline</v-icon>
            <div class="mt-2">No tienes notificaciones</div>
          </div>
        </div>
      </aside>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAppStore } from '@/stores/appStore'
import { iconForCategory as iconoCategoria, toneForCategory } from '@/services/notifications/categoryIcons'

const store = useNotificationStore()
const appStore = useAppStore()
const theme = useTheme()
const router = useRouter()
const isDark = computed(() => theme.global.current.value.dark)
const listEl = ref(null)

// (Los iconos de categoria viven en services/notifications/categoryIcons.js,
//  compartidos con el toast de evento -> misma familia visual.)

// Pildoras de filtro. 'Todas' y 'No leidos' siempre; las de categoria solo se
// muestran si el usuario realmente recibe ese grupo (store.availableGroups).
const PILDORAS = [
  { value: 'todas',        label: 'Todas',        always: true },
  { value: 'no_leidos',    label: 'No leídos',    always: true },
  { value: 'certificados', label: 'Certificados', grupo: 'certificados' },
  { value: 'firmas',       label: 'Firmas',       grupo: 'firmas' },
  { value: 'vencimientos', label: 'Vencimientos', grupo: 'vencimientos' },
]
const pildorasVisibles = computed(() =>
  PILDORAS.filter(p => p.always || store.availableGroups.includes(p.grupo))
)

// Agrupacion como IG: Hoy / Ayer / Este mes / Anteriores
const grupos = computed(() => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)
  const mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const g = { hoy: [], ayer: [], mes: [], antes: [] }
  for (const n of store.items) {
    const f = new Date(n.created_at)
    if (f >= hoy) g.hoy.push(n)
    else if (f >= ayer) g.ayer.push(n)
    else if (f >= mes) g.mes.push(n)
    else g.antes.push(n)
  }
  return [
    { label: 'Hoy', items: g.hoy },
    { label: 'Ayer', items: g.ayer },
    { label: 'Este mes', items: g.mes },
    { label: 'Anteriores', items: g.antes },
  ]
})

const tiempoRelativo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'ahora'
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`
  const d = Math.floor(h / 24); if (d === 1) return 'ayer'
  if (d < 30) return `${d} d`
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

const onScroll = () => {
  const el = listEl.value
  if (!el || store.loading || !store.hasMore) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) store.fetchMore()
}

// Si lo cargado NO desborda el panel, el scroll nunca dispara y las notificaciones
// viejas quedarian inalcanzables. Aqui seguimos cargando hasta que se pueda hacer
// scroll (o ya no queden mas), asi SIEMPRE se puede llegar a todas.
watch(() => store.items.length, async () => {
  await nextTick()
  const el = listEl.value
  if (el && store.hasMore && !store.loading && el.scrollHeight <= el.clientHeight + 4) {
    store.fetchMore()
  }
})

// Rutas por OBJETO (target_type + target_id): llevan al item puntual.
const RUTAS = {
  certificate: (id) => ({ path: '/certificates', query: { correlativo: id } }),
  inventory_item: (id) => ({ path: '/inventario', query: { buscar: id } }),
  order: () => ({ path: '/orders/servicios' }),
}
// Rutas por CATEGORIA (no dependen de un objeto): ej. "firma solicitada" -> la
// pestana de certificados con el filtro de pendientes de firma ya aplicado.
const RUTAS_CATEGORIA = {
  firma_solicitada: () => ({ path: '/certificates', query: { firma_pendiente: 1 } }),
}
const abrir = (n) => {
  store.markRead(n)
  const rutaCat = RUTAS_CATEGORIA[n.category]
  if (rutaCat) {
    store.close()
    router.push(rutaCat()).catch(() => {})
    return
  }
  const ruta = RUTAS[n.target_type]
  if (ruta && n.target_id) {
    store.close()
    router.push(ruta(n.target_id)).catch(() => {})
  }
}
</script>

<style scoped>
.notif-scrim {
  position: fixed;
  inset: 0;
  z-index: 900;               /* por debajo del sidebar (1000) */
  background: rgba(0, 0, 0, 0.28);
}
.notif-panel {
  position: fixed;
  top: 0;
  left: 70px;                 /* nace a la derecha del rail */
  bottom: 0;
  width: min(397px, calc(100vw - 90px));
  z-index: 950;              /* debajo del rail: parece salir de él */
  /* El fondo viene inline = mismo color del sidebar (se mezclan). */
  box-shadow: 6px 0 24px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.notif-panel--dark {
  box-shadow: 6px 0 28px rgba(0, 0, 0, 0.45);
}
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 12px 8px 22px;
}
.notif-title-main {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.notif-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 6px;
}
.notif-markall {
  background: none;
  border: none;
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.notif-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 16px;
}
.notif-group {
  font-size: 0.9rem;
  font-weight: 700;
  padding: 14px 22px 6px;
}
/* Pildoras de filtro: hacen wrap a otra linea si no caben (ninguna se oculta) */
.notif-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 16px 10px 22px;
}
.notif-pill {
  flex: 0 0 auto;
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
  background: rgba(128, 128, 128, 0.14);
  transition: background-color 0.12s ease, color 0.12s ease;
}
.notif-pill:hover { background: rgba(128, 128, 128, 0.22); }
.notif-pill--active {
  background: rgb(var(--v-theme-primary));
  color: #fff;
}

.notif-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 11px 20px 11px 22px;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.12s ease;
}
.notif-item:hover { background: rgba(128, 128, 128, 0.10); }
.notif-item--unread { background: rgba(var(--v-theme-primary), 0.07); }

/* Icono en circulo suave (fondo tintado + icono del color), no un circulo solido feo */
.notif-avatar {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ntone-bg);
  color: var(--ntone-fg);
}
/* El tono lo aporta la clase global `ntone-*` (ver scss/notifications.scss). */

.notif-text {
  min-width: 0;
  flex: 1;
  line-height: 1.35;
}
.notif-title {
  font-size: 0.9rem;
  font-weight: 700;
}
.notif-sub {
  font-size: 0.84rem;
  color: rgba(128, 128, 128, 0.95);
  margin-top: 1px;
}

/* Punto de "no leida" (estilo IG) */
.notif-dot {
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  margin-top: 8px;
}
.notif-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 48px 0; opacity: 0.65;
}

/* Se despliega deslizandose suave desde detras del rail (ease-out tipo IG) */
.notif-slide-enter-active { transition: transform 0.34s cubic-bezier(0.16, 1, 0.3, 1); }
.notif-slide-leave-active { transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1); }
.notif-slide-enter-from, .notif-slide-leave-to { transform: translateX(-100%); }
.notif-fade-enter-active, .notif-fade-leave-active { transition: opacity 0.3s ease; }
.notif-fade-enter-from, .notif-fade-leave-to { opacity: 0; }
</style>
