import axios from "axios";
import authHeader from "@/services/auth-header";

class NotificationDataService {
    list(page = 1, filtro = 'todas') {
        const params = { page, page_size: 30 };   // el default del back es 10 → cargamos más de una tanda
        if (filtro === 'no_leidos') params.no_leidas = true;
        else if (filtro && filtro !== 'todas') params.grupo = filtro;
        return axios.get("notifications", { headers: authHeader(), params });
    }
    unreadCount() {
        return axios.get("notifications/unread-count", { headers: authHeader() });
    }
    // Grupos de pildora en los que el usuario tiene notificaciones (para ocultar el resto).
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
