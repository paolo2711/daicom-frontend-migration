// Novedades que se muestran en Inicio. La primera entrada es la mas nueva.
//
// Una entrada por despliegue, arriba, con su numero exacto. No se renombra ni
// se toca una entrada vieja: Novedades.vue agrupa por los tres primeros
// segmentos, asi que 3.7.1.0 a 3.7.1.5 se ven como un bloque, rotulado con la
// mas nueva del grupo (v3.7.1.5).
//
// Tres secciones, en este orden:
//
//   nuevo    algo que antes no se podia hacer
//   cambio   algo que ya existia y ahora funciona o se ve distinto
//   arreglo  algo que estaba mal
//
// La que no tiene items se omite. Una oracion por renglon, sin ejemplos: el
// detalle tecnico va a _docs/cambios.md.
//
// APP_VERSION en api/settings.py sube en cada despliegue, sin excepcion.
//
// Convencion de version: MAYOR.modulo.arreglosGrandes.arreglosChicos
export const CHANGELOG = [
  {
    version: '3.7.1.1',
    fecha: '2026-09-04',
    arreglo: [
      'Los iconos de Certificados vuelven a seguir al certificado y no al panel de subidas.',
    ],
  },
  {
    version: '3.7.1.0',
    fecha: '2026-09-02',
    nuevo: [
      'En Clientes se puede copiar la razon social, el documento y la direccion con un boton.',
      'La marca de posible duplicado de un cliente se saca desde la misma tabla.',
      'Al subir un Excel o un QR, la fila muestra que esta en proceso y avisa si fallo.',
      'Si una subida falla, desde la misma fila se sube otro Excel o se vuelve a generar el QR.',
    ],
    cambio: [
      'La tabla de Clientes muestra la direccion, que antes solo se veia abriendo el cliente.',
      'Al filtrar por cliente se ve el documento debajo del nombre.',
      'El boton de reintentar del panel de subidas ya no aparece solo al pasar el mouse.',
    ],
    arreglo: [
      'La direccion que trae SUNAT ya no pierde el interior, la oficina ni el piso.',
      'Buscar un cliente por RUC ya no crea uno repetido del que ya estaba con el nombre largo.',
      'Al buscar por documento el aviso dice si el cliente se creo, se actualizo, o conviene revisarlo.',
      'Al crear un cliente desde una orden o un certificado queda seleccionado solo.',
      'Despues de subir un QR el icono deja de quedarse unos segundos como si no se hubiera subido.',
    ],
  },
  {
    version: '3.7.0.1',
    fecha: '2026-08-21',
    arreglo: [
      'Al cancelar la edicion de un equipo ya no parpadean los campos en rojo mientras se cierra.',
    ],
  },
  {
    version: '3.7.0.0',
    fecha: '2026-08-21',
    nuevo: [
      'Inicio muestra los vencimientos de patrones e inventario, con lo mas urgente primero.',
      'Patrones e inventario se revisan solos una vez por dia, y el boton de recargar los revisa al momento.',
      'Se ven los cobros sin comprobante del mes, que antes no aparecian en ningun lado.',
      'Ordenes sin cargo, para equipo propio o cortesia, sin factura interna ni abono de cero.',
    ],
    cambio: [
      'Pulso del mes: las facturas por mes son barras y el mes en curso se marca aparte.',
      'Los avisos de abajo se tocan para abrir el panel, y los que hay que resolver quedan fijos.',
      'Cuando se suben o firman varios certificados de una, sale un solo aviso agrupado.',
      'Los buscadores de equipos, clientes y laboratorios buscan en toda la base, y en equipos tambien por marca.',
    ],
    arreglo: [
      'Las fotos de inventario y los PDF abren igual entrando por IP o por daicom.com.',
      'Los formularios ya no quedan en rojo al guardar o cancelar.',
      'Cambiar la contrasena ahora avisa si salio bien o que falto.',
    ],
  },
  {
    version: '3.6.0.0',
    fecha: '2026-08-13',
    nuevo: [
      'Panel de notificaciones con filtros, avisos en vivo y aviso en la campana.',
      'Permisos por accion: se puede delegar gestion de usuarios y roles sin ser administrador.',
      'Mantenimiento (solo admin): cerrar sesiones, recargar pantallas y escanear expedientes.',
      'Inventario con filtros como Ordenes y Certificados, incluidos los avanzados.',
      'Se pueden subir los Excel con macros (.xlsm), no solo .xlsx.',
    ],
    cambio: [
      'La pantalla de permisos quedo separada en dos: las pantallas por un lado, las acciones por otro.',
      'Login con mensajes claros cuando algo falla.',
      'Mi Perfil rehecho: los datos se editan directo y la contrasena quedo en su propia tarjeta.',
      'Lista de inventario rehecha: miniatura del equipo, indicador de expediente y acceso al historial de viajes.',
      'La moneda dejo de estar en la orden y pasa a cada factura, asi una orden puede tener soles y dolares.',
    ],
    arreglo: [
      'Los filtros de las tablas ya no se pisan entre si cuando escribis rapido.',
    ],
  },
]
