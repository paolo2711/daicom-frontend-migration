// Abrir un PDF aparte: el mismo texto en cada boton que lo hace.
export const OTRA_PESTANA = 'Abrir en otra pestaña'

export const abrirEnOtraPestana = (url) => {
  if (url) window.open(url, '_blank', 'noopener')
}
