import axios from "axios";
import authHeader from "@/services/auth-header";


class CompanyDataService {
    get() {
        return axios.get('company', {
            headers: authHeader()
        })
    }

    update(data) {
        return axios.put('company', data, {
            headers: authHeader()
        })
    }

    // Las acreditaciones que se pueden declarar hoy (apps/company/acreditaciones.py).
    acreditaciones() {
        return axios.get('company/acreditaciones', {
            headers: authHeader()
        })
    }
}

export default new CompanyDataService();