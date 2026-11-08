<template>
  <v-card flat class="recuadro-equipos border rounded-lg bg-surface mx-3 mt-1 mb-3">
    <v-toolbar density="compact" flat color="transparent" class="pl-3">
      <div class="d-flex align-center">
        <v-icon start color="primary">mdi-clipboard-list</v-icon>
        <span class="text-subtitle-2 font-weight-bold text-primary">
          Equipos en este Servicio: {{ order.order_number }}
        </span>
        <span v-if="order.created_at" class="text-caption text-medium-emphasis ml-3 mt-1 font-weight-medium d-flex align-center">
          <v-icon size="x-small" class="mr-1">mdi-calendar-blank</v-icon>
          {{ fechaCorta(order.created_at) }}
        </span>
      </div>
      <v-spacer/>
      <v-btn size="x-small" color="primary" variant="flat" class="text-white"
             @click="emit('editar')" :disabled="!viva(order)">
        <v-icon start size="x-small">mdi-pencil</v-icon> Editar orden
      </v-btn>
    </v-toolbar>

    <!-- Los equipos todavia en camino: null mientras se piden. -->
    <div v-if="!order.items" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      <div class="text-caption mt-2 text-medium-emphasis">Cargando detalle de equipos...</div>
    </div>

    <v-table density="compact" :hover="false" v-else class="bg-transparent">
      <thead>
        <tr class="bg-transparent">
          <th class="columna-casilla pr-0">
            <v-checkbox-btn density="compact" :disabled="!marcables.length"
                            :model-value="todosMarcados" :indeterminate="algunosMarcados"
                            @update:model-value="marcarTodos" />
          </th>
          <th class="text-overline">EXPEDIENTE</th>
          <th class="text-overline">EQUIPO</th>
          <th class="text-overline">SERVICIO</th>
          <th class="text-center text-overline">DOCUMENTACIÓN</th>
          <th class="text-center text-overline">ESTADO</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="linea in order.items" :key="linea.id"
            :class="{ 'fila-anulada': lineaAnulada(linea), 'fila-en-menu': enElMenu(linea),
                      'cursor-pointer': linea.certificate && vivo(linea.certificate) }"
            @click="alClicFila($event, linea)"
            @contextmenu="abrirMenu($event, linea, true)">
          <td class="columna-casilla pr-0">
            <v-checkbox-btn v-if="linea.certificate" density="compact" :disabled="!vivo(linea.certificate)"
                            :model-value="estaMarcado(linea.certificate)" @update:model-value="alternar(linea.certificate)" />
          </td>
          <td>
            <template v-if="linea.certificate">
              <strong>{{ linea.certificate.registry_code }}</strong>
              <numeros-anteriores :numeros="linea.certificate.previous_numbers" />
            </template>
            <span v-else class="text-disabled">—</span>
          </td>
          <td>
            <div>{{ linea.equipo }}</div>
            <div v-if="delEquipo(linea)" class="text-caption text-medium-emphasis">{{ delEquipo(linea) }}</div>
          </td>
          <td class="text-medium-emphasis">{{ tituloDe(servicioDe(linea), opciones) }}</td>

          <td class="text-center">
            <div v-if="linea.certificate" class="d-flex justify-center align-center">
              <v-btn
                icon variant="text" density="comfortable" size="x-small" class="mx-1"
                :href="linea.certificate.uploaded_xls_url || undefined"
                target="_blank"
                :disabled="!tieneExcelBase(linea.certificate)"
              >
                <v-icon :color="tieneExcelBase(linea.certificate) ? 'primary' : 'grey-lighten-1'">
                  mdi-file-pdf-box
                </v-icon>
              </v-btn>

              <v-tooltip location="bottom" :disabled="!linkDe(linea.certificate)">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon variant="text" density="comfortable" size="x-small" class="mx-1"
                    :href="linkDe(linea.certificate) || undefined"
                    target="_blank"
                    :disabled="!linkDe(linea.certificate)"
                    @click.stop="onNubeClick($event, linea.certificate)"
                  >
                    <v-icon :color="linkDe(linea.certificate) ? 'primary' : 'grey-lighten-1'">
                      mdi-cloud-check
                    </v-icon>
                  </v-btn>
                </template>
                <span>
                  Ver PDF en Nube Pública
                  <template v-if="estaEntregado(linea.certificate)"><br>Entregado el {{ fechaCorta(linea.certificate.sent_date) }}</template>
                  <br><small>Ctrl+clic: copiar link</small>
                </span>
              </v-tooltip>
            </div>
          </td>

          <td class="text-center">
            <v-chip size="x-small" :color="avanceDeLinea(linea).color" variant="outlined" label
                    :title="linea.completado ? `Completado el ${fechaCorta(linea.completado)}` : undefined">
              {{ avanceDeLinea(linea).texto }}
            </v-chip>
          </td>

          <td class="text-center">
            <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" size="x-small" color="grey-darken-1"
                   :disabled="!accionesDeLaFila(linea).length" @click.stop="abrirMenu($event, linea)" />
          </td>
        </tr>
        <tr v-if="order.items.length === 0">
          <td colspan="7" class="text-center text-grey py-6 font-weight-medium">
            No se encontraron equipos registrados en este expediente.
          </td>
        </tr>
      </tbody>
    </v-table>

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />
    <action-menu v-model:menu="menuDeLinea" :acciones="accionesDeLinea(menuDeLinea.filas)"
                 @accion="clave => accionDeLinea(clave, menuDeLinea.filas[0])" />
    <dialog-servicio-de-linea v-model="cambiandoServicio" @cambiado="emit('lineas-cambiaron')" />

    <selection-bar :count="seleccion.length" label="equipo(s)"
                   :acciones="accionesDe(seleccion)"
                   @accion="clave => ejecutarAccion(clave, [...seleccion])"
                   @clear="seleccion = []" />
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'
import { useContextMenu } from '@/composables/useContextMenu'
import { useCertificateActions } from '@/composables/useCertificateActions'
import { useActionCall } from '@/composables/useActionCall'
import { tituloDe, useOrderServices } from '@/composables/useOrderServices'
import OrderDataService from '@/services/orders/orderDataService'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_CERTIFICADO, algunoVivo } from '@/utils/certificates/acciones'
import { estaEntregado } from '@/utils/certificates/entrega'
import { vivo } from '@/utils/certificates/estado'
import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { ACCIONES_LINEA, avanceDeLinea, certificadosDe, lineaAnulada, servicioDe } from '@/utils/orders/lineas'
import { viva } from '@/utils/orders/estado'
import { fechaCorta } from '@/utils/dates'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import SelectionBar from '@/components/commonComponents/SelectionBar.vue'
import NumerosAnteriores from '@/components/shared/NumerosAnteriores.vue'
import DialogServicioDeLinea from './DialogServicioDeLinea.vue'

const props = defineProps({
  order: { type: Object, required: true },
})
const emit = defineEmits(['editar', 'edit-certificate', 'accion-certificados', 'lineas-cambiaron'])

// La guarda la pantalla de ordenes: marcar equipos y marcar ordenes se excluyen.
// Se marcan certificados: las acciones en lote son de certificados.
const seleccion = defineModel('seleccion', { type: Array, required: true })

const router = useRouter()
const { hasAction } = usePermissions()
const { opciones } = useOrderServices()

const certificados = computed(() => certificadosDe(props.order.items))
const delEquipo = (linea) => [linea.marca, linea.modelo, linea.serie].filter(Boolean).join(' · ')

// Como en Certificados, un anulado no se marca.
const marcables = computed(() => certificados.value.filter(vivo))
const estaMarcado = (cert) => seleccion.value.some(c => c.id === cert.id)
const todosMarcados = computed(() => marcables.value.length > 0 && seleccion.value.length === marcables.value.length)
const algunosMarcados = computed(() => seleccion.value.length > 0 && !todosMarcados.value)

const marcarTodos = (si) => { seleccion.value = si ? [...marcables.value] : [] }

function alternar (cert) {
  if (!vivo(cert)) return
  seleccion.value = estaMarcado(cert)
    ? seleccion.value.filter(c => c.id !== cert.id)
    : [...seleccion.value, cert]
}

function alClicFila (event, linea) {
  if (!linea.certificate || event.target.closest('button, a, .v-btn, .v-selection-control')) return
  alternar(linea.certificate)
}

// Los equipos llegan de nuevo cuando cambian: la seleccion pasa a los
// actuales, y se van los que se anularon o salieron de la orden.
watch(certificados, (certs) => {
  const vivos = new Map(certs.filter(vivo).map(c => [c.id, c]))
  const actuales = seleccion.value.map(c => vivos.get(c.id)).filter(Boolean)
  if (actuales.length !== seleccion.value.length || actuales.some((c, i) => c !== seleccion.value[i])) {
    seleccion.value = actuales
  }
})

// Las de certificados, mas las que solo tienen sentido dentro de una orden. Cambiar el
// servicio va con el trabajo, antes de las peligrosas.
const peligrosa = (a) => a.grupo === 'peligro'
const ACCIONES_EQUIPO = [
  {
    clave: 'ir', grupo: 'ver', varios: false,
    icono: 'mdi-open-in-new', texto: 'Ir al certificado',
    visible: algunoVivo,
  },
  ...ACCIONES_CERTIFICADO.filter(a => !peligrosa(a)),
  {
    clave: 'servicio', grupo: 'trabajo', varios: false,
    icono: 'mdi-swap-horizontal', texto: 'Cambiar servicio',
    visible: algunoVivo,
  },
  ...ACCIONES_CERTIFICADO.filter(peligrosa),
  {
    clave: 'desvincular', grupo: 'peligro', varios: true,
    icono: 'mdi-link-variant-off', texto: 'Desvincular de la orden',
    visible: algunoVivo,
  },
]
const accionesDe = (certs) => accionesPara(ACCIONES_EQUIPO, certs, hasAction)
const accionesDeLinea = (lineas) => accionesPara(ACCIONES_LINEA, lineas, hasAction)
const accionesDeLaFila = (linea) => (linea.certificate ? accionesDe([linea.certificate]) : accionesDeLinea([linea]))

// El menu de un marcado es de todos los marcados; el de otro, solo de ese y
// sin marcarlo. Una linea sin certificado tiene el suyo, de ella sola.
const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(seleccion, { marca: false })
const {
  menu: menuDeLinea, alClickDerecho: clickDerechoEnLinea, alBotonDeFila: botonDeLinea, estaEnElMenu: lineaEnElMenu,
} = useContextMenu()

function abrirMenu (event, linea, derecho = false) {
  if (linea.certificate) {
    return derecho ? alClickDerecho(event, { item: linea.certificate }) : alBotonDeFila(event, linea.certificate)
  }
  return derecho ? clickDerechoEnLinea(event, { item: linea }) : botonDeLinea(event, linea)
}
const enElMenu = (linea) => (linea.certificate ? estaEnElMenu(linea.certificate) : lineaEnElMenu(linea))

const { ejecutarAccion: accionDeCertificado, copiarLinks, linkDe } = useCertificateActions({
  abrirLote: (clave, certs) => emit('accion-certificados', clave, certs),
  abrirFicha: (cert) => emit('edit-certificate', cert),
})
const { llamarSinPreguntar, confirmarYLlamar } = useActionCall()

// La linea a la que se le cambia el servicio, con su dialogo abierto.
const cambiandoServicio = ref(null)
const lineaDe = (cert) => props.order.items.find(l => l.certificate?.id === cert.id)

function ejecutarAccion (clave, certs) {
  const [cert] = certs
  if (clave === 'ir') return irACertificado(cert)
  if (clave === 'servicio') {
    cambiandoServicio.value = lineaDe(cert)
    return
  }
  accionDeCertificado(clave, certs)
}

async function accionDeLinea (clave, linea) {
  if (clave === 'servicio') {
    cambiandoServicio.value = linea
    return
  }
  const hecho = clave === 'completar'
    ? await llamarSinPreguntar(() => OrderDataService.completarLinea(linea.id, !linea.completado),
      linea.completado ? 'Se quitó el completado' : 'Marcado como completado', 'No se pudo cambiar la línea.')
    : await confirmarYLlamar({
      titulo: '¿Eliminar el equipo de la orden?', texto: `${linea.equipo} se elimina de ${props.order.order_number}.`,
      boton: 'Eliminar', llamar: () => OrderDataService.eliminarLinea(linea.id),
      exito: 'Equipo eliminado de la orden', fallo: 'No se pudo eliminar el equipo.',
    })
  if (hecho) emit('lineas-cambiaron')
}

// Clic normal en el botón de nube: abre el PDF (href). Ctrl/Cmd+clic: copia el link.
function onNubeClick (event, cert) {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    copiarLinks([cert])
  }
}

function irACertificado (cert) {
  router.push({ path: '/certificates', query: { correlativo: cert.correlative } }).catch(() => {})
}
</script>

<style scoped>
.fila-anulada {
  opacity: 0.5;
}
/* Lo justo para la casilla: el resto del ancho es para los datos. */
.columna-casilla {
  width: 1%;
}
.text-overline {
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px !important;
  color: #757575 !important;
}
.justify-center.align-center .v-btn {
  margin: 0 2px;
}
</style>