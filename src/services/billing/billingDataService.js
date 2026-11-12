import axios from "axios";
import authHeader from "@/services/auth-header";
import { archivoDe } from "@/utils/files";

class BillingDataService {
  listDispatchGuides(params) {
    return axios.get("billing/dispatch-guides/", { params, headers: authHeader() });
  }
  getDispatchGuide(id) {
    return axios.get(`billing/dispatch-guides/${id}/`, { headers: authHeader() });
  }
  // Lo que el formulario abre lleno, desde las ordenes marcadas o en blanco, con los motivos de SUNAT.
  newDispatchGuide(ordenIds = []) {
    const params = ordenIds.length ? { ordenes: ordenIds.join(',') } : {};
    return axios.get("billing/dispatch-guides/nueva/", { params, headers: authHeader() });
  }
  // El PDF sin emitirla: no toma numero ni la manda a SUNAT.
  previewDispatchGuide(data) {
    const opciones = { headers: authHeader(), responseType: "blob" };
    return archivoDe(axios.post("billing/dispatch-guides/vista-previa/", data, opciones));
  }
  // `ya_en_sol`: si la baja ya se dio en SOL; si no, queda pendiente en Tus pendientes.
  cancelDispatchGuide(id, { motivo, ya_en_sol }) {
    return axios.patch(`billing/dispatch-guides/${id}/anular/`, { motivo, ya_en_sol }, { headers: authHeader() });
  }
  confirmBajaEnSol(id) {
    return axios.patch(`billing/dispatch-guides/${id}/baja-en-sol/`, {}, { headers: authHeader() });
  }
  retryDispatchGuide(id) {
    return axios.post(`billing/dispatch-guides/${id}/reintentar/`, {}, { headers: authHeader() });
  }
  retryPendingDispatchGuides() {
    return axios.post("billing/dispatch-guides/reintentar/", {}, { headers: authHeader() });
  }
  createDispatchGuide(data) {
    return axios.post("billing/dispatch-guides/", data, { headers: authHeader() });
  }
  listUbigeos(q) {
    return axios.get("billing/ubigeos/", { params: { q }, headers: authHeader() });
  }
}

export default new BillingDataService();
