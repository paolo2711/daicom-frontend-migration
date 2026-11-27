import axios from "axios";
import authHeader from "@/services/auth-header";
import { porPagina } from "@/utils/pagination";

class InventoryDataService {
    getAll(params = {}) {
        return axios.get("inventory/items/", { headers: authHeader(), params: params });
    }
    // Los certificados que se pueden vincular a un equipo, por su numero.
    buscarCertificados(page, size, search) {
        return axios.get("inventory/items/certificados/", { headers: authHeader(), params: { ...porPagina(page, size), search } });
    }
    getNextId() {
        return axios.get("inventory/items/next_id/", { headers: authHeader() });
    }
    get(id) {
        return axios.get(`inventory/items/${id}/`, { headers: authHeader() });
    }
    create(data) {
        return axios.post("inventory/items/", data, { headers: authHeader() });
    }
    update(id, data) {
        return axios.patch(`inventory/items/${id}/`, data, { headers: authHeader() });
    }
    delete(id) {
        return axios.delete(`inventory/items/${id}/`, { headers: authHeader() });
    }
}

export default new InventoryDataService();