import axios from "axios";
import authHeader from "@/services/auth-header";

class NotificationDataService {
    list(page = 1, { noLeidas = false, tipos = [] } = {}) {
        const params = { page, page_size: 30 };   // el default del back es 10
        if (noLeidas) params.no_leidas = true;
        if (tipos.length) params.tipos = tipos.join(',');
        return axios.get("notifications", { headers: authHeader(), params });
    }
    unreadCount() {
        return axios.get("notifications/unread-count", { headers: authHeader() });
    }
    // Tipos que recibe el usuario, para armar el menu del filtro.
    facets() {
        return axios.get("notifications/facets", { headers: authHeader() });
    }
    markRead(id) {
        return axios.patch(`notifications/${id}/read`, {}, { headers: authHeader() });
    }
    markAll() {
        return axios.post("notifications/read-all", {}, { headers: authHeader() });
    }
}

export default new NotificationDataService();
