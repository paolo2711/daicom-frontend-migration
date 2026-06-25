import { defineStore } from 'pinia';

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
      title: "Eliminado correctamente",
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
      this.uploadTasks.push(task);
      this.saveUploads();
    },
    updateUploadTask(id, type, updates) {
      const index = this.uploadTasks.findIndex(
        t => String(t.id) === String(id) && t.type === type
      );
      if (index !== -1) {
        this.uploadTasks[index] = { ...this.uploadTasks[index], ...updates };
        this.saveUploads();
      }
    },
    removeUploadTask(id, type) {
      this.uploadTasks = this.uploadTasks.filter(
        t => !(String(t.id) === String(id) && t.type === type)
      );
      this.saveUploads();
    },
    clearFinishedTasks() {
      this.uploadTasks = this.uploadTasks.filter(
        t => ['generating', 'uploading', 'retrying', 'error', 'canceled'].includes(t.status)
      );
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