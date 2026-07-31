// src/services/external/apiPeruService.js
import axios from "axios";
import authHeader from "@/services/auth-header";

/**
 * Por dentro, ya NO llama directo a api.apis.net.pe vía corsproxy.io (eso
 * fallaba en producción porque corsproxy.io solo es gratis para
 * localhost/red local). Ahora llama a nuestro propio backend
 * (/clients/lookup/dni/... y /clients/lookup/ruc/...), que hace la consulta
 * servidor-a-servidor sin restricción de CORS.
 */
class ApiPeruService {
    async consultaDNI(dni) {
        if (!dni || dni.length !== 8) return "";

        try {
            const response = await axios.get(`clients/lookup/dni/${dni}`, {
                headers: authHeader()
            });
            return response.data.nombre || "";
        } catch (error) {
            console.error("Error al consultar DNI:", error);
            throw error;
        }
    }

    async consultaRUC(ruc) {
        if (!ruc || ruc.length !== 11) return { compania: "", direccion: "" };

        try {
            const response = await axios.get(`clients/lookup/ruc/${ruc}`, {
                headers: authHeader()
            });
            return {
                compania: response.data.compania || "",
                direccion: response.data.direccion || ""
            };
        } catch (error) {
            console.error("Error al consultar RUC:", error);
            throw error;
        }
    }
}

// unica instancia 
export default new ApiPeruService();