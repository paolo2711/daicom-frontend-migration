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
  siguienteNumero(documentType) {
    return axios.get("documents/siguiente-numero/", { params: { document_type: documentType }, headers: authHeader() });
  }
}

export default new DocumentsDataService();