<template>
  <teleport to="body">
    <div class="evtk-stack">
      <transition-group name="evtk">
        <div
          v-for="t in store.toasts" :key="t.id"
          class="evtk-toast" :class="'ntone-' + t.tone"
          @click="abrir(t)"
          @mouseenter="store.pause(t.id)"
          @mouseleave="store.resume(t.id)"
        >
          <div class="evtk-row">
            <span class="evtk-ic">
              <v-icon size="20">{{ t.icon }}</v-icon>
            </span>
            <div class="evtk-body">
              <div class="evtk-title">{{ t.title }}</div>
              <div class="evtk-hint">Clic para ver el detalle</div>
            </div>
          </div>
          <!-- El :key hace que la barra se re-cree al reiniciarse el temporizador
               (acumulación / resume), para que animación y timer vayan sincronizados. -->
          <div class="evtk-bar">
            <span :key="t.restarts" :style="{ animationDuration: t.timeout + 'ms', animationPlayState: t.paused ? 'paused' : 'running' }"></span>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
// Pila de TOASTS DE EVENTO. A diferencia de SweetAlert (que muestra uno a la vez
// y los pisa), aqui se APILAN: si llegan avisos de distinto tipo, se ven todos.
import { useEventToastStore } from '@/stores/eventToastStore'
import { useNotificationStore } from '@/stores/notificationStore'

const store = useEventToastStore()

const abrir = (t) => {
  store.dismiss(t.id)
  try { useNotificationStore().open() } catch (e) { /* noop */ }
}
</script>

<style scoped>
/*  Ajustes del toast (todo en rem: escala con la fuente del usuario)
   Cambia estos 4 valores para afinar tamaño; el resto del CSS no se toca. */
.evtk-stack {
  --evtk-width: 23rem;        /* ancho uniforme (tope por viewport más abajo) */
  --evtk-pad: 0.9rem 1rem;    /* aire interno */
  --evtk-title: 0.95rem;      /* tamaño del título */
  --evtk-icon: 2.2rem;        /* diámetro del círculo del ícono */

  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;              /* igual que los toasts de SweetAlert */
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  pointer-events: none;
}
.evtk-toast {
  pointer-events: auto;
  cursor: pointer;
  /* Ancho FIJO para que la pila se vea pareja, pero nunca mayor que la pantalla
     (en móvil se ajusta solo). El texto largo envuelve en vez de estirar. */
  width: min(var(--evtk-width), calc(100vw - 2rem));
  background: var(--notif-surface);
  color: var(--notif-on-surface);
  border-radius: 0.75rem;
  box-shadow: 0 0.35rem 1.25rem rgba(0, 0, 0, 0.18);
  overflow: hidden;
  font-family: "Poppins", sans-serif;
}
.evtk-row { display: flex; align-items: center; gap: 0.7rem; padding: var(--evtk-pad); }
.evtk-ic {
  flex: 0 0 auto;
  width: var(--evtk-icon); height: var(--evtk-icon);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--ntone-bg);
  color: var(--ntone-fg);
}
.evtk-body { min-width: 0; }
.evtk-title { font-size: var(--evtk-title); font-weight: 600; line-height: 1.35; }
.evtk-hint { font-size: 0.75rem; opacity: 0.75; margin-top: 0.15rem; }

/* Barra de progreso del tiempo restante. Va tenida con el color de la CATEGORIA
   y atenuada: se nota sin pesar (antes usaba el color del texto = casi negro en
   claro y casi blanco en oscuro, demasiado fuerte). */
.evtk-bar { height: 0.2rem; background: rgba(128, 128, 128, 0.12); }
.evtk-bar span {
  display: block; height: 100%; width: 100%;
  background: var(--ntone-fg);
  opacity: 0.30;
  transform-origin: left;
  animation-name: evtk-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes evtk-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }

/* El tono lo aporta la clase global `ntone-*` (ver scss/notifications.scss),
   la misma que usa el panel: un solo cableado para toda la app. */

.evtk-enter-active, .evtk-leave-active { transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
.evtk-enter-from { transform: translateX(1.5rem); opacity: 0; }
.evtk-leave-to   { transform: translateX(1.5rem); opacity: 0; }
.evtk-move { transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
</style>
