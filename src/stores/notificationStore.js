import { defineStore } from 'pinia'
import NotificationDataService from '@/services/notifications/notificationDataService'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: [],
    unreadCount: 0,
    page: 1,
    total: 0,
    loading: false,
    panelOpen: false,
    pulse: 0,          // sube en cada notificación nueva → dispara el "campanazo"
  }),

  getters: {
    hasMore: (state) => state.items.length < state.total,
  },

  actions: {
    // Badge: se pide al iniciar y cuando llega un NEW_NOTIFICATION por WS (Fase B).
    async fetchUnread() {
      try {
        const r = await NotificationDataService.unreadCount()
        this.unreadCount = r.data.unread || 0
      } catch (e) { /* silencioso */ }
    },

    async fetchFirst() {
      this.page = 1
      this.items = []
      this.total = 0
      await this.fetchMore()
    },

    async fetchMore() {
      if (this.loading) return
      this.loading = true
      try {
        const r = await NotificationDataService.list(this.page)
        const results = r.data.results ?? r.data ?? []
        this.items.push(...results)
        this.total = r.data.count ?? this.items.length
        this.page++
      } catch (e) { /* silencioso */ } finally {
        this.loading = false
      }
    },

    open() {
      this.panelOpen = true
      this.fetchFirst()
    },
    close() { this.panelOpen = false },
    toggle() { this.panelOpen ? this.close() : this.open() },

    async markRead(n) {
      if (!n || n.read) return
      n.read = true
      if (this.unreadCount > 0) this.unreadCount--
      try { await NotificationDataService.markRead(n.id) } catch (e) { /* revert opcional */ }
    },

    async markAll() {
      if (this.unreadCount === 0) return
      this.items.forEach(n => { n.read = true })
      this.unreadCount = 0
      try { await NotificationDataService.markAll() } catch (e) { /* silencioso */ }
    },

    // WS  al llegar una notificación nueva.
    onNew() {
      this.pulse++            // campanazo instantáneo (local, sin consulta)
      this.fetchUnread()      // el número, en UNA sola consulta (como la píldora)
      if (this.panelOpen) this.fetchFirst()   // la lista solo si la estás mirando
    },

    // WS  RELOAD_NOTIFICATIONS: número + lista, pero la lista SOLO si el panel
    // está abierto (si está cerrado, es solo el número — como la píldora).
    async resync() {
      await this.fetchUnread()
      if (this.panelOpen) await this.fetchFirst()
    },
  },
})
