import axios from "axios";
import authHeader from "@/services/auth-header";


class RoleDataService {
    getAll() {
        return axios.get('roles', {
            headers: authHeader()
        });
    }

    get(id) {
        return axios.get(`roles/${id}`,  {
            headers: authHeader()
        });
    }

    create(data) {
        return axios.post('roles', data, {
            headers: authHeader()
        });
    }

    update(id, data) {
        return axios.put(`roles/${id}`, data, {
            headers: authHeader()
        });
    }

    delete(id) {
        return axios.delete(`roles/${id}`, {
            headers: authHeader()
        });
    }

}

export default new RoleDataService();