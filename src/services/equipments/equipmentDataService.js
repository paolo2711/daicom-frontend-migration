import axios from "axios";
import authHeader from "@/services/auth-header";

class EquipmentDataService {
    getAll() {
        // En caso de que tengas muchos equipos en el futuro, le mandamos un page_size grande
        // igual que haces en tus otros servicios para asegurar que traiga todo el diccionario.
        return axios.get('equipments/maestros/?page_size=1000000000', {
            headers: authHeader()
        });
    }

    get(id) {
        return axios.get(`equipments/maestros/${id}/`, {
            headers: authHeader()
        });
    }

    // Para autocompletes: pide de a paginas y filtra en el backend por texto,
    // igual que LabDataService.getFiltered. Reemplaza a getAll() en los formularios
    // donde el usuario busca un equipo (no en el catalogo administrativo completo).
    getFiltered(page, size, query) {
        return axios.get('equipments/maestros/', {
            params: { page, page_size: size, search: query },
            headers: authHeader()
        });
    }

    create(data) {
        return axios.post("equipments/maestros/", data, {
            headers: authHeader()
        });
    }

    update(id, data) {
        return axios.put(`equipments/maestros/${id}/`, data, {
            headers: authHeader()
        });
    }

    delete(id) {
        return axios.delete(`equipments/maestros/${id}/`, {
            headers: authHeader()
        });
    }
}

export default new EquipmentDataService();