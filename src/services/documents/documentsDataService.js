import axios from "axios";
import authHeader from "@/services/auth-header";
import { archivoDe } from "@/utils/files";

class DocumentsDataService {
  create(data) {
    return axios.post("documents/", data, {
      headers: authHeader()
    });
  }

  getAll(params) {
    return axios.get("documents/", { 
      params,
      headers: authHeader() 
    });
  }

  get(id) { 
    return axios.get(`documents/${id}/`, { headers: authHeader() }); 
  }
  update(id, data) { 
    return axios.put(`documents/${id}/`, data, { headers: authHeader() }); 
  }
  cancel(id) {
    return axios.patch(`documents/${id}/anular/`, {}, { headers: authHeader() });
  }
  // La orden de servicio que sale de una cotizacion: { client, filas, sin_pasar }.
  orden(id) {
    return axios.get(`documents/${id}/orden/`, { headers: authHeader() });
  }
  // El PDF sin guardar, como archivo.
  vistaPrevia(data) {
    return archivoDe(axios.post("documents/vista-previa/", data, { headers: authHeader(), responseType: "blob" }));
  }
  // Una cotizacion hecha fuera del sistema: su PDF y los datos de la lista, en un FormData.
  subirCotizacion(formulario) {
    return axios.post("documents/subir-cotizacion/", formulario, { headers: authHeader() });
  }
  siguienteNumero(documentType) {
    return axios.get("documents/siguiente-numero/", { params: { document_type: documentType }, headers: authHeader() });
  }
}

export default new DocumentsDataService();