import { Toast } from '@/plugins/alerts'

// Abrir un PDF aparte: el mismo texto en cada boton que lo hace.
export const OTRA_PESTANA = 'Abrir en otra pestaña'

export const abrirEnOtraPestana = (url) => {
  if (url) window.open(url, '_blank', 'noopener')
}

// Uno guardado (su direccion) o uno elegido que todavia no se sube.
export function abrirPdf (pdf) {
  if (!(pdf instanceof File)) return abrirEnOtraPestana(pdf)
  const url = URL.createObjectURL(pdf)
  abrirEnOtraPestana(url)
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// Lo que dice una zona de PDF (PdfDropZone) cuando le sueltan otra cosa.
export const avisarSoloPdf = () => Toast.fire({ timer: 2500, icon: 'info', title: 'Suelta un archivo PDF.' })
