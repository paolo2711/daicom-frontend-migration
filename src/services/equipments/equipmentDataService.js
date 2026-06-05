import axios from "axios";
import authHeader from "@/services/auth-header";

class EquipmentDataService {
    getAll() {
        // Traemos todos sin paginación para llenar los combobox
        return axios.get("equipments", { headers: authHeader() });
    }
    get(id) {
        return axios.get(`equipments/${id}`, { headers: authHeader() });
    }
    create(data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.post("equipments", data, { headers: headers });
    }
    update(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.put(`equipments/${id}`, data, { headers: headers });
    }
    delete(id) {
        return axios.delete(`equipments/${id}`, { headers: authHeader() });
    }
}

export default new EquipmentDataService();