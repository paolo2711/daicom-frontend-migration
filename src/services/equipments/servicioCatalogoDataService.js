import axios from "axios";
import authHeader from "@/services/auth-header";

class ServicioCatalogoDataService {
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