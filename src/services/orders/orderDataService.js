import axios from "axios";
import authHeader from "@/services/auth-header";
import { archivoDe } from "@/utils/files";

class OrderDataService {

    // ─── ÓRDENES ────────────────────────────────────────────────────────────────

    // Agregamos `invoice_number` como último parámetro con valor por defecto
    getFiltered(page, itemsPerPage, client, order_number, correlative, date_gt, date_lt, status, order_type, missing_payment = false, missing_invoice = false, a_credito = false, invoice_number = '') {
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
        if (a_credito)         params.a_credito         = a_credito;

        return axios.get("orders", { params, headers });
    }

    // Solo el semaforo de la orden.
    getEstado(id) {
        return axios.get(`orders/${id}/estado`, { headers: authHeader() });
    }

    // La fila de la tabla de ordenes, sin sus colecciones.
    getFila(id) {
        return axios.get(`orders/${id}/fila`, { headers: authHeader() });
    }

    // Los certificados de un servicio o las lineas de un alquiler. Con `ids`,
    // solo esos certificados, y solo los que siguen en la orden.
    getEquipos(id, ids = null) {
        const params = ids ? { ids: ids.join(',') } : {};
        return axios.get(`orders/${id}/equipos`, { headers: authHeader(), params });
    }

    // El PDF del ingreso sin guardar, como archivo: { client, items }.
    vistaPreviaIngreso(data) {
        const opciones = { headers: authHeader(), responseType: 'blob' };
        return archivoDe(axios.post('orders/vista-previa-ingreso', data, opciones));
    }

    // Donde esta el PDF del ingreso; la orden que todavia no lo tiene, se lo arma.
    ingreso(id) {
        return axios.get(`orders/${id}/ingreso`, { headers: authHeader() });
    }

    servicios() {
        return axios.get('orders/servicios', { headers: authHeader() });
    }

    completarLinea(id, completado) {
        return axios.post(`orders/lineas/${id}/completada`, { completado }, { headers: authHeader() });
    }

    eliminarLinea(id) {
        return axios.delete(`orders/lineas/${id}`, { headers: authHeader() });
    }

    siguienteNumero(orderType) {
        return axios.get('orders/siguiente-numero', { params: { order_type: orderType }, headers: authHeader() });
    }

    // Facturas y abonos, para la tarjeta de resumen.
    getResumen(id) {
        return axios.get(`orders/${id}/resumen`, { headers: authHeader() });
    }

    // Anula una o varias ordenes con sus equipos, todas o ninguna.
    anular(ids) {
        return axios.post('orders/anular', { order_ids: ids }, { headers: authHeader() });
    }

    // marca: sin_comprobante | sin_cargo | con_factura. La que no se puede no
    // frena a las demas: vuelve en `rechazos`.
    marcarComprobante(ids, marca, currency) {
        return axios.post('orders/marcar-comprobante', { order_ids: ids, marca, currency }, { headers: authHeader() });
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

    // salida | devolucion | deshacer-devolucion
    darPasoDeAlquiler(rental_id, paso, fecha = null) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.post(`orders/rentals/${rental_id}/${paso}`, { fecha }, { headers });
    }

    // Solo lo reservado: el equipo vuelve a disponible.
    deleteRental(rental_id) {
        return axios.delete(`orders/rentals/${rental_id}`, { headers: authHeader() });
    }

    updateRentalDates(rental_id, data) {
        let headers = authHeader();
        headers['Content-Type'] = "application/json";
        return axios.patch(`orders/rentals/${rental_id}`, data, { headers });
    }

    // ─── RESÚMENES (Smart Chips) ─────────────────────────────────────────────

    // Cada pildora cuenta con los mismos filtros de la pantalla.
    getPildora(pildora, order_type, client, order_number, correlative, date_gt, date_lt, invoice_number = '') {
        let headers = authHeader();
        let params = { order_type };
        if (client)       params.client       = client;
        if (order_number) params.order_number  = order_number;
        if (correlative)  params.correlative   = correlative;
        if (date_gt)      params.date_gt       = date_gt;
        if (date_lt)      params.date_lt       = date_lt;
        if (invoice_number) params.invoice_number = invoice_number;
        return axios.get(`orders/summary/${pildora}`, { params, headers });
    }

    getPendingPaymentsSummary(...filtros) {
        return this.getPildora('pending-payments', ...filtros);
    }

    getPendingInvoicesSummary(...filtros) {
        return this.getPildora('pending-invoices', ...filtros);
    }

    getPendingCreditSummary(...filtros) {
        return this.getPildora('pending-credit', ...filtros);
    }
}

export default new OrderDataService();