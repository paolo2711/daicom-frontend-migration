import { Toast } from '@/plugins/alerts'

// Copia texto al portapapeles. navigator.clipboard solo existe en contexto
// seguro (HTTPS/localhost); en HTTP caemos al textarea + execCommand.
function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto)
  }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea')
      ta.value = texto
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      ta.style.top = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      ok ? resolve() : reject(new Error('execCommand copy failed'))
    } catch (e) {
      reject(e)
    }
  })
}

// Unico punto de copiado de la app: copia y confirma con el mismo toast en
// todos lados. Si cada vista arma su propia confirmacion terminan conviviendo
// dos formas distintas de avisar lo mismo.
export function copiarConAviso(texto, titulo = 'Copiado') {
  return copiarAlPortapapeles(texto)
    .then(() => {
      Toast.fire({ timer: 1800, icon: 'success', title: titulo })
    })
    .catch(() => {
      Toast.fire({ timer: 2200, icon: 'error', title: 'No se pudo copiar' })
    })
}
