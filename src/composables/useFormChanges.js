import { salirSinGuardar } from '@/composables/useUnsavedChanges'

// Si cambio algo en un formulario desde que se abrio: `datos` es lo que se compara.
export function useFormChanges (datos) {
  let inicial = ''
  const enTexto = () => JSON.stringify(datos())
  const empezar = () => { inicial = enTexto() }
  const comoSeAbrio = () => JSON.parse(inicial)
  const hayCambios = () => enTexto() !== inicial
  const puedeSalir = async () => !hayCambios() || salirSinGuardar()

  return { empezar, comoSeAbrio, hayCambios, puedeSalir }
}
