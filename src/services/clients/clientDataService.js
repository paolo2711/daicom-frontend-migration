import axios from "axios";
import authHeader from "@/services/auth-header";
import { porPagina } from "@/utils/pagination";


class ClientDataService {
    getFiltered(page, page_size, name, needs_review = ''){
        const params = { ...porPagina(page, page_size), search: name || '' };
        if (needs_review) params.needs_review = true;
        return axios.get("clients", { params, headers: authHeader() });
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

    setNeedsReview(id, needs_review) {
        return axios.patch(`clients/${id}`, { needs_review }, {
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