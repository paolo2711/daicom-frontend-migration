import axios from "axios";
import authHeader from "@/services/auth-header";

// ⚠️ NO fijar Content-Type para FormData — axios lo genera con el boundary correcto:
// "multipart/form-data; boundary=----WebKitFormBoundaryXYZ"
// Si lo pisamos sin boundary, Django no parsea el body y request.data llega vacío.
const cabecerasDe = (data) => {
  const headers = authHeader();
  if (data instanceof FormData) delete headers['Content-Type'];
  else headers['Content-Type'] = "application/json";
  return headers;
};

export default {
  // Filtros por nombre, no por posicion: eran once parametros y llamarlo con
  // uno solo obligaba a pasar seis strings vacios hasta llegar al que importaba.
  // URLSearchParams ademas escapa los valores, que hace falta desde que hay
  // filtros de texto libre.
  getFiltered(filtros = {}) {
    const params = new URLSearchParams()
    for (const [clave, valor] of Object.entries({ page: 1, page_size: 10, ...filtros })) {
      if (valor === '' || valor === null || valor === undefined || valor === false) continue
      params.set(clave, valor === true ? 'true' : valor)
    }

    return axios.get(`certificates?${params}`, {
      headers: authHeader()
    });
  },

  getAll() {
    return axios.get('certificates?page_size=1000000000', {
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

  // fecha_firma mueve solo el día del sello dibujado, para los certificados
  // viejos que se vuelven a generar.
  async generateQR(id, fechaFirma = '') {
    const headers = authHeader();
    headers['Content-Type'] = "application/json";
    return axios.post(`certificates/attach_qr/${id}`, { fecha_firma: fechaFirma }, { headers });
  },

  

  create(data) {
    let headers = authHeader();
    headers['Content-Type'] = "multipart/form-data";
    return axios.post("certificates", data, {
      headers: headers
    });
  },

  async update(id, data) {
    let headers = authHeader();
    headers['Content-Type'] = "multipart/form-data";
    return axios.put(`certificates/${id}`, data, {
      headers: headers
    });
  },

  // Registra la entrega. Sirve para uno o para varios, y con sent_date en nulo
  // la quita.
  registrarEntrega(certIds, sentDate) {
    const headers = authHeader();
    headers['Content-Type'] = "application/json";
    return axios.post('certificates/entrega', { cert_ids: certIds, sent_date: sentDate }, { headers });
  },

  corregirTipo(certIds, certificateType) {
    const headers = authHeader();
    headers['Content-Type'] = "application/json";
    return axios.post('certificates/corregir-tipo', { cert_ids: certIds, certificate_type: certificateType }, { headers });
  },

  // Guarda un PDF ya hecho como certificado base, sin convertir.
  subirPdfBase(id, formData) {
    const headers = authHeader();
    delete headers['Content-Type'];
    return axios.post(`certificates/${id}/pdf-base`, formData, { headers });
  },

  delete(id) {
    return axios.delete(`certificates/${id}`, {
      headers: authHeader()
    });
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

  removeFromCloud(id) {
    let headers = authHeader();
    return axios.delete(`certificates/${id}/cloud`, { headers: headers });
  },

  cancelSignatureRequest(id) {
    let headers = authHeader();
    return axios.patch(`certificates/${id}/cancel-signature`, {}, { headers: headers });
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