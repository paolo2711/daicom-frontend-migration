// Novedades que se muestran en Inicio. La primera entrada es la mas nueva; las
// de abajo quedan para consultar.
//
// Modulo o arreglo grande: entrada nueva ARRIBA, y esa etiqueta ya no se toca.
// Arreglo chico: se le suma un item a la entrada de patches de arriba y se le
// actualiza el numero. Nunca una entrada por cada fix, si no queda una lista de
// tarjetas de un renglon que nadie despliega.
//
// APP_VERSION en api/settings.py sube en cada despliegue, sin excepcion.
//
// Convencion de version: MAYOR.modulo.arreglosGrandes.arreglosChicos
export const CHANGELOG = [
  {
    version: '3.7.0.1',
    fecha: '2026-08-21',
    items: [
      { icon: 'mdi-pencil-off', text: 'Al cancelar la edicion de un equipo ya no parpadean los campos en rojo mientras se cierra la ventana.' },
    ],
  },
  {
    version: '3.7.0.0',
    fecha: '2026-08-21',
    items: [
      { icon: 'mdi-calendar-alert', text: 'Inicio muestra los vencimientos de patrones e inventario, con lo mas urgente primero.' },
      { icon: 'mdi-radar', text: 'Patrones e inventario se revisan solos una vez por dia por el primer usuario al entrar a home. El boton de recargar los revisa al momento.' },
      { icon: 'mdi-chart-bar', text: 'Pulso del mes: las facturas por mes ahora son barras y el mes en curso se marca aparte, para no compararlo con meses cerrados.' },
      { icon: 'mdi-cash-multiple', text: 'Se ven los cobros sin comprobante del mes, que antes no aparecian en ningun lado.' },
      { icon: 'mdi-cash-off', text: 'Ordenes sin cargo: para equipo propio o cortesia. Ya no hay que crear una factura interna ni registrar un abono de cero.' },
      { icon: 'mdi-image-check', text: 'Las fotos de inventario y los PDF abren igual entrando por IP o por daicom.com, sin importar desde que direccion se conectan.' },
      { icon: 'mdi-message-badge-outline', text: 'Los avisos que aparecen abajo se pueden tocar para abrir el panel de notificaciones, y los que hay que resolver (sin conexion, version nueva) quedan fijos arriba hasta que se solucionen.' },
      { icon: 'mdi-layers-triple', text: 'Cuando se suben o firman varios certificados de una, sale un solo aviso agrupado en vez de uno por cada uno.' },
      { icon: 'mdi-form-textbox', text: 'Los formularios ya no quedan en rojo al guardar o cancelar.' },
      { icon: 'mdi-key-change', text: 'Cambiar la contrasena ahora avisa si salio bien o que falto.' },
      { icon: 'mdi-magnify', text: 'Los buscadores de equipos, clientes y laboratorios buscan en toda la base y no solo en lo que ya estaba cargado. En equipos ahora tambien encuentra por marca.' },
    ],
  },
  {
    version: '3.6.0.0',
    fecha: '2026-08-13',
    items: [
      { icon: 'mdi-bell-outline', text: 'Panel de notificaciones con filtros, avisos en vivo y aviso en la campana.' },
      { icon: 'mdi-shield-account', text: 'Permisos por accion: se puede delegar gestion de usuarios y roles sin ser administrador.' },
      { icon: 'mdi-format-list-checks', text: 'La pantalla de permisos quedo separada en dos: por un lado las pantallas a las que entra cada rol, por otro las acciones que puede hacer.' },
      { icon: 'mdi-tools', text: 'Mantenimiento (solo admin): cerrar sesiones, recargar pantallas y escanear expedientes.' },
      { icon: 'mdi-account-key', text: 'Login con mensajes claros cuando algo falla.' },
      { icon: 'mdi-account-edit', text: 'Mi Perfil rehecho: los datos se editan directo, sin apretar un boton para habilitarlos, y la contrasena quedo en su propia tarjeta.' },
      { icon: 'mdi-magnify-scan', text: 'Los filtros de las tablas ya no se pisan entre si cuando escribis rapido.' },
      { icon: 'mdi-view-list', text: 'Lista de inventario rehecha: cada fila muestra la miniatura del equipo, al lado del ID se ve si tiene expediente o no, y el chip de Alquilado se toca para abrir el historial de viajes.' },
      { icon: 'mdi-filter-variant', text: 'Inventario con filtros como Ordenes y Certificados: una pildora para los equipos sin certificado, otra para los que ya pasaron el año, y filtros avanzados.' },
      { icon: 'mdi-microsoft-excel', text: 'Se pueden subir los Excel con macros (.xlsm), no solo .xlsx.' },
      { icon: 'mdi-currency-usd', text: 'La moneda dejo de estar en la orden y pasa a cada factura, asi una misma orden puede tener facturas en soles y en dolares.' },
    ],
  },
]
