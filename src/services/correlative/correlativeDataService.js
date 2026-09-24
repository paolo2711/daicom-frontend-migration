import axios from "axios";
import authHeader from "@/services/auth-header";


class CorrelativeDataService {
    get(correlative_type) {
        return axios.get(`certificates/correlative?correlative_type=${correlative_type}`, {
            headers: authHeader()
        })
    }

    // { 1: siguiente acreditado, 2: no acreditado, 3: operatividad }
    getTodos() {
        return axios.get('certificates/correlative', { headers: authHeader() })
    }
}

export default new CorrelativeDataService();