import axios from "axios";
import authHeader from "@/services/auth-header";


class LabDataService {
    getFiltered(page, page_size, name) {
        return axios.get(  `labs?page=${page}&page_size=${page_size}&name=${name} `, {
            headers: authHeader()
        });
    }

    getAll() {
        return axios.get( 'labs?page_size=1000000000', {
            headers: authHeader()
        });
    }

    get(id) {
        return axios.get(`labs/${id}`,  {
            headers: authHeader()
        });
    }

    create(data) {
        return axios.post("labs", data, {
            headers: authHeader()
        });
    }

    update(id, data) {
        return axios.put(`labs/${id}`, data, {
            headers: authHeader()
        });
    }

    delete(id) {
        return axios.delete(`labs/${id}`, {
            headers: authHeader()
        });
    }
}

export default new LabDataService();