import axios from "axios";
import authHeader from "@/services/auth-header";

class OrderDataService {

    // ─── ÓRDENES ────────────────────────────────────────────────────────────────

    // Agregamos `invoice_number` como último parámetro con valor por defecto
    getFiltered(page, itemsPerPage, client, order_number, correlative, date_gt, date_lt, status, order_type, missing_payment = false, missing_invoice = false, afecta_detraccion = false, invoice_number = '') {
        let headers = authHeader();
        let params = { page: page, page_size: itemsPerPage };

        if (client)            params.client            = client;
        if (order_number)      params.order_number      = order_number;
        if (correlative)       params.correlative       = correlative;
        if (invoice_number)    params.invoice_number    = invoice_number;
        if (date_gt)           params.date_gt           = date_gt;
        if (date_lt)           params.date_lt           = date_lt;
        if (status)            params.status_custom     = status;
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

    /** Vincula 1..N órdenes a una factura existente. SIN monto: solo crea
     *  el puente orden<->factura. order_ids: array de IDs de orden. */
    linkInvoice(invoice_id, order_ids) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        const ids = Array.isArray(order_ids) ? order_ids : [order_ids];
        return axios.post(`orders/invoices/${invoice_id}/link`, { order_ids: ids }, { headers });
    }

    /** Búsqueda liviana de órdenes por número (autocomplete). */
    lookupOrders(query, excludeId = null, currency = null) {
        let headers = authHeader();
        let params = { q: query };
        if (excludeId) params.exclude = excludeId;
        if (currency)  params.currency = currency;
        return axios.get(`orders/lookup`, { params, headers });
    }

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
     * Crea una factura SUELTA (sin orden), nace en el limbo. Vía del panel
     * de finanzas y del drag&drop de PDF.
     * @param {FormData} data — invoice_number, invoice_date, amount, currency, exchange_rate, pdf
     */
    createInvoiceSuelta(data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.post(`orders/invoices/create`, data, { headers });
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

    /** Desvincula la factura de una orden. Si era la última orden usándola, se elimina por completo. */
    deleteInvoice(invoice_id, order_id) {
        return axios.delete(`orders/invoices/${invoice_id}`, { params: { order_id }, headers: authHeader() });
    }

    /** Lista TODAS las facturas de la empresa (no solo las que tienen saldo
     *  libre) — fuente de datos correcta para un panel/listado financiero.
     *  filtros: { order_type, currency, estado, q, page, page_size } */
    listInvoices(filtros = {}) {
        let headers = authHeader();
        return axios.get('orders/invoices', { params: filtros, headers });
    }

    // ─── PAGOS ───────────────────────────────────────────────────────────────

    /** Registra un abono contra una FACTURA (caso normal, con comprobante). */
    createInvoicePayment(invoice_id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.post(`orders/invoices/${invoice_id}/payments`, data, { headers });
    }

    /** @deprecated TRANSITORIO. Abono directo a la orden. Se eliminará al
     *  implementar la factura interna (es_fiscal=False): entonces incluso
     *  las órdenes "sin comprobante" recibirán abonos vía createInvoicePayment.
     *  No usar en código nuevo. */
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

    // ─── DOCUMENTOS (OC / Valorizaciones — solo alquiler) ─────────────────────

    /** Lista los documentos de una orden. tipo opcional: 1=OC, 2=Valorización. */
    listDocuments(order_id, tipo) {
        let params = {};
        if (tipo) params.tipo = tipo;
        return axios.get(`orders/${order_id}/documents`, { params, headers: authHeader() });
    }

    /** Sube un documento (FormData: tipo, numero, fecha, pdf). */
    addDocument(order_id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "multipart/form-data";
        return axios.post(`orders/${order_id}/documents`, data, { headers });
    }

    deleteDocument(doc_id) {
        return axios.delete(`orders/documents/${doc_id}`, { headers: authHeader() });
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

    getPendingPaymentsSummary(order_type, client, order_number, correlative, date_gt, date_lt, invoice_number = '') {
        let headers = authHeader();
        let params = { order_type };
        if (client)       params.client       = client;
        if (order_number) params.order_number  = order_number;
        if (correlative)  params.correlative   = correlative;
        if (date_gt)      params.date_gt       = date_gt;
        if (date_lt)      params.date_lt       = date_lt;
        if (invoice_number) params.invoice_number = invoice_number;
        return axios.get("orders/summary/pending-payments", { params, headers });
    }

    getPendingInvoicesSummary(order_type, client, order_number, correlative, date_gt, date_lt, invoice_number = '') {
        let headers = authHeader();
        let params = { order_type };
        if (client)       params.client       = client;
        if (order_number) params.order_number  = order_number;
        if (correlative)  params.correlative   = correlative;
        if (date_gt)      params.date_gt       = date_gt;
        if (date_lt)      params.date_lt       = date_lt;
        if (invoice_number) params.invoice_number = invoice_number;
        return axios.get("orders/summary/pending-invoices", { params, headers });
    }

    getAfectasDetraccionSummary(order_type, client, order_number, correlative, date_gt, date_lt, invoice_number = '') {
        let headers = authHeader();
        let params = { order_type };
        if (client)       params.client       = client;
        if (order_number) params.order_number  = order_number;
        if (correlative)  params.correlative   = correlative;
        if (date_gt)      params.date_gt       = date_gt;
        if (date_lt)      params.date_lt       = date_lt;
        if (invoice_number) params.invoice_number = invoice_number;
        return axios.get("orders/summary/afectas-detraccion", { params, headers });
    }
}

export default new OrderDataService();