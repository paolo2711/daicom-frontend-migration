// src/services/external/apiPeruService.js

class ApiPeruService {
    async consultaDNI(dni) {
        if (!dni || dni.length !== 8) return "";
        
        // Usamos el proxy para evitar el error de CORS en producción
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://api.apis.net.pe/v1/dni?numero=${dni}`)}`;
        
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('DNI no encontrado');
            
            const data = await response.json();
            return `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`;
        } catch (error) {
            console.error("Error al consultar DNI:", error);
            throw error; 
        }
    }

    async consultaRUC(ruc) {
        if (!ruc || ruc.length !== 11) return { compania: "", direccion: "" };
        
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://api.apis.net.pe/v1/ruc?numero=${ruc}`)}`;
        
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('RUC no encontrado');
            
            const data = await response.json();
            
            let direccionCompleta = "-";
            if (data.direccion && data.direccion.trim() !== "" && data.direccion !== "-") {
                direccionCompleta = data.direccion;
                if (data.distrito) direccionCompleta += `, ${data.distrito}`;
                if (data.provincia) direccionCompleta += `, ${data.provincia}`;
            }

            return {
                compania: data.nombre || data.razonSocial || "Nombre no disponible",
                direccion: direccionCompleta
            };
        } catch (error) {
            console.error("Error al consultar RUC:", error);
            throw error;
        }
    }
}

// Exportamos una única instancia para usarla en todo el sistema
export default new ApiPeruService();