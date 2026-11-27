import axios from "axios";
import authHeader from "@/services/auth-header";
import { soloConValor } from "@/utils/pagination";


class UserDataService {
    getFiltered(filtros) {
        return axios.get("users", { params: soloConValor(filtros), headers: authHeader() });
    }

    create(data) {
        return axios.post("users", data, {
            headers: authHeader()
        });
    }

    update(id, data) {
        return axios.put(`users/${id}`, data, {
            headers: authHeader()
        });
    }

    delete(id) {
        return axios.delete(`users/${id}`, {
            headers: authHeader()
        });
    }

    // El admin restablece la contrasena de un usuario (la olvido).
    resetPassword(id, new_password) {
        return axios.post(`users/${id}/reset-password`, { new_password }, {
            headers: authHeader()
        });
    }

}

export default new UserDataService();