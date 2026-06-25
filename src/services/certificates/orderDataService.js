import axios from "axios";
import authHeader from "@/services/auth-header";

class OrderDataService {

    // ─── ÓRDENES ────────────────────────────────────────────────────────────────

    getFiltered(page, itemsPerPage, client, order_number, correlative, date_gt, date_lt, status, order_type, missing_payment = false, missing_invoice = false, afecta_detraccion = false) {
        let headers = authHeader();
        let params = { page: page, page_size: itemsPerPage };

        if (client)            params.client            = client;
        if (order_number)      params.order_number      = order_number;
        if (correlative)       params.correlative       = correlative;
        if (date_gt)           params.date_gt           = date_gt;
        if (date_lt)           params.date_lt           = date_lt;
        if (status)            params.status            = status;
        if (order_type)        params.order_type        = order_type;
        if (missing_payment)   params.missing_payment   = missing_payment;
        if (missing_invoice)   params.missing_invoice   = missing_invoice;
        if (afecta_detraccion) params.afecta_detraccion = afecta_detraccion;

        return axios.get("orders", { params, headers });
    }

    get(id) {
        return axios.get(`orders/${id}`, { headers: authHeader() });
    }

    create(data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.post("orders", data, { headers });
    }

    delete(id) {
        return axios.delete(`orders/${id}`, { headers: authHeader() });
    }

    patch(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.patch(`orders/${id}`, data, { headers });
    }

    /** @deprecated Usar createInvoice() / deleteInvoice(). Se mantiene para compatibilidad durante la transición. */
    uploadInvoice(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.patch(`orders/${id}`, data, { headers });
    }

    // ─── FACTURAS (OrderInvoice) ─────────────────────────────────────────────

    /** Extrae los datos PDF */
    extractInvoiceData(data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.post(`orders/invoices/extract`, data, { headers });
    }

    /** Lista todas las facturas de una orden */
    getInvoices(order_id) {
        return axios.get(`orders/${order_id}/invoices`, { headers: authHeader() });
    }

    /**
     * Crea una nueva factura para una orden.
     * @param {number} order_id
     * @param {FormData} data  — campos: invoice_number, invoice_date, amount, pdf (File), auto_extract (bool)
     */
    createInvoice(order_id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.post(`orders/${order_id}/invoices`, data, { headers });
    }

    /**
     * Edita una factura existente (número, fecha o monto)
     * @param {number} invoice_id
     * @param {FormData} data
     */
    updateInvoice(invoice_id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.patch(`orders/invoices/${invoice_id}`, data, { headers });
    }

    /** Elimina una factura. La señal post_delete recalcula detracciones  */
    deleteInvoice(invoice_id) {
        return axios.delete(`orders/invoices/${invoice_id}`, { headers: authHeader() });
    }

    // ─── PAGOS ───────────────────────────────────────────────────────────────

    liquidate(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.post(`orders/${id}/payments`, data, { headers });
    }

    deletePayment(id) {
        return axios.delete(`orders/payments/${id}`, { headers: authHeader() });
    }

    updatePayment(id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.patch(`orders/payments/${id}`, data, { headers });
    }

    // ─── ALQUILERES ──────────────────────────────────────────────────────────

    createRental(data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.post("orders/rentals/", data, { headers });
    }

    returnRental(rental_id) {
        return axios.patch(`orders/rentals/${rental_id}/return`, {}, { headers: authHeader() });
    }

    updateRentalDates(rental_id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.patch(`orders/rentals/${rental_id}`, data, { headers });
    }

    // ─── RESÚMENES (Smart Chips) ─────────────────────────────────────────────

    getPendingPaymentsSummary(order_type, client, order_number, correlative, date_gt, date_lt) {
        let headers = authHeader();
        let params = { order_type };
        if (client)       params.client       = client;
        if (order_number) params.order_number  = order_number;
        if (correlative)  params.correlative   = correlative;
        if (date_gt)      params.date_gt       = date_gt;
        if (date_lt)      params.date_lt       = date_lt;
        return axios.get("orders/summary/pending-payments", { params, headers });
    }

    getPendingInvoicesSummary(order_type, client, order_number, correlative, date_gt, date_lt) {
        let headers = authHeader();
        let params = { order_type };
        if (client)       params.client       = client;
        if (order_number) params.order_number  = order_number;
        if (correlative)  params.correlative   = correlative;
        if (date_gt)      params.date_gt       = date_gt;
        if (date_lt)      params.date_lt       = date_lt;
        return axios.get("orders/summary/pending-invoices", { params, headers });
    }

    getAfectasDetraccionSummary(order_type, client, order_number, correlative, date_gt, date_lt) {
        let headers = authHeader();
        let params = { order_type };
        if (client)       params.client       = client;
        if (order_number) params.order_number  = order_number;
        if (correlative)  params.correlative   = correlative;
        if (date_gt)      params.date_gt       = date_gt;
        if (date_lt)      params.date_lt       = date_lt;
        return axios.get("orders/summary/afectas-detraccion", { params, headers });
    }
}

export default new OrderDataService();