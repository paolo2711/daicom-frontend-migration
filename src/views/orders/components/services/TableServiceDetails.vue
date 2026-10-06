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
             @click="emit('add-extra')" :disabled="!viva(order)">
        <v-icon start size="x-small">mdi-plus</v-icon> Añadir Equipo Extra
      </v-btn>
    </v-toolbar>

    <!-- Los equipos todavia en camino: null mientras se piden. -->
    <div v-if="!order.certificates" class="pa-6 text-center">
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
          <th class="text-center text-overline">DOCUMENTACIÓN</th>
          <th class="text-center text-overline">ESTADO</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cert in order.certificates" :key="cert.id"
            :class="{ 'fila-anulada': !vivo(cert), 'fila-en-menu': estaEnElMenu(cert), 'cursor-pointer': vivo(cert) }"
            @click="alClicFila($event, cert)"
            @contextmenu="alClickDerecho($event, { item: cert })">
          <td class="columna-casilla pr-0">
            <v-checkbox-btn density="compact" :disabled="!vivo(cert)" :model-value="estaMarcado(cert)"
                            @update:model-value="alternar(cert)" />
          </td>
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
            <v-chip size="x-small" :color="avanceDe(cert).color" variant="outlined" label>
              {{ avanceDe(cert).texto }}
            </v-chip>
          </td>

          <td class="text-center">
            <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" size="x-small" color="grey-darken-1"
                   :disabled="!accionesDe([cert]).length" @click.stop="alBotonDeFila($event, cert)" />
          </td>
        </tr>
        <tr v-if="!order.certificates || order.certificates.length === 0">
          <td colspan="6" class="text-center text-grey py-6 font-weight-medium">
            No se encontraron equipos registrados en este expediente.
          </td>
        </tr>
      </tbody>
    </v-table>

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => ejecutarAccion(clave, menu.filas)" />

    <selection-bar :count="seleccion.length" label="equipo(s)"
                   :acciones="accionesDe(seleccion)"
                   @accion="clave => ejecutarAccion(clave, [...seleccion])"
                   @clear="seleccion = []" />
  </v-card>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'
import { useContextMenu } from '@/composables/useContextMenu'
import { useCertificateActions } from '@/composables/useCertificateActions'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_CERTIFICADO, algunoVivo } from '@/utils/certificates/acciones'
import { avanceDe } from '@/utils/certificates/avance'
import { estaEntregado } from '@/utils/certificates/entrega'
import { vivo } from '@/utils/certificates/estado'
import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { viva } from '@/utils/orders/estado'
import { fechaCorta } from '@/utils/dates'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import SelectionBar from '@/components/commonComponents/SelectionBar.vue'
import NumerosAnteriores from '@/components/shared/NumerosAnteriores.vue'

const props = defineProps({
  order: { type: Object, required: true },
})
const emit = defineEmits(['add-extra', 'edit-certificate', 'accion-certificados'])

// La guarda la pantalla de ordenes: marcar equipos y marcar ordenes se excluyen.
const seleccion = defineModel('seleccion', { type: Array, required: true })

const router = useRouter()
const { hasAction } = usePermissions()

// Como en Certificados, un anulado no se marca.
const marcables = computed(() => (props.order.certificates || []).filter(vivo))
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

function alClicFila (event, cert) {
  if (event.target.closest('button, a, .v-btn, .v-selection-control')) return
  alternar(cert)
}

// Los equipos llegan de nuevo cuando cambian: la seleccion pasa a los
// actuales, y se van los que se anularon o salieron de la orden.
watch(() => props.order.certificates, (certs) => {
  const vivos = new Map((certs || []).filter(vivo).map(c => [c.id, c]))
  const actuales = seleccion.value.map(c => vivos.get(c.id)).filter(Boolean)
  if (actuales.length !== seleccion.value.length || actuales.some((c, i) => c !== seleccion.value[i])) {
    seleccion.value = actuales
  }
})

// Las de certificados, mas las que solo tienen sentido dentro de una orden.
const ACCIONES_EQUIPO = [
  {
    clave: 'ir', grupo: 'ver', varios: false,
    icono: 'mdi-open-in-new', texto: 'Ir al certificado',
    visible: algunoVivo,
  },
  ...ACCIONES_CERTIFICADO,
  {
    clave: 'desvincular', grupo: 'peligro', varios: true,
    icono: 'mdi-link-variant-off', texto: 'Desvincular de la orden',
    visible: algunoVivo,
  },
]
const accionesDe = (certs) => accionesPara(ACCIONES_EQUIPO, certs, hasAction)

// El menu de un marcado es de todos los marcados; el de otro, solo de ese y
// sin marcarlo.
const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu(seleccion, { marca: false })

const { ejecutarAccion: accionDeCertificado, copiarLinks, linkDe } = useCertificateActions({
  abrirLote: (clave, certs) => emit('accion-certificados', clave, certs),
  abrirFicha: (cert) => emit('edit-certificate', cert),
})

function ejecutarAccion (clave, certs) {
  const [cert] = certs
  if (clave === 'ir') return irACertificado(cert)
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