import axios from "axios";
import authHeader from "@/services/auth-header";

class InventoryDataService {
    getAll(params = {}) {
        return axios.get("inventory/items/", { headers: authHeader(), params: params });
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