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
    version: '3.7.5.0',
    fecha: '2026-09-24',
    nuevo: [
      'Se puede corregir el tipo de certificado de los equipos: toman el número de la serie correcta y el anterior queda a la vista junto al código.',
      'Los equipos de un alquiler pasan por reservado, en obra y devuelto: la salida se registra cuando el equipo sale y una devolución se puede deshacer.',
      'Al crear un alquiler la fecha de salida es opcional: sin ella el equipo queda reservado.',
      'Un equipo reservado se puede quitar de la orden, y anular un alquiler devuelve al inventario lo que no salió.',
    ],
    cambio: [
      'Crear una orden o agregarle equipos guarda todo o nada: si un equipo tiene un problema no se guarda ninguno, y su fila se marca en rojo con el motivo.',
      'En la lista de equipos de una orden nueva se corrigen el equipo, el laboratorio y el tipo en la misma fila, y junto a guardar se ve cuántos van de cada tipo.',
      'El número de cada certificado se muestra como estimado hasta guardar; si otro usuario tomó números mientras tanto, se avisa cuáles quedaron.',
      'En los alquileres, la salida, la devolución pactada y las observaciones se corrigen en la misma fila antes de guardar.',
      'Salida, devolución y estado se llaman igual en todas las pantallas de alquiler, e Inventario muestra "Reservado" para lo apartado que todavía no salió.',
      'Los errores al guardar dicen qué falta o qué pasó, en vez de "Fallo de conexión".',
      'El borrador de una orden de servicio recupera también el laboratorio y el tipo elegidos.',
      'Inventario hace un 75% menos de consultas al cargar, y abrir un alquiler trae un 60% menos de datos.',
    ],
    arreglo: [
      'Los certificados anulados ya no muestran un PDF que no existe y van al final de la tabla de la orden.',
      'El historial de viajes dice "No salió" en los alquileres anulados, en vez de "En obra".',
      'Elegir en un desplegable ya no hace una búsqueda de más al servidor.',
      'Los campos de equipo y laboratorio ya no aparecen como llenos al abrir Nuevo servicio o Nuevo certificado.',
    ],
  },
  {
    version: '3.7.4.4',
    fecha: '2026-09-23',
    nuevo: [
      'Se puede firmar el QR de los equipos de una orden desde su fila en Órdenes, junto a solicitar firmas y marcar entregados.',
    ],
    cambio: [
      'Cuando una orden tiene tres acciones o más, se agrupan en un menú para que el título de la fila se siga leyendo.',
      'Solicitar firmas desde Órdenes pide el mismo permiso que en Certificados.',
      'Al firmar por lote se ve qué certificados ya tienen la firma solicitada.',
      'La tarjeta de la orden en Certificados abre cada comprobante tocando su fila y muestra hasta tres por lista, con un acceso a la orden para ver el resto.',
      'La tarjeta de la orden solo avisa "Pendiente de pago" cuando ya hay una factura emitida.',
    ],
    arreglo: [
      'El total abonado de la tarjeta de la orden en certificados suma los soles y los dólares por separado.',
      'Los menús ya no se abren por debajo del panel de subidas.',
      'En modo oscuro se leen los títulos del modal de editar alquiler y se ven los bordes que antes desaparecían.',
      'Recargar la lista de Servicios vuelve a mostrar los equipos de la orden que estaba abierta.',
    ],
  },
  {
    version: '3.7.4.3',
    fecha: '2026-09-18',
    nuevo: [
      'El panel de facturas se puede filtrar por tipo: facturas o registros sin comprobante.',
    ],
    arreglo: [
      'Marcar una orden sin cargo, anularla o agregarle una factura ya no deja su registro interno de abonos suelto en el panel.',
      'Marcar varias órdenes a la vez ya no se detiene en la primera que falla: aplica las demás y avisa cuáles quedaron afuera y por qué.',
    ],
  },
  {
    version: '3.7.4.2',
    fecha: '2026-09-17',
    cambio: [
      'Subir un QR a la nube queda registrado en la actividad de Inicio, igual que quitarlo.',
      'El filtro de órdenes afectas a detracción dejó de mostrar las anuladas.',
    ],
    arreglo: [
      'Los contadores de las píldoras de Órdenes dejaron de incluir las órdenes sin cargo, así que el número coincide con lo que carga la lista.',
    ],
  },
  {
    version: '3.7.4.1',
    fecha: '2026-09-16',
    arreglo: [
      'Abrir el menú de una fila desde los tres puntos con otro menú abierto ya no lo cierra al instante.',
    ],
  },
  {
    version: '3.7.4.0',
    fecha: '2026-09-16',
    nuevo: [
      'Se pueden convertir Excels a PDF con membrete sin crear un certificado, desde el botón nuevo en Certificados.',
    ],
    cambio: [
      'El panel de subidas acompaña al Excel hasta que el PDF queda guardado, y el ícono de la fila lo sigue.',
      'El menú del clic derecho en Certificados tarda un 71% menos en abrirse.',
      'Los certificados no acreditados imprimen la hoja llamada IMPRESIÓN o IMPRIMIR, sin importar en qué lugar del libro esté.',
      'El visor ya no se cierra al aprobar: espera la confirmación, y si algo falla queda abierto para reintentar.',
      'Un PDF descartado queda a la vista en el panel hasta que se limpie, igual que uno cancelado.',
      'Se puede reintentar una conversión que falló, cuando el Excel salió de la carpeta del servidor.',
      'Los mensajes de error del panel de subidas entran en la fila; el detalle largo sale al pasar el mouse.',
    ],
    arreglo: [
      'Un certificado ya no puede quedar marcado como subido si el portal no llegó a publicarlo.',
      'Cancelar la subida de un QR la cancela de verdad; antes seguía subiendo por debajo.',
      'Cuando el PDF ya no está en el disco, Aprobar lo avisa y ofrece volver a convertir, en vez de abrir un visor vacío.',
      'En las acciones por lote, el botón para adjuntar de una fila bloqueada dejó de verse apagado.',
      'Los enlaces a los PDF abren igual entrando por la IP o por daicom.com.',
    ],
  },
  {
    version: '3.7.3.7',
    fecha: '2026-09-14',
    arreglo: [
      'Al editar una orden, cada equipo volvió a mostrar su dueño; desde la versión anterior decían todos "---".',
    ],
  },
  {
    version: '3.7.3.6',
    fecha: '2026-09-11',
    cambio: [
      'Editar un certificado dejó de pedir por separado los datos del cliente ya elegido: vienen con el certificado.',
    ],
  },
  {
    version: '3.7.3.5',
    fecha: '2026-09-11',
    cambio: [
      'Desplegar una orden pide entre un 63% y un 82% menos de datos: ahora trae solo sus equipos, y no la orden entera con sus facturas y cada certificado completo.',
      'Certificados carga un 21% más liviano: los datos que solo se ven al editar un certificado se piden al abrir el formulario.',
    ],
  },
  {
    version: '3.7.3.4',
    fecha: '2026-09-11',
    cambio: [
      'Cada orden de la lista dejó de arrastrar sus facturas completas: ahora lleva el número y si es fiscal, un 72% menos. Y las de servicio dejaron de recibir los datos de OC y valorizaciones, que son de alquiler. Entre las dos cosas la lista carga un 32% más liviana.',
    ],
  },
  {
    version: '3.7.3.2',
    fecha: '2026-09-11',
    arreglo: [
      'Al buscar en un desplegable, el cliente o equipo ya elegido aparecía entre los resultados aunque no coincidiera con lo buscado.',
    ],
  },
  {
    version: '3.7.3.1',
    fecha: '2026-09-11',
    cambio: [
      'La lista de Órdenes dejó de traer los equipos de cada orden, que ahora se piden al desplegarla: carga a la mitad de peso, y con filtros puestos hasta un 80% menos.',
      'Abrir el formulario de un certificado pasó de 6 pedidos al servidor a 1. Las listas de clientes, laboratorios y equipos se piden al abrir el desplegable, no al entrar a la pantalla, y quedan en memoria un minuto.',
      'Escribir en un desplegable hace un solo pedido al terminar de teclear, en vez de uno por letra.',
    ],
    arreglo: [
      'Catorce certificados se veían en naranja y decían "En Proceso" dentro de su orden sin tener el Excel cargado.',
    ],
  },
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
      'Se puede adjuntar un certificado que ya está en PDF: queda listo para firmar, sin pasar por el Excel.',
      'Las órdenes se anulan con sus equipos en un solo paso, y los certificados salen también de la nube.',
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
      'La tabla de Órdenes se actualiza sola casi 9 veces más rápido cuando alguien cambia algo: refrescar una fila pasó de 1.8 segundos a 0.2.',
      'Abrir el editor de una orden pide 11 veces menos datos.',
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
      'Subir o firmar muchos certificados a la vez ya no vuelve lenta la plataforma: una tanda de 200 avisos entre pantallas quedó en 4.',
      'Los íconos de Certificados ya no se quedan atrasados cuando la subida terminó bien.',
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
