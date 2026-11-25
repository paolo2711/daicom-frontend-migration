import axios from "axios";
import authHeader from "@/services/auth-header";
import { porPagina } from "@/utils/pagination";

class ServicioCatalogoDataService {
    // ServicioCatalogo.TipoServicio: [{ value, title }].
    tipos() {
        return axios.get("equipments/servicios/tipos/", { headers: authHeader() });
    }
    // Los servicios activos que coinciden con el texto.
    getFiltered(page, size, texto) {
        return axios.get("equipments/servicios/", { params: { ...porPagina(page, size), search: texto }, headers: authHeader() });
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