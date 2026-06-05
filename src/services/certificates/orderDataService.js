import axios from "axios";
import authHeader from "@/services/auth-header";

class OrderDataService {
    
    getFiltered(page, itemsPerPage, client, order_number, correlative, date_gt, date_lt, status, order_type) {
        let headers = authHeader();
        let params = { page: page, page_size: itemsPerPage };
        
        if (client) params.client = client;
        if (order_number) params.order_number = order_number;
        if (correlative) params.correlative = correlative;
        if (date_gt) params.date_gt = date_gt;
        if (date_lt) params.date_lt = date_lt;
        if (status) params.status = status; 
        if (order_type) params.order_type = order_type;

        return axios.get("orders", { params: params, headers: headers });
    }

    get(id) {
        return axios.get(`orders/${id}`,  { headers: authHeader() });
    }

    // Crea una orden nueva 
    create(data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.post("orders", data, { headers: headers });
    }


    // Elimina la orden
    delete(id) {
        return axios.delete(`orders/${id}`, { headers: authHeader() });
    }

// Sube la factura a la Orden
    uploadInvoice(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.patch(`orders/${id}`, data, { headers: headers });
    }

    // Registra el pago de la Orden
    liquidate(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        // Ahora enviamos a /orders/ID/payments
        return axios.post(`orders/${id}/payments`, data, { headers: headers });
    }
    // elimina abono
    deletePayment(id) {
        return axios.delete(`orders/payments/${id}`, { headers: authHeader() });
    }

    // actualiza abono (para corregir los montos en 0)
    updatePayment(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.patch(`orders/payments/${id}`, data, { headers: headers });
    }

    patch(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.patch(`orders/${id}`, data, { headers: headers });
    }

    // registra el detalle del equipo alquilado
    createRental(data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.post("orders/rentals/", data, { headers: headers });
    }
    // Marcar equipo como devuelto
    returnRental(rental_id) {
        return axios.patch(`orders/rentals/${rental_id}/return`, {}, { headers: authHeader() });
    }

    // Actualizar fechas de alquiler
    updateRentalDates(rental_id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.patch(`orders/rentals/${rental_id}`, data, { headers: headers });
    }
}

export default new OrderDataService();