import axios from 'axios';
import authHeader from "@/services/auth-header";


class PermissionDataService {
    get(id) {
        return axios.get(`role_permissions/${id}`, {
            headers: authHeader()
        })
    }

    create(data) {
        return axios.post('permissions', data, {
            headers: authHeader()
        })
    }
}

export default new PermissionDataService();