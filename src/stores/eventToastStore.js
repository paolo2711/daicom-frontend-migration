import { defineStore } from 'pinia'
import { iconForCategory, toneForCategory } from '@/services/notifications/categoryIcons'
import { TOAST_CATALOG } from '@/services/notifications/eventToasts'

// Pila de los toasts de evento. Sigue agrupando los del mismo tipo en uno que
// crece ("8 firmados"), pero ahora si son de tipos distintos se apilan.
const TIMEOUT = 4000       // ms visibles
const LOTE_MS = 6000       // gap máximo para considerar el mismo lote

let seq = 0

export const useEventToastStore = defineStore('eventToasts', {
  state: () => ({
    toasts: [],   // { id, category, tone, icon, title, count, timeout, paused, ref, level, _t, _last }
  }),

  actions: {
    push({ category, level, ref }) {
      const now = Date.now()
      const entry = TOAST_CATALOG[category] || {}
      // ¿Hay uno vivo de la misma categoria? -> lo hacemos crecer.
      const existente = this.toasts.find(t => t.category === category && (now - t._last) <= LOTE_MS)

      if (existente) {
        existente.count += 1
        existente._last = now
        existente.title = entry.many ? entry.many(existente.count) : `${existente.count} notificaciones`
        existente.level = level === 'critical' ? 'critical'
          : (level === 'warning' && existente.level !== 'critical' ? 'warning' : existente.level)
        existente.tone = toneForCategory(category, existente.level)
        this._arm(existente)   // reinicia su tiempo
        return
      }

      const t = {
        id: ++seq,
        category, level, ref,
        count: 1,
        tone: toneForCategory(category, level),
        icon: iconForCategory(category),
        title: entry.single ? entry.single(ref) : 'Nueva notificación',
        timeout: TIMEOUT,
        paused: false,
        // Sube en cada reinicio del temporizador: sirve de `key` para re-crear la
        // barra de progreso, asi la animacion arranca de cero junto con el timer
        // (si no, la barra terminaba antes y el toast se quedaba colgado).
        restarts: 0,
        _last: now,
        _t: null,
      }
      this.toasts.push(t)
      this._arm(t)
    },

    // Reinicia el tiempo del toast Y su barra (restarts cambia el key -> la
     // animacion vuelve a empezar). Timer y barra siempre van a la par.
    _arm(t) {
      clearTimeout(t._t)
      t.restarts += 1
      t._t = setTimeout(() => this.dismiss(t.id), t.timeout)
    },

    pause(id) {
      const t = this.toasts.find(x => x.id === id)
      if (t) { clearTimeout(t._t); t.paused = true }
    },

    resume(id) {
      const t = this.toasts.find(x => x.id === id)
      if (t) { t.paused = false; this._arm(t) }
    },

    dismiss(id) {
      const t = this.toasts.find(x => x.id === id)
      if (t) clearTimeout(t._t)
      this.toasts = this.toasts.filter(x => x.id !== id)
    },
  },
})
