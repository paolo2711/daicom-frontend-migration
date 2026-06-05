import axios from "axios";
import authHeader from "@/services/auth-header";


class ProfileDataService {
    get() {
        return axios.get('auth/profile', {
            headers: authHeader()
        });
    }

    update(data) {
        return axios.put('auth/profile', data, {
            headers: authHeader()
        });
    }
}

export default new ProfileDataService();