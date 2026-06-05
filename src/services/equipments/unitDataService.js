import axios from "axios";
import authHeader from "@/services/auth-header";

class UnitDataService {
    getAll() {
        return axios.get("equipments/units", { headers: authHeader() });
    }
    get(id) {
        return axios.get(`equipments/units/${id}`, { headers: authHeader() });
    }
    create(data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.post("equipments/units", data, { headers: headers });
    }
    update(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.put(`equipments/units/${id}`, data, { headers: headers });
    }
    delete(id) {
        return axios.delete(`equipments/units/${id}`, { headers: authHeader() });
    }
}

export default new UnitDataService();