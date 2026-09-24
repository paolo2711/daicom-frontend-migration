import { getCurrentInstance } from 'vue'
import { Toast } from '@/plugins/alerts'
import { TIPOS_CERTIFICADO } from '@/utils/certificates/tipos'

const numeroDe = (codigo) => Number(String(codigo).split('-').pop())
const conCeros = (n) => String(n).padStart(8, '0')
const capitalizar = (texto) => texto.charAt(0) + texto.slice(1).toLowerCase()

// 1294, 1295, 1297 -> "00001294–00001295, 00001297"
function tramos(numeros) {
  const partes = []
  for (const n of [...numeros].sort((a, b) => a - b)) {
    const ultima = partes[partes.length - 1]
    if (ultima && n === ultima[1] + 1) ultima[1] = n
    else partes.push([n, n])
  }
  return partes.map(([desde, hasta]) => desde === hasta ? conCeros(desde) : `${conCeros(desde)}–${conCeros(hasta)}`).join(', ')
}

function numerosPorTipo(filas, codigos) {
  return TIPOS_CERTIFICADO
    .map(tipo => {
      const numeros = filas
        .map((fila, i) => fila.modo === 'nuevo' && Number(fila.certificate_type) === tipo.value ? numeroDe(codigos[i]) : null)
        .filter(n => n !== null)
      return numeros.length ? `${capitalizar(tipo.title)} ${tramos(numeros)}` : null
    })
    .filter(Boolean)
}

// Si los numeros que dio el servidor no son los que el modal estimo (otro los
// tomo mientras tanto), se dice cuales quedaron en un aviso que no se cierra solo.
export function useSavedNumbers() {
  const $swal = getCurrentInstance().appContext.config.globalProperties.$swal

  return function avisar(titulo, filas, codigos = [], estimados = []) {
    const cambiaron = filas.some((fila, i) =>
      fila.modo === 'nuevo' && estimados[i] != null && numeroDe(codigos[i]) !== estimados[i])

    if (!cambiaron) {
      Toast.fire({ icon: 'success', title: titulo })
      return
    }
    $swal.fire({
      icon: 'info',
      title: 'Los números cambiaron',
      html: `${titulo}. Otro usuario tomó números mientras cargabas; quedaron:<br><br>`
        + `<b>${numerosPorTipo(filas, codigos).join('<br>')}</b>`,
    })
  }
}
