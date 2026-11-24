import axios from "axios";
import authHeader from "@/services/auth-header";
import { porPagina } from "@/utils/pagination";


class LogDataService {
    getFiltered(page, page_size){
        return axios.get("logs", { params: porPagina(page, page_size), headers: authHeader() });
    }
}

export default new LogDataService();