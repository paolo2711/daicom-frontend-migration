import axios from "axios";
import authHeader from "@/services/auth-header";
import { porPagina } from "@/utils/pagination";

// Con FormData el Content-Type lo pone axios, con su boundary; sin él Django recibe el body vacío.
const cabecerasDe = (data) => {
  const headers = authHeader();
  if (data instanceof FormData) delete headers['Content-Type'];
  else headers['Content-Type'] = "application/json";
  return headers;
};

export default {
  getFiltered(filtros = {}) {
    const params = new URLSearchParams()
    for (const [clave, valor] of Object.entries({ ...porPagina(1, 10), ...filtros })) {
      if (valor === '' || valor === null || valor === undefined || valor === false) continue
      params.set(clave, valor === true ? 'true' : valor)
    }

    return axios.get(`certificates?${params}`, {
      headers: authHeader()
    });
  },

  get(id) {
    return axios.get(`certificates/${id}`, {
      headers: authHeader()
    });
  },

  buildPDF(data) {
    return axios.post('certificates/pdf', data, { headers: cabecerasDe(data) });
  },

  // Excel que no es de ningún certificado: sale el PDF y nada más.
  buildPDFSuelto(data) {
    return axios.post('certificates/pdf/suelto', data, { headers: cabecerasDe(data) });
  },

  // El PDF temporal que el visor ya no necesita.
  soltarTemporal(url) {
    return axios.delete('certificates/temporal', { headers: cabecerasDe(), data: { url } });
  },

  // Solo encola: el avance llega por el panel de subidas. fecha_firma mueve solo el día del sello dibujado.
  firmar(certIds, fechaFirma = '') {
    return axios.post('certificates/firmar', { cert_ids: certIds, fecha_firma: fechaFirma }, { headers: authHeader() });
  },

  

  create(data) {
    return axios.post("certificates", data, { headers: cabecerasDe(data) });
  },

  // Registra la entrega. Sirve para uno o para varios, y con sent_date en nulo
  // la quita.
  registrarEntrega(certIds, sentDate) {
    const headers = authHeader();
    headers['Content-Type'] = "application/json";
    return axios.post('certificates/entrega', { cert_ids: certIds, sent_date: sentDate }, { headers });
  },

  // Con la opcion de servicio elegida: si el certificado esta en una orden, su linea queda con ese servicio.
  corregirTipo(certIds, { tipo_servicio, certificate_type }) {
    const headers = authHeader();
    headers['Content-Type'] = "application/json";
    return axios.post('certificates/corregir-tipo', { cert_ids: certIds, certificate_type, tipo_servicio }, { headers });
  },

  // Guarda un PDF ya hecho como certificado base, sin convertir.
  subirPdfBase(id, formData) {
    const headers = authHeader();
    delete headers['Content-Type'];
    return axios.post(`certificates/${id}/pdf-base`, formData, { headers });
  },

  patch(id, data) {
    let headers = authHeader();
    return axios.patch(`certificates/${id}`, data, { headers: headers });
  },

  scanNativeExcels(certIds) {
    let headers = authHeader();
    return axios.post('certificates/scan-excels', { cert_ids: certIds }, { headers: headers });
  },

  manualCloudUpload(id, data) {
    let headers = authHeader();
    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }
    return axios.post(`certificates/${id}/manual-upload`, data, { headers: headers });
  },

  // Uno o varios: cada uno cuenta como le fue por el panel de subidas.
  eliminarDeLaNube(certIds) {
    return axios.post('certificates/eliminar-de-la-nube', { cert_ids: certIds }, { headers: authHeader() });
  },

  anular(certIds) {
    return axios.post('certificates/anular', { cert_ids: certIds }, { headers: authHeader() });
  },

  restaurar(certIds) {
    return axios.post('certificates/restaurar', { cert_ids: certIds }, { headers: authHeader() });
  },

  desvincular(certIds) {
    return axios.post('certificates/desvincular', { cert_ids: certIds }, { headers: authHeader() });
  },

  cancelarSolicitudes(certIds) {
    return axios.post('certificates/cancelar-solicitudes', { cert_ids: certIds }, { headers: authHeader() });
  },

  requestBatchSignatures(certIds) {
    let headers = authHeader();
    return axios.post('certificates/request-signatures', { cert_ids: certIds }, { headers: headers });
  },
  
  getPendingSignaturesSummary() {
    return axios.get('certificates/pending-summary', {
      headers: authHeader()
    });
  }
};