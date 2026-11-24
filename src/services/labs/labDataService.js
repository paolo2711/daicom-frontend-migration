import axios from "axios";
import authHeader from "@/services/auth-header";
import { porPagina } from "@/utils/pagination";


class LabDataService {
    getFiltered(page, page_size, name) {
        return axios.get("labs", { params: { ...porPagina(page, page_size), name }, headers: authHeader() });
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