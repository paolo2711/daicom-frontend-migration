import axios from "axios";
import authHeader from "@/services/auth-header";


class ClientDataService {
    getFiltered(page, page_size, name, needs_review = ''){
        let url = `clients?page=${page}&page_size=${page_size}&search=${encodeURIComponent(name || '')}`;
        if (needs_review) {
            url += `&needs_review=true`;
        }
        return axios.get(url,  {
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

    resolve(data) {
        return axios.post("clients/resolve", data, {
            headers: authHeader()
        });
    }
}

export default new ClientDataService();