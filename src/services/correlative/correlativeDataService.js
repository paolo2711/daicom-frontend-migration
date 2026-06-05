import axios from "axios";
import authHeader from "@/services/auth-header";


class CorrelativeDataService {
    get(correlative_type) {
        return axios.get(`certificates/correlative?correlative_type=${correlative_type}`, {
            headers: authHeader()
        })
    }
}

export default new CorrelativeDataService();