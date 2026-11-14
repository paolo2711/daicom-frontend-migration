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

  // Facturas subidas y sus abonos. `filtros`: order_type, currency, estado, detraccion, tipo, q, page.
  // El formulario de emision lleno desde las ordenes, y su cuenta.
  newInvoice(ordenIds = []) {
    return axios.get("billing/invoices/nueva/", {
      params: ordenIds.length ? { ordenes: ordenIds.join(',') } : {}, headers: authHeader(),
    });
  }
  // La detraccion de una factura subida, antes de guardarla.
  uploadDetraccion(data) {
    return axios.post("billing/invoices/detraccion/", data, { headers: authHeader() });
  }
  invoiceAmounts(datos, orderType) {
    return axios.post("billing/invoices/montos/", { datos, order_type: orderType }, { headers: authHeader() });
  }
  previewInvoice(datos) {
    const opciones = { headers: authHeader(), responseType: "blob" };
    return archivoDe(axios.post("billing/invoices/vista-previa/", datos, opciones));
  }
  getInvoiceInfo(id) {
    return axios.get(`billing/invoices/${id}/info/`, { headers: authHeader() });
  }
  cancelInvoice(id, motivo) {
    return axios.post(`billing/invoices/${id}/anular/`, { motivo }, { headers: authHeader() });
  }
  retryInvoice(id) {
    return axios.post(`billing/invoices/${id}/reintentar/`, {}, { headers: authHeader() });
  }
  retryPendingInvoices() {
    return axios.post("billing/invoices/reintentar/", {}, { headers: authHeader() });
  }
  emitInvoice(datos) {
    return axios.post("billing/invoices/emitir/", datos, { headers: authHeader() });
  }
  listInvoices(filtros = {}) {
    return axios.get("billing/invoices/", { params: filtros, headers: authHeader() });
  }
  // Una factura para una orden; la suelta (sin orden) nace con el tipo de la pestaña.
  createInvoice(orderId, data) {
    return axios.post(`billing/orders/${orderId}/invoices/`, data, { headers: authHeader() });
  }
  createInvoiceSuelta(data) {
    return axios.post("billing/invoices/create/", data, { headers: authHeader() });
  }
  updateInvoice(invoiceId, data) {
    return axios.patch(`billing/invoices/${invoiceId}/`, data, { headers: authHeader() });
  }
  // Con `orderId` solo la desvincula de esa orden; se borra si era la última.
  deleteInvoice(invoiceId, orderId) {
    return axios.delete(`billing/invoices/${invoiceId}/`, { params: { order_id: orderId }, headers: authHeader() });
  }
  linkInvoice(invoiceId, orderIds) {
    const order_ids = Array.isArray(orderIds) ? orderIds : [orderIds];
    return axios.post(`billing/invoices/${invoiceId}/link/`, { order_ids }, { headers: authHeader() });
  }
  extractInvoiceData(data) {
    return axios.post("billing/invoices/extract/", data, { headers: authHeader() });
  }
  listInvoicePayments(invoiceId) {
    return axios.get(`billing/invoices/${invoiceId}/payments/`, { headers: authHeader() });
  }
  createInvoicePayment(invoiceId, data) {
    return axios.post(`billing/invoices/${invoiceId}/payments/`, data, { headers: authHeader() });
  }
  updatePayment(id, data) {
    return axios.patch(`billing/payments/${id}/`, data, { headers: authHeader() });
  }
  deletePayment(id) {
    return axios.delete(`billing/payments/${id}/`, { headers: authHeader() });
  }
}

export default new BillingDataService();
