// Lectura de permisos del usuario logueado, en un solo lugar.
// El admin (kind<1) pasa siempre. `hasAction` mira los permisos de accion
// (banda 1000+) y `hasView` los de vista/pestana del sidebar.
export function usePermissions() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const views = JSON.parse(localStorage.getItem('permissions') || '[]')

  const isSuperAdmin = user.kind !== undefined && user.kind < 1
  const acciones = user.action_permissions || []

  return {
    user,
    isSuperAdmin,
    username: user.username || 'Usuario',
    roleName: user.kind_description || 'Sin rol',
    hasAction: (id) => isSuperAdmin || acciones.includes(id),
    hasView: (id) => isSuperAdmin || views.some((p) => p.id == id),
  }
}
