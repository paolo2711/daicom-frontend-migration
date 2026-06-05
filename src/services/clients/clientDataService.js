import axios from "axios";
import authHeader from "@/services/auth-header";


class ClientDataService {
    getFiltered(page, page_size, name){
        return axios.get(`clients?page=${page}&page_size=${page_size}&name=${name}`,  {
            headers: authHeader()
        });
    }

    getAll() {
        return axios.get( 'clients?page_size=1000000000', {
            headers: authHeader()
        });
    }

    get(id) {
        return axios.get(`clients/${id}`,  {
            headers: authHeader()
        });
    }

    create(data) {
        return axios.post("clients", data, {
            headers: authHeader()
        });
    }

    update(id, data) {
        return axios.put(`clients/${id}`, data, {
            headers: authHeader()
        });
    }

    delete(id) {
        return axios.delete(`clients/${id}`, {
            headers: authHeader()
        });
    }
}

export default new ClientDataService();