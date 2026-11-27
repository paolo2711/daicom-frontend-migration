import axios from "axios";
import authHeader from "@/services/auth-header";
import { archivoDe } from "@/utils/files";
import { porPagina } from "@/utils/pagination";

class EquipmentDataService {
    getFiltered(page, size, query) {
        return axios.get('equipments/maestros/', {
            params: { ...porPagina(page, size), search: query },
            headers: authHeader()
        });
    }

    // El equipo con sus servicios.
    get(id) {
        return axios.get(`equipments/maestros/${id}/`, { headers: authHeader() });
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

    // El Excel de precios de esos tipos de servicio, como archivo.
    descargarPrecios(servicios) {
        return archivoDe(axios.get('equipments/precios/excel/', {
            params: { servicios: servicios.join(',') }, headers: authHeader(), responseType: 'blob',
        }));
    }

    // El Excel lleno: sin `aplicar` devuelve lo que cambiaria; con `aplicar`, lo guarda.
    subirPrecios(archivo, aplicar = false) {
        const datos = new FormData();
        datos.append('excel', archivo);
        if (aplicar) datos.append('aplicar', 'true');
        return axios.post('equipments/precios/excel/', datos, { headers: authHeader() });
    }
}

export default new EquipmentDataService();