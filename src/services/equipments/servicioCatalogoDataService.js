import axios from "axios";
import authHeader from "@/services/auth-header";

class ServicioCatalogoDataService {
    // Los servicios activos que coinciden con el texto, paginados como espera usePaginatedSearch.
    getFiltered(page, size, texto) {
        return axios.get("equipments/servicios/", { params: { page, page_size: size, search: texto }, headers: authHeader() });
    }
    create(data) {
        return axios.post("equipments/servicios/", data, { headers: authHeader() });
    }
    update(id, data) {
        return axios.put(`equipments/servicios/${id}/`, data, { headers: authHeader() });
    }
    delete(id) {
        return axios.delete(`equipments/servicios/${id}/`, { headers: authHeader() });
    }
}
export default new ServicioCatalogoDataService();