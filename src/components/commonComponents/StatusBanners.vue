<template>
  <teleport to="body">
    <div v-if="store.banners.length" class="status-stack">
      <transition-group name="status-slide">
        <div
          v-for="b in store.banners" :key="b.id"
          class="status-banner" :class="'ntone-' + toneForLevel(b.level)"
        >
          <v-icon size="18" class="status-ic">{{ b.icon }}</v-icon>
          <span class="status-text">
            {{ b.text }}
            <span v-if="b.hint" class="status-hint">{{ b.hint }}</span>
          </span>
          <v-btn
            v-if="b.actionLabel"
            size="small" variant="flat" color="primary"
            class="font-weight-bold ml-3 flex-shrink-0"
            @click="b.action && b.action()"
          >{{ b.actionLabel }}</v-btn>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
// Muestra las condiciones persistentes (statusStore). No bloquea la pantalla:
// el usuario puede seguir trabajando y decidir cuando actuar.
import { useStatusStore } from '@/stores/statusStore'
const store = useStatusStore()

// Los banners van por NIVEL (no por categoria), pero reusan el mismo cableado
// de tonos (`ntone-*`) que el panel y los toasts.
const toneForLevel = (level) =>
  level === 'critical' ? 'crit' : (level === 'warning' ? 'warn' : 'blue')
</script>

<style scoped>
/* Arriba al centro: es la unica zona libre - abajo-derecha la ocupa el
   UploadManager, abajo-centro la SelectionBar y arriba-derecha los toasts. */
.status-stack {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;              /* sobre el contenido, debajo de diálogos modales */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: min(560px, calc(100vw - 32px));
  pointer-events: none;       /* solo los banners capturan clics */
}
.status-banner {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 10px;
  /* Fondo SOLIDO (nada translucido) para que siempre se lea. */
  background: var(--notif-surface);
  color: var(--notif-on-surface);
  border-left: 0.25rem solid var(--ntone-fg);   /* el acento lo pone el tono */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}
.status-text { flex: 1; min-width: 0; color: var(--notif-on-surface); }
.status-hint { opacity: 0.7; margin-left: 6px; font-weight: 400; }
.status-ic { flex-shrink: 0; color: var(--ntone-fg); }

/* El tono (borde + icono) lo aporta la clase global `ntone-*`; el fondo se
   mantiene sólido para que siempre se lea. */

.status-slide-enter-active, .status-slide-leave-active { transition: all 0.25s ease; }
.status-slide-enter-from, .status-slide-leave-to { transform: translateY(-16px); opacity: 0; }
</style>
