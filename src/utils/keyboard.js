// Enter dispara la accion principal del modal. Se saltea cuando el foco esta en
// algo que ya usa Enter para lo suyo: si no, Enter sobre Cancelar cancelaba y
// confirmaba al mismo tiempo.
const TIENE_ENTER_PROPIO = ['BUTTON', 'A', 'TEXTAREA']

const esSelectorDeArchivo = (el) => el?.tagName === 'INPUT' && el.type === 'file'

export function alPresionarEnter(accion) {
  return (evento) => {
    if (evento.repeat) return
    if (TIENE_ENTER_PROPIO.includes(evento.target?.tagName)) return
    if (esSelectorDeArchivo(evento.target)) return
    accion()
  }
}
