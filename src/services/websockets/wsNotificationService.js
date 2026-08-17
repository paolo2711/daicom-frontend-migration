// Router de los mensajes del WS. Aca no hay logica, solo reparte al handler que
// toca. Cada handler devuelve true si se quedo con el mensaje.
import { handleSystem } from './handlers/systemHandler'
import { handleNotification } from './handlers/notificationHandler'
import { handleReload } from './handlers/reloadHandler'
import { handleUpload } from './handlers/uploadHandler'

export default {
  handle(data, appStore) {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {}

    if (handleSystem(data, appStore, currentUser)) return
    if (handleNotification(data, appStore, currentUser)) return
    if (handleReload(data, appStore)) return
    if (handleUpload(data, appStore)) return
  },
}
