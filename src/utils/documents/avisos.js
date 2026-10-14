import { Toast } from '@/plugins/alerts'

// Lo que respondio el back al guardar o anular. `warning` trae el motivo si la
// copia del disco E no se actualizo: el documento se guardo igual.
export const avisarHecho = (titulo, { warning } = {}) => Toast.fire(warning
  ? { timer: 6000, icon: 'warning', title: titulo, text: warning }
  : { timer: 2500, icon: 'success', title: titulo })
