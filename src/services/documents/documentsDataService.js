import axios from "axios";
import authHeader from "@/services/auth-header";

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
  // El PDF sin guardar, como archivo. Si el back lo rechaza, su respuesta se
  // lee como JSON: el error llega con la misma forma que al guardar.
  async vistaPrevia(data) {
    try {
      const { data: pdf } = await axios.post("documents/vista-previa/", data, { headers: authHeader(), responseType: "blob" });
      return pdf;
    } catch (error) {
      if (error.response?.data instanceof Blob) {
        try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* no era JSON */ }
      }
      throw error;
    }
  }
  siguienteNumero(documentType) {
    return axios.get("documents/siguiente-numero/", { params: { document_type: documentType }, headers: authHeader() });
  }
}

export default new DocumentsDataService();