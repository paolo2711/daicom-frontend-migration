import { defineStore } from 'pinia'

// Banners de estado: cosas que SIGUEN pasando (conexion caida, version nueva).
// El toast es para algo que ya paso y se va solo; esto se queda hasta que se
// resuelva. Para agregar uno nuevo: una entrada aqui + raise()/clear() donde toque.
export const STATUS_CATALOG = {
  ws_down: {
    level: 'warning',
    icon: 'mdi-lan-disconnect',
    text: 'Sin conexión en tiempo real. Los cambios de otros usuarios no se actualizarán solos.',
    hint: 'Reintentando…',
  },
  update_available: {
    level: 'info',
    icon: 'mdi-rocket-launch-outline',
    text: 'Hay una nueva versión disponible. Recarga para continuar con la última.',
    actionLabel: 'Recargar',
    action: () => window.location.reload(),
    // Si hay deploy nuevo, ESA es la causa de que se cayera la conexion: no tiene
    // sentido decirle "reintentando" - lo que necesita es recargar.
    supersedes: ['ws_down'],
  },
}

export const useStatusStore = defineStore('status', {
  state: () => ({
    active: [],   // ids de condiciones vigentes, en orden de aparición
  }),

  getters: {
    // Banners a renderizar. Una condicion puede ANULAR a otra (`supersedes`):
    // asi no mostramos avisos contradictorios (ej. "reintentando conexion"
    // cuando en realidad lo que paso es que hay una version nueva).
    banners: (state) => {
      const vigentes = state.active.filter((id) => STATUS_CATALOG[id])
      const anulados = new Set(
        vigentes.flatMap((id) => STATUS_CATALOG[id].supersedes || [])
      )
      return vigentes
        .filter((id) => !anulados.has(id))
        .map((id) => ({ id, ...STATUS_CATALOG[id] }))
    },
  },

  actions: {
    // La condicion empieza (idempotente: no duplica).
    raise(id) {
      if (STATUS_CATALOG[id] && !this.active.includes(id)) this.active.push(id)
    },
    // La condicion se resolvio.
    clear(id) {
      this.active = this.active.filter((x) => x !== id)
    },
  },
})
