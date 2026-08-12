import { Toast } from '@/plugins/alerts'
import CertificateDataService from '@/services/certificates/certificateDataService'
import { useNotificationStore } from '@/stores/notificationStore'

// Versión al cargar la pestaña; si el back reporta otra al reconectar, hubo deploy.
let bootVersion = null

export default {
    handle(data, appStore, swal) {
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};

        // Versión de la app (viene del back por WS).
        if (data.message && data.message.action === 'APP_VERSION') {
            const v = data.message.version;
            if (v) {
                if (bootVersion === null) {
                    bootVersion = v;
                    if (appStore) appStore.serverVersion = v;
                } else if (v !== bootVersion) {
                    appStore.updateAvailable = true; // cambió = hubo deploy
                }
            }
            return;
        }

        // Cierre de sesión forzado por el admin (tras cambios de roles/permisos).
        // El token ya fue invalidado en el server; aquí limpiamos y vamos a login.
        if (data.message && data.message.action === 'FORCE_LOGOUT') {
            const sameCompany = data.message.company == null || data.message.company == currentUser.company;
            const isExcepted = data.message.except_user && data.message.except_user === currentUser.username;
            if (sameCompany && !isExcepted) {
                try {
                    localStorage.removeItem('user');
                    localStorage.removeItem('permissions');
                } catch (e) { /* noop */ }
                window.location.href = '/login';
            }
            return;
        }

        // Recarga forzada de TODA la página (no las tablas) pedida por el admin.
        if (data.message && data.message.action === 'FORCE_RELOAD') {
            const sameCompany = data.message.company == null || data.message.company == currentUser.company;
            const isExcepted = data.message.except_user && data.message.except_user === currentUser.username;
            if (sameCompany && !isExcepted) {
                window.location.reload();
            }
            return;
        }

        // Función auxiliar para forzar la sincronización del contador con la Base de Datos
        const updatePendingCount = () => {
            if (appStore) {
                CertificateDataService.getPendingSignaturesSummary()
                    .then(response => appStore.setPendingSignaturesCount(response.data.pending_signatures))
                    .catch(() => {});
            }
        };

        // Salvavidas (Código heredado)
        if (data.message === 'RELOAD_TABLES') {
            window.dispatchEvent(new CustomEvent('wss-reload-tables'));
            return;
        } 
        
        // Nuevas recargas dirigidas (Quirúrgicas)
        if (data.message === 'RELOAD_CERTIFICATES') {
            updatePendingCount();
            window.dispatchEvent(new CustomEvent('wss-reload-certificates'));
            return;
        }
        if (data.message === 'RELOAD_ORDERS_service') {
            window.dispatchEvent(new CustomEvent('wss-reload-orders-service'));
            return;
        }
        if (data.message === 'RELOAD_ORDERS_rental') {
            window.dispatchEvent(new CustomEvent('wss-reload-orders-rental'));
            return;
        } 
        if (data.message === 'RELOAD_DOCUMENTS') {
            window.dispatchEvent(new CustomEvent('wss-reload-documents'));
            return;
        }

        if (data.message === 'RELOAD_INVOICES') {
            window.dispatchEvent(new CustomEvent('wss-reload-invoices'));
            return;
        }

        if (data.message === 'RELOAD_INVENTORY') {
            window.dispatchEvent(new CustomEvent('wss-reload-inventory'));
            return;
        }

        // Liviano (como UPDATE_ROW): solo re-lee EL NÚMERO de la campana. Al marcar leído.
        if (data.message && data.message.action === 'UPDATE_NOTIF_COUNT') {
            const sameCompany = data.message.company == null || data.message.company == currentUser.company;
            if (sameCompany) {
                try { useNotificationStore().fetchUnread(); } catch (e) { /* store aún no listo */ }
            }
            return;
        }

        // Pesado (como RELOAD_CERTIFICATES): recarga la LISTA del panel (+ número).
        // La lista solo se recarga si el panel está abierto. Ej. "Borrar notificaciones".
        if (data.message && data.message.action === 'RELOAD_NOTIFICATIONS') {
            const sameCompany = data.message.company == null || data.message.company == currentUser.company;
            if (sameCompany) {
                try { useNotificationStore().resync(); } catch (e) { /* store aún no listo */ }
            }
            return;
        }

        // Notificación persistente nueva (campana): sube el badge y avisa con toast.
        if (data.message && data.message.action === 'NEW_NOTIFICATION') {
            try { useNotificationStore().onNew(); } catch (e) { /* store aún no listo */ }
            if (appStore) {
                Toast.fire({
                    ...appStore.toastBase,
                    icon: data.message.level === 'critical' ? 'error' : (data.message.level === 'warning' ? 'warning' : 'info'),
                    title: data.message.title || 'Nueva notificación',
                });
            }
            return;
        }
        
        if (data.message && data.message.action === 'UPDATE_ROW') {
            updatePendingCount();
            if (data.message.cert_id) {
                window.dispatchEvent(new CustomEvent('wss-update-row', { detail: data.message.cert_id }));
            } else if (data.message.order_id) {
                window.dispatchEvent(new CustomEvent('wss-update-order-row', { detail: data.message.order_id }));
            } else if (data.message.invoice_id) {
                window.dispatchEvent(new CustomEvent('wss-update-invoice-row', { detail: data.message.invoice_id }));
            } else if (data.message.doc_id) {
                window.dispatchEvent(new CustomEvent('wss-update-document-row', { detail: data.message.doc_id }));
            }
            return;
        }

        // --------------------------------------------------------
        //  NOTIFICACION GLOBAL
        // --------------------------------------------------------
        if (data.message && data.message.action === 'GLOBAL_NOTIFY') {
            if (data.message.sender !== currentUser.username) {
                if (appStore) {
                    Toast.fire({
                        ...appStore.toastBase,
                        icon: data.message.msg_type,
                        title: data.message.title,
                        text: data.message.body
                    });
                }
            }
            return;
        }

        if (data.message && data.message.action === 'GLOBAL_SUCCESS_TOAST') {
            if (data.message.username !== currentUser.username) {
                if (appStore) {
                    Toast.fire({
                        ...appStore.toastBase,
                        icon: 'success',
                        title: `Certificado ${data.message.code} subido por ${data.message.username}`
                    });
                }
            }
            return;
        }

        // --------------------------------------------------------
        //  NOTIFICACIÓN EXCLUSIVA PARA FIRMANTES (GERENTES)
        // --------------------------------------------------------
        if (data.message && data.message.action === 'SIGNATURE_REQUEST_TOAST') {
            updatePendingCount();
            if (data.message.sender !== currentUser.username) {
                if (appStore) {
                    Toast.fire({
                        ...appStore.toastBase,
                        icon: 'info',
                        title: 'Firma Solicitada',
                        text: `${data.message.sender} solicitó tu firma para ${data.message.count} certificado(s).`
                    });
                }
            }
            return;
        }

        if (data.message && data.message.action === 'sheet-preview-ready') {
            const tasks = appStore.uploadTasks;
            const existing = tasks.find(t => String(t.id) === String(data.message.cert_id) && t.type === 'sheet');
            if (existing && existing.status === 'canceled') return; // ¡Ignorar si el usuario ya lo canceló!

            appStore.updateUploadTask(data.message.cert_id, 'sheet', {
                status: 'success', url: data.message.url, progress: 100
            });
            return;
        }

        if (data.message && data.message.action === 'sheet-preview-error') {
            const tasks = appStore.uploadTasks;
            const existing = tasks.find(t => String(t.id) === String(data.message.cert_id) && t.type === 'sheet');
            if (existing && existing.status === 'canceled') return; // ¡Ignorar si el usuario ya lo canceló!

            appStore.updateUploadTask(data.message.cert_id, 'sheet', {
                status: 'error', progress: 0
            });
            return;
        }

        if (data.type === 'upload_progress') {
            this.processUploadProgress(data, appStore); 
        }
    },

    processUploadProgress(data, appStore) { 
        const tasks = appStore.uploadTasks;
        const taskType = data.task_type || 'qr';

        // 1. Limpieza masiva (El usuario presionó Cerrar Panel en otra pestaña)
        if (data.status === 'dismiss_all_done') {
            const done = tasks.filter(t => !['generating', 'uploading', 'retrying'].includes(t.status));
            done.forEach(t => appStore.removeUploadTask(t.id, t.type));
            return;
        }

        // 2. Limpieza individual (El usuario presionó la 'X' en otra pestaña)
        if (data.status === 'dismiss_task') {
            appStore.removeUploadTask(data.cert_id, taskType);
            return;
        }

        const taskExists = tasks.some(t => String(t.id) === String(data.cert_id) && t.type === taskType);

        if (!taskExists && data.code) {
            appStore.addUploadTask({ 
                id: data.cert_id, code: data.code, status: data.status, 
                progress: data.progress, attempts: data.attempts, username: data.username,
                type: taskType
            });
        } else if (taskExists) {
            const existing = tasks.find(t => String(t.id) === String(data.cert_id) && t.type === taskType);
            
            // Si estaba cancelado y llega otro estado que NO es 'generating', lo ignoramos
            if (existing && existing.status === 'canceled' && data.status !== 'generating' && data.status !== 'canceled') {
                return;
            }

            // Si P1 mandó a cancelar, disparamos el abort() local en P2 para matar la red también
            if (data.status === 'canceled' && existing.status !== 'canceled') {
                if (taskType === 'qr') {
                    window.dispatchEvent(new CustomEvent('wss-qr-cancel', { detail: { id: data.cert_id } }));
                } else {
                    window.dispatchEvent(new CustomEvent('wss-cancel-sheet-action', { detail: { id: data.cert_id } }));
                }
            }
            
            appStore.updateUploadTask(data.cert_id, taskType, {
                progress: data.progress, 
                status: data.status, 
                attempts: data.attempts,
                step: data.step,            
                error_msg: data.error_msg,
                url: data.url || undefined,
                is_cloud_error: data.is_cloud_error || false,
                offline_url: data.offline_url || null
            });
            //warning proceso qr que si se cargo en nube pero no en local
            if (data.status === 'success' || data.status === 'warning') {
                window.dispatchEvent(new CustomEvent('wss-update-row', { detail: data.cert_id }));
            }
        }
    }
};