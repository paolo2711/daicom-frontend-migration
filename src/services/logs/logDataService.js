import axios from "axios";
import authHeader from "@/services/auth-header";


class LogDataService {
    getFiltered(page, page_size){
        return axios.get(`logs?page=${page}&page_size=${page_size}`,  {
            headers: authHeader()
        });
    }
}

export default new LogDataService();