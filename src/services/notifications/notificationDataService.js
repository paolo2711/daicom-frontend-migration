import axios from "axios";
import authHeader from "@/services/auth-header";

class NotificationDataService {
    list(page = 1) {
        return axios.get("notifications", { headers: authHeader(), params: { page } });
    }
    unreadCount() {
        return axios.get("notifications/unread-count", { headers: authHeader() });
    }
    markRead(id) {
        return axios.patch(`notifications/${id}/read`, {}, { headers: authHeader() });
    }
    markAll() {
        return axios.post("notifications/read-all", {}, { headers: authHeader() });
    }
}

export default new NotificationDataService();
