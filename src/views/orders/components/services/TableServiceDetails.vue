<template>
  <v-card flat tile color="transparent" class="elevation-0">
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
      <div class="d-flex align-center ga-2">
        <action-group :acciones="accionesDeCertificados" etiqueta="Acciones en lote"
                      @accion="clave => emit('accion-certificados', clave, order.certificates)" />
        <v-btn size="x-small" color="primary" variant="flat" class="text-white"
               @click="emit('add-extra')" :disabled="order.status === 4">
          <v-icon start size="x-small">mdi-plus</v-icon> Añadir Equipo Extra
        </v-btn>
      </div>
    </v-toolbar>

    <!-- Los equipos todavia en camino: null mientras se piden. -->
    <div v-if="!order.certificates" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      <div class="text-caption mt-2 text-medium-emphasis">Cargando detalle de equipos...</div>
    </div>

    <v-table density="compact" :hover="false" v-else class="bg-transparent">
      <thead>
        <tr class="bg-transparent">
          <th class="text-overline">EXPEDIENTE</th>
          <th class="text-overline">EQUIPO</th>
          <th class="text-center text-overline">DOCUMENTACIÓN</th>
          <th class="text-center text-overline">ESTADO</th>
          <th class="text-center text-overline"><v-icon size="small">mdi-dots-vertical</v-icon></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cert in order.certificates" :key="cert.id"
            :class="{ 'fila-anulada': cert.status === ANULADO, 'fila-en-menu': estaEnElMenu(cert) }"
            @contextmenu="alClickDerecho($event, { item: cert })">
          <td>
            <strong>{{ cert.registry_code }}</strong>
            <numeros-anteriores :numeros="cert.previous_numbers" />
          </td>
          <td>{{ cert.equipment }}</td>

          <td class="text-center">
            <div class="d-flex justify-center align-center">
              <v-btn 
                icon variant="text" density="comfortable" size="x-small" class="mx-1"
                :href="cert.uploaded_xls_url || undefined"
                target="_blank"
                :disabled="!tieneExcelBase(cert)"
              >
                <v-icon :color="tieneExcelBase(cert) ? 'primary' : 'grey-lighten-1'">
                  mdi-file-pdf-box
                </v-icon>
              </v-btn>

              <v-tooltip location="bottom" :disabled="!linkDe(cert)">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon variant="text" density="comfortable" size="x-small" class="mx-1"
                    :href="linkDe(cert) || undefined"
                    target="_blank"
                    :disabled="!linkDe(cert)"
                    @click.stop="onNubeClick($event, cert)"
                  >
                    <v-icon :color="linkDe(cert) ? 'primary' : 'grey-lighten-1'">
                      mdi-cloud-check
                    </v-icon>
                  </v-btn>
                </template>
                <span>
                  Ver PDF en Nube Pública
                  <template v-if="estaEntregado(cert)"><br>Entregado el {{ fechaCorta(cert.sent_date) }}</template>
                  <br><small>Ctrl+clic: copiar link</small>
                </span>
              </v-tooltip>
            </div>
          </td>

          <td class="text-center">
            <v-chip size="x-small" :color="estadoCert(cert).color" variant="outlined" label>
              {{ estadoCert(cert).texto }}
            </v-chip>
          </td>

          <td class="text-center">
            <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" size="x-small" color="grey-darken-1"
                   @click.stop="alBotonDeFila($event, cert)" />
          </td>
        </tr>
        <tr v-if="!order.certificates || order.certificates.length === 0">
          <td colspan="5" class="text-center text-grey py-6 font-weight-medium">
            No se encontraron equipos registrados en este expediente.
          </td>
        </tr>
      </tbody>
    </v-table>

    <action-menu :menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from '@/plugins/alerts'
import CertificateDataService from '@/services/certificates/certificateDataService'
import { useSwal } from '@/composables/useSwal'
import { usePermissions } from '@/composables/usePermissions'
import { useContextMenu } from '@/composables/useContextMenu'
import { useCertificateActions } from '@/composables/useCertificateActions'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_CERTIFICADO } from '@/utils/certificates/acciones'
import { estaEntregado } from '@/utils/certificates/entrega'
import { ANULADO, ESTADOS, NUBE_DESACTUALIZADA } from '@/utils/certificates/estado'
import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { mensajeDeError } from '@/utils/errors'
import { fechaCorta } from '@/utils/dates'
import ActionGroup from '@/components/shared/ActionGroup.vue'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import NumerosAnteriores from '@/components/shared/NumerosAnteriores.vue'

const props = defineProps({
  order: { type: Object, required: true },
})
const emit = defineEmits(['add-extra', 'edit-certificate', 'accion-certificados'])

const router = useRouter()
const swal = useSwal()
const { hasAction } = usePermissions()

// `clave` tiene que coincidir con las de ACCIONES del modal de lote. Sin
// `permiso`, la ven todos.
const ACCIONES_EN_LOTE = [
  { clave: 'notify',  texto: 'Solicitar Firmas',  icono: 'mdi-bell-ring',                    color: 'orange-darken-3', permiso: 1005 },
  { clave: 'entrega', texto: 'Marcar Entregados', icono: 'mdi-package-variant-closed-check', color: 'teal-darken-2',   permiso: 1010 },
  { clave: 'qr',      texto: 'Firmar QR',         icono: 'mdi-qrcode-scan',                  color: 'primary',         permiso: 1001 },
  { clave: 'tipo',    texto: 'Corregir Tipo',     icono: 'mdi-swap-horizontal',              color: 'indigo' },
]

const accionesDeCertificados = computed(() => {
  const sinEquipos = props.order.status === 4 || !props.order.certificates?.length
  return ACCIONES_EN_LOTE.map(accion => ({
    ...accion,
    visible: !accion.permiso || hasAction(accion.permiso),
    disabled: sinEquipos,
  }))
})

// Las de certificados, mas las que solo tienen sentido dentro de una orden.
const vivo = (cert) => cert.status !== ANULADO
const ACCIONES_EQUIPO = [
  {
    clave: 'ir', grupo: 'ver', varios: false,
    icono: 'mdi-open-in-new', texto: 'Ir al certificado',
    disponible: ([cert]) => vivo(cert),
  },
  ...ACCIONES_CERTIFICADO,
  {
    clave: 'desvincular', grupo: 'peligro', varios: false,
    icono: 'mdi-link-variant-off', texto: 'Desvincular de la orden',
    disponible: ([cert]) => vivo(cert),
  },
]
const accionesDe = (certs) => accionesPara(ACCIONES_EQUIPO, certs, hasAction)

// Los equipos no se marcan: el menu es del que se toco.
const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu()

const { ejecutarAccion: accionDeCertificado, copiarLinks, linkDe } = useCertificateActions({
  abrirLote: (clave, certs) => emit('accion-certificados', clave, certs),
  abrirFicha: (cert) => emit('edit-certificate', cert),
})

function ejecutarAccion (clave, certs) {
  const [cert] = certs
  if (clave === 'ir') return irACertificado(cert)
  if (clave === 'desvincular') return desvincular(cert)
  accionDeCertificado(clave, certs)
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

// Texto y color juntos: son el mismo estado.
function estadoCert (cert) {
  if (cert.status === ANULADO) return { texto: 'ANULADO', color: 'red-darken-2' }
  if (cert.status === NUBE_DESACTUALIZADA) return ESTADOS[NUBE_DESACTUALIZADA]
  if (estaEntregado(cert)) return { texto: 'Entregado', color: 'teal-darken-2' }
  if (cert.uploaded) return { texto: 'Listo', color: 'success' }
  if (cert.signature_requested) return { texto: 'Firma solicitada', color: 'warning' }
  if (tieneExcelBase(cert)) return { texto: 'En Proceso', color: 'warning' }
  return { texto: 'Borrador', color: 'grey-darken-1' }
}

async function desvincular (cert) {
  const { isConfirmed } = await swal.fire({
    title: '¿Desvincular este equipo?',
    text: `${cert.registry_code} quedará sin orden y saldrá de esta.`,
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Sí, desvincular', cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return
  try {
    await CertificateDataService.patch(cert.id, { order: null })
    Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo desvinculado' })
  } catch (err) {
    swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, 'No se pudo desvincular el equipo.') })
  }
}
</script>

<style scoped>
.fila-anulada {
  opacity: 0.5;
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