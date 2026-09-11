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
    version: '3.7.3.0',
    fecha: '2026-09-11',
    nuevo: [
      'Los certificados se pueden marcar como entregados, con la fecha en que se entregaron.',
      'Desde una orden se marcan todos sus equipos de una sola vez.',
      'Al firmar se puede elegir la fecha del sello, para los certificados viejos que se vuelven a generar.',
    ],
    cambio: [
      'El estado de un equipo dentro de la orden ahora muestra si tiene firma solicitada y si ya se entregó.',
      'En Certificados, el ícono de la nube lleva un check cuando el certificado ya se entregó.',
    ],
    arreglo: [
      'Solicitar firmas desde una orden ya no permite volver a pedir la firma de un equipo que ya estaba notificado.',
      'Con una orden desplegada, sus equipos ahora se actualizan solos cuando alguien los cambia.',
    ],
  },
  {
    version: '3.7.2.0',
    fecha: '2026-09-09',
    nuevo: [
      'Se puede adjuntar un certificado que ya esta en PDF: queda listo para firmar, sin pasar por el Excel.',
      'Las ordenes se anulan con sus equipos en un solo paso, y los certificados salen tambien de la nube.',
    ],
    cambio: [
      'Al adjuntar un archivo se elige si es el Excel para convertir o el PDF ya hecho.',
      'La ventana de carga en lote dice de que carpeta se toman los Excel y que hoja se imprime.',
    ],
  },
  {
    version: '3.7.1.7',
    fecha: '2026-09-09',
    cambio: [
      'Al editar una orden ya no se despliega sola la fila.',
    ],
    arreglo: [
      'La tabla de Ordenes se actualiza sola mucho mas rapido cuando alguien cambia algo.',
      'Los cambios en alquileres y en las OC ahora se ven en la pantalla de todos, no solo en la de quien los hizo.',
    ],
  },
  {
    version: '3.7.1.6',
    fecha: '2026-09-09',
    cambio: [
      'Al subir varios Excel a la vez, los que esperan turno lo dicen en el panel.',
    ],
    arreglo: [
      'Subir o firmar muchos certificados a la vez ya no vuelve lenta la plataforma.',
      'Los iconos de Certificados ya no se quedan atrasados cuando la subida termino bien.',
    ],
  },
  {
    version: '3.7.1.5',
    fecha: '2026-09-08',
    cambio: [
      'En los recuadros para subir el Excel, Enter confirma sin ir hasta el boton.',
    ],
    arreglo: [
      'Los Excel que piden contraseña ya se pueden subir; antes la carga se quedaba a medias sin avisar.',
      'Si falta la contraseña, la subida lo avisa enseguida en vez de intentarlo igual.',
    ],
  },
  {
    version: '3.7.1.2',
    fecha: '2026-09-04',
    nuevo: [
      'En Certificados se puede buscar por nombre del equipo, sin importar las tildes.',
    ],
  },
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
