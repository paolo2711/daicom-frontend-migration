import VueSweetalert2 from "vue-sweetalert2"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css" // CSS Nativo de SWAL

const options = {
    target: '#app', 
    confirmButtonColor: '#1E8449', // variables.success
    cancelButtonColor: '#fc4b6c',  // variables.accent
    reverseButtons: true,
    allowOutsideClick: () => {
        const popup = Swal.getPopup()
        if (popup) {
            popup.classList.remove('swal2-show')
            setTimeout(() => {
                popup.classList.add('animate__animated', 'animate__shakeX')
            })
            setTimeout(() => {
                popup.classList.remove('animate__animated', 'animate__shakeX')
            }, 500)
        }
        return false
    },
    scrollbarPadding: false,
}

export default function registerAlerts(app) {
    app.use(VueSweetalert2, options)
}

// Toast canónico de la app. Se basa en el Swal BASE (no en el mixin global de
// modales), por lo que NO arrastra `allowOutsideClick` — ese parámetro es solo
// para diálogos de confirmación y es incompatible con los toasts (genera
// warnings en consola). Todos los toasts deben dispararse con `Toast.fire(...)`
// pasando únicamente lo que varía: icon, title, text y, si hace falta, timer.
export const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
})