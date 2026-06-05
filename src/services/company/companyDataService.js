import axios from "axios";
import authHeader from "@/services/auth-header";


class CompanyDataService {
    get() {
        return axios.get('company', {
            headers: authHeader()
        })
    }

    update(data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.put('company', data, {
            headers: headers
        })
    }
}

export default new CompanyDataService();