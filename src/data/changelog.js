// Novedades que se muestran en Inicio. La primera entrada es la version actual.
// Al sacar una version nueva: agregar su bloque arriba y listo.
//
// Convencion de version: MAYOR.modulo.arreglosGrandes.arreglosChicos
export const CHANGELOG = [
  {
    version: '3.6.0.0',
    fecha: '2026-08-13',
    items: [
      { icon: 'mdi-bell-outline', text: 'Panel de notificaciones con filtros, avisos en vivo y aviso en la campana.' },
      { icon: 'mdi-shield-account', text: 'Permisos por accion: se puede delegar gestion de usuarios y roles sin ser administrador.' },
      { icon: 'mdi-tools', text: 'Mantenimiento (solo admin): cerrar sesiones, recargar pantallas y escanear expedientes.' },
      { icon: 'mdi-account-key', text: 'Login con mensajes claros y contrasena editable desde Mi Perfil.' },
      { icon: 'mdi-magnify', text: 'Los buscadores de equipos, clientes y laboratorios ahora buscan en todo, no solo en lo cargado.' },
    ],
  },
]
