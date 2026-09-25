import { defineStore } from 'pinia';

const FIN_DE_SUBIDA = ['success', 'warning'];

// Una tarea que recien termina todavia no fue confirmada por el server: hasta que
// llegue la fila, es ella la que manda sobre el icono de la tabla.
// Ver composables/useUploadState.js.
// `terminadaEn` sirve para saber si una carga de la tabla pudo haberla visto:
// la que salio antes vuelve sin el resultado y no puede confirmarla.
function marcarSinConfirmar(cambios, anterior) {
  const terminaAhora = FIN_DE_SUBIDA.includes(cambios.status)
    && !FIN_DE_SUBIDA.includes(anterior?.status);
  return terminaAhora
    ? { ...cambios, confirmada: false, terminadaEn: Date.now() }
    : cambios;
}

export const useAppStore = defineStore('app', {
  state: () => ({
    // null → Vuetify 3 lo abre automáticamente en desktop y lo cierra en mobile
    sidebarDrawer: true ,
    sidebarColor: 'white',
    sidebarBg: '',
    // Persiste la preferencia de dark entre sesiones
    darkStatus: localStorage.getItem('dark') !== 'false',

    deleteConfirmOptions: {
      showLoaderOnConfirm: true,
      title: "¿Está seguro de eliminar?",
      text: "Esta acción es irreversible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    },
    successDeletedOptions: {
      toast: true,
      position: 'top-end',
      timerProgressBar: true,
      title: "Eliminado correctamente",
      icon: "success",
      showConfirmButton: false,
      timer: 1800,
    },
    reviewConfirmOptions: {
      showLoaderOnConfirm: true,
      title: "¿Sacarle la marca de posible duplicado?",
      text: "Deja de aparecer en el filtro. Para volver a marcarlo hay que revisar la base.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, ya lo revisé",
      cancelButtonText: "No, cancelar",
    },
    successReviewedOptions: {
      toast: true,
      position: 'top-end',
      timerProgressBar: true,
      title: "Marcado como revisado",
      icon: "success",
      showConfirmButton: false,
      timer: 1800,
    },
    errorDeleteOptions: {
      title: "No se pudo eliminar",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: "OK",
    },
    networkErrorOptions: {
      title: "Error de conexión",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: 'OK',
    },
    successSavedOptions: {
      toast: true,
      position: 'top-end',
      timerProgressBar: true,
      title: "Guardado correctamente",
      icon: "success",
      showConfirmButton: false,
      timer: 1800,
    },
    errorSavedOptions: {
      icon: 'warning',
      title: 'No se pudo guardar',
      text: '',
      showConfirmButton: true,
      confirmButtonText: 'OK',
    },
    toastBase: {
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true
    },
    toastGuardando: {
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      icon: 'info',
      title: 'Procesando...'
    },
    toastGuardadoExito: {
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      icon: 'success',
      title: 'Guardado correctamente'
    },
    toastErrorRed: {
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      icon: 'error',
      title: 'Error de red o servidor'
    },

    // ¿Hay una barra de seleccion activa? La enciende SelectionBar. La usa el
    // Upload Manager para no solaparse con ella en ventanas angostas.
    selectionActive: false,

    // Aviso de nueva versión (lo enciende el WS).
    updateAvailable: false,
    serverVersion: null, // la que reporta el back, se ve en el footer

    uploadTasks: JSON.parse(localStorage.getItem('daicom_uploads')) || [],
    pendingSignaturesCount: 0,
    pendingPaymentsServiceCount: 0,
    pendingInvoicesServiceCount: 0,
    pendingPaymentsRentalCount: 0,
    pendingInvoicesRentalCount: 0,
    afectasDetraccionServiceCount: 0,
    afectasDetraccionRentalCount: 0,
  }),

  actions: {
    setSidebarDrawer(payload) {
      this.sidebarDrawer = payload;
    },
    setSidebarColor(payload) {
      this.sidebarColor = payload;
    },
    setDarkStatus(payload) {
      this.darkStatus = payload;
      localStorage.setItem('dark', payload);
    },

    addUploadTask(task) {
      this.uploadTasks.push(marcarSinConfirmar(task, null));
      this.saveUploads();
    },
    updateUploadTask(id, type, updates) {
      const index = this.uploadTasks.findIndex(
        t => String(t.id) === String(id) && t.type === type
      );
      if (index !== -1) {
        const anterior = this.uploadTasks[index];
        this.uploadTasks[index] = { ...anterior, ...marcarSinConfirmar(updates, anterior) };
        this.saveUploads();
      }
    },
    // La tarea deja de mandar sobre la fila una vez que llego el dato del server.
    confirmarUploadTask(id, type) {
      const t = this.uploadTasks.find(
        x => String(x.id) === String(id) && x.type === type
      );
      if (t && !t.confirmada) {
        t.confirmada = true;
        this.saveUploads();
      }
    },
    removeUploadTask(id, type) {
      this.uploadTasks = this.uploadTasks.filter(
        t => !(String(t.id) === String(id) && t.type === type)
      );
      this.saveUploads();
    },
    clearUploadTasks() {
      this.uploadTasks = [];
      this.saveUploads();
    },
    saveUploads() {
      localStorage.setItem('daicom_uploads', JSON.stringify(this.uploadTasks));
    },
    setPendingSignaturesCount(count) {
      this.pendingSignaturesCount = count;
    },
    setPendingPaymentsServiceCount(count) { this.pendingPaymentsServiceCount = count; },
    setPendingInvoicesServiceCount(count) { this.pendingInvoicesServiceCount = count; },
    setPendingPaymentsRentalCount(count) { this.pendingPaymentsRentalCount = count; },
    setPendingInvoicesRentalCount(count) { this.pendingInvoicesRentalCount = count; },
    setAfectasDetraccionServiceCount(count) { this.afectasDetraccionServiceCount = count; },
    setAfectasDetraccionRentalCount(count) { this.afectasDetraccionRentalCount = count; }
  },
  getters: {
    sidebarColorEffective: (state) => state.darkStatus ? '#1b2028' : state.sidebarColor,
  }
});