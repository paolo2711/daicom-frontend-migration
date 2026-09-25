import axios from 'axios';
import authHeader from "@/services/auth-header";


class AuthService{
    login(user) {
        return axios
            .post('auth/login', {
                username: user.username,
                password: user.password
            })
            .then(response => {
                if (response.data.token) {
                    localStorage.setItem('user', JSON.stringify(response.data));
                    localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
                }
                return response.data;
            })
    }

    // Invalida el token en el server. Lo local lo borra authStore.cerrarSesionLocal.
    logout() {
        return axios.post('auth/logout', {}, { headers: authHeader() })
    }

    deleteAllCookies() {
        let cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            let eqPos = cookie.indexOf("=");
            let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    }

}

export default new AuthService();
