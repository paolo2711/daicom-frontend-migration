<template>
  <div v-if="!abierta" class="portada">
    <router-link v-for="s in SECCIONES" :key="s.clave" :to="{ name: 'Company', params: { seccion: s.clave } }"
                 class="hoja tarjeta-de-seccion text-left">
      <themed-illustration :nombre="s.ilustracion" class="dibujo-de-seccion" />
      <span class="d-flex flex-column">
        <span class="font-weight-bold">{{ s.titulo }}</span>
        <span class="text-body-2 text-medium-emphasis">{{ cargando ? 'Cargando…' : s.resumen(estado[s.clave].datos) }}</span>
      </span>
      <v-icon class="ml-auto text-medium-emphasis">mdi-chevron-right</v-icon>
    </router-link>
  </div>

  <div v-else class="d-flex flex-column ga-3">
    <div>
      <v-btn variant="text" prepend-icon="mdi-chevron-left" :to="{ name: 'Company' }">Empresa</v-btn>
    </div>

    <v-form ref="formulario" @submit.prevent>
      <settings-section :titulo="seccion.titulo" :icono="seccion.icono" :cambiado="cambiado(abierta)"
                        :guardando="guardando" @deshacer="deshacer(abierta)" @guardar="guardar">

        <template v-if="abierta === 'datos'">
          <v-row dense>
            <v-col cols="12" md="8">
              <v-text-field v-model="d.name" label="Nombre (*)" counter="120" :rules="reglas.nombre"
                            v-bind="CAMPO_DE_FORMULARIO"
                            @keypress="letraOEspacio" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="d.document" label="RUC" counter="11" :rules="reglas.documento"
                            v-bind="CAMPO_DE_FORMULARIO"
                            @keypress="digito" />
            </v-col>
            <v-col cols="12" md="8">
              <v-text-field v-model="d.address" label="Dirección" counter="200" :rules="reglas.direccion"
                            v-bind="CAMPO_DE_FORMULARIO"
                            @keypress="letraODigito" />
            </v-col>
            <v-col cols="12" md="4">
              <ubigeo-field v-model="d.ubigeo" label="Ubigeo del domicilio fiscal" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="d.phone" label="Teléfono" counter="20" :rules="reglas.telefono"
                            v-bind="CAMPO_DE_FORMULARIO"
                            @keypress="digito" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="d.email" label="Correo" :rules="reglas.correo" v-bind="CAMPO_DE_FORMULARIO" />
            </v-col>
          </v-row>
          <file-preview-field v-model="archivos.image" class="imagen" etiqueta="Logotipo" :actual="d.image" />
        </template>

        <template v-else-if="abierta === 'facturacion'">
          <div class="text-caption text-warning">{{ AVISO_CORRELATIVO }}</div>
          <v-row dense>
            <template v-for="[serie, correlativo, nombre, ejemplo] in SERIES" :key="serie">
              <v-col cols="5" md="2">
                <v-text-field v-model="d[serie]" :label="`Serie de ${nombre}`" maxlength="4" :placeholder="ejemplo"
                              v-bind="CAMPO_DE_FORMULARIO" />
              </v-col>
              <v-col cols="7" md="2">
                <v-text-field v-model="d[correlativo]" :label="`Siguiente ${nombre}`" type="number" min="1"
                              :rules="reglas.correlativo" v-bind="CAMPO_DE_FORMULARIO" @keypress="digito" />
              </v-col>
            </template>
          </v-row>
          <div class="titulo-de-seccion">Cuentas que imprime la factura</div>
          <v-text-field v-model="d.detraction_account" label="Cuenta de detracciones" maxlength="30"
                        hint="Banco de la Nación · también va a SUNAT" persistent-hint
                        v-bind="CAMPO_DE_FORMULARIO" class="campo-corto" />
          <div v-if="!d.bank_accounts.length" class="text-caption text-medium-emphasis">
            Sin cuentas: la factura no las imprime.
          </div>
          <div v-for="(cuenta, i) in d.bank_accounts" :key="i" class="seccion cuenta">
            <v-row dense class="align-center">
              <v-col cols="12" md="3">
                <v-text-field v-model="cuenta.banco" label="Banco" v-bind="CAMPO_DE_FORMULARIO" />
              </v-col>
              <v-col cols="6" md="2">
                <v-select v-model="cuenta.moneda" :items="['Soles', 'Dólares']" label="Moneda"
                          v-bind="CAMPO_DE_FORMULARIO" />
              </v-col>
              <v-col cols="6" md="2">
                <v-select v-model="cuenta.tipo" :items="['Cta. corriente', 'Cta. ahorros']" label="Tipo"
                          v-bind="CAMPO_DE_FORMULARIO" />
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field v-model="cuenta.numero" label="Número" v-bind="CAMPO_DE_FORMULARIO" />
              </v-col>
              <v-col cols="11" md="2">
                <v-text-field v-model="cuenta.cci" label="CCI" v-bind="CAMPO_DE_FORMULARIO" />
              </v-col>
              <v-col cols="1" class="text-right">
                <v-btn icon="mdi-delete" variant="text" color="red" size="small" title="Quitar la cuenta"
                       @click="d.bank_accounts.splice(i, 1)" />
              </v-col>
            </v-row>
          </div>
          <div>
            <v-btn variant="tonal" prepend-icon="mdi-plus" @click="d.bank_accounts.push(cuentaVacia())">Agregar cuenta</v-btn>
          </div>
          <file-preview-field v-model="archivos.bank_accounts_image" class="imagen" etiqueta="Imagen de las cuentas"
                              :actual="d.bank_accounts_image" icono="mdi-bank-outline" />
        </template>

        <template v-else-if="abierta === 'certificados'">
          <div class="text-caption text-warning">{{ AVISO_CORRELATIVO }}</div>
          <v-row dense>
            <v-col v-for="[campo, nombre] in CORRELATIVOS_DE_CERTIFICADO" :key="campo" cols="12" md="4">
              <v-text-field v-model="d[campo]" :label="nombre" type="number" min="1" :rules="reglas.correlativo"
                            v-bind="CAMPO_DE_FORMULARIO" @keypress="digito" />
            </v-col>
          </v-row>
          <div class="archivos">
            <file-preview-field v-model="archivos.plantilla_acr" etiqueta="Plantilla ACR (PDF, sin sello)"
                                :actual="d.plantilla_acr" accept="application/pdf" icono="mdi-file-pdf-box" />
            <file-preview-field v-model="archivos.plantilla_nacr" etiqueta="Plantilla NACR (PDF, sin sello)"
                                :actual="d.plantilla_nacr" accept="application/pdf" icono="mdi-file-pdf-box" />
            <file-preview-field v-model="archivos.sello" etiqueta="Sello del metrólogo (PNG con fondo transparente)"
                                :actual="d.sello" accept="image/png" icono="mdi-stamper" />
          </div>
        </template>

        <template v-else-if="abierta === 'numeracion'">
          <div class="text-caption text-warning">{{ AVISO_CORRELATIVO }}</div>
          <v-row dense>
            <v-col v-for="[campo, nombre] in NUMERACION" :key="campo" cols="12" md="4">
              <v-text-field v-model="d[campo]" :label="nombre" type="number" min="1" :rules="reglas.correlativo"
                            v-bind="CAMPO_DE_FORMULARIO" @keypress="digito" />
            </v-col>
          </v-row>
        </template>

      </settings-section>
    </v-form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import { Toast } from '@/plugins/alerts'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/appStore'
import { useLeaveGuard, useUnsavedChanges } from '@/composables/useUnsavedChanges'
import CompanyRules from '@/validators/rules/companyRules'
import Characters from '@/validators/commonValidators/characters'
import CompanyDataService from '@/services/company/companyDataService'
import CompanyMappers from '@/mappers/companyMappers'
import { mensajeDeError } from '@/utils/errors'
import { CAMPO_DE_FORMULARIO } from '@/utils/fields'
import SettingsSection from '@/components/shared/SettingsSection.vue'
import FilePreviewField from '@/components/shared/FilePreviewField.vue'
import UbigeoField from '@/components/shared/UbigeoField.vue'
import ThemedIllustration from '@/components/shared/ThemedIllustration.vue'

const appStore = useAppStore()
const AVISO_CORRELATIVO = 'Es el número que sale en el próximo documento: cambiarlo puede saltar o repetir números.'
const cuentaVacia = () => ({ banco: '', moneda: 'Soles', tipo: 'Cta. corriente', numero: '', cci: '' })

const SERIES = [
  ['invoice_series', 'invoice_correlative', 'factura', 'F004'],
  ['credit_note_series', 'credit_note_correlative', 'nota de crédito', 'F005'],
  ['dispatch_series', 'dispatch_correlative', 'guía', 'T003'],
]
const CORRELATIVOS_DE_CERTIFICADO = [
  ['accredited_correlative', 'Siguiente acreditado'], ['non_accredited_correlative', 'Siguiente no acreditado'],
  ['operationality_correlative', 'Siguiente de operatividad'],
]
const NUMERACION = [
  ['quote_correlative', 'Siguiente cotización'], ['valuation_correlative', 'Siguiente valorización'],
  ['order_service_correlative', 'Siguiente orden de servicio'], ['order_rental_correlative', 'Siguiente orden de alquiler'],
  ['inventory_correlative', 'Siguiente de inventario (DAI-XXX)'],
]

// Cada seccion: sus campos, sus archivos y la linea que la resume en la portada.
const SECCIONES = [
  {
    clave: 'datos', ilustracion: 'datos-empresa', titulo: 'Datos de la empresa', icono: 'mdi-domain',
    campos: ['name', 'document', 'address', 'ubigeo', 'phone', 'email', 'image'], archivos: ['image'],
    resumen: (d) => [d.name, d.document && `RUC ${d.document}`].filter(Boolean).join(' · '),
  },
  {
    clave: 'facturacion', ilustracion: 'facturacion', titulo: 'Facturación', icono: 'mdi-receipt-text-outline',
    campos: [...SERIES.flatMap(([serie, correlativo]) => [serie, correlativo]), 'detraction_account', 'bank_accounts',
      'bank_accounts_image'],
    archivos: ['bank_accounts_image'],
    resumen: (d) => `${d.invoice_series || 'Sin serie'} · sigue el ${d.invoice_correlative || '—'} · ${d.bank_accounts.length} cuenta(s)`,
  },
  {
    clave: 'certificados', ilustracion: 'certificados', titulo: 'Certificados', icono: 'mdi-certificate-outline',
    campos: [...CORRELATIVOS_DE_CERTIFICADO.map(([c]) => c), 'plantilla_acr', 'plantilla_nacr', 'sello'],
    archivos: ['plantilla_acr', 'plantilla_nacr', 'sello'],
    resumen: (d) => [d.sello ? 'Con sello' : 'Sin sello',
      d.plantilla_acr && d.plantilla_nacr ? 'plantillas ACR y NACR' : 'falta una plantilla'].join(' · '),
  },
  {
    clave: 'numeracion', ilustracion: 'numeracion', titulo: 'Numeración', icono: 'mdi-numeric',
    campos: NUMERACION.map(([c]) => c),
    archivos: [],
    resumen: (d) => `Orden ${d.order_service_correlative || '—'} · cotización ${d.quote_correlative || '—'} · alquiler ${d.order_rental_correlative || '—'}`,
  },
]

const vacios = (campos) => Object.fromEntries(campos.map(c => [c, c === 'bank_accounts' ? [] : '']))
const estado = Object.fromEntries(SECCIONES.map(s => [s.clave, {
  ...useUnsavedChanges(vacios(s.campos)),
  archivos: reactive(Object.fromEntries(s.archivos.map(c => [c, null]))),
}]))
const cambiado = (clave) => estado[clave].cambiado.value || Object.values(estado[clave].archivos).some(Boolean)
useLeaveGuard(() => SECCIONES.some(s => cambiado(s.clave)))

// La seccion abierta va en la ruta (/company/facturacion): tiene su link y Atras vuelve a la portada.
const route = useRoute()
const abierta = computed(() => (SECCIONES.some(s => s.clave === route.params.seccion) ? route.params.seccion : null))
const seccion = computed(() => SECCIONES.find(s => s.clave === abierta.value))
const d = computed(() => estado[abierta.value].datos)
const archivos = computed(() => estado[abierta.value].archivos)
const cargando = ref(true)
const guardando = ref(false)
const formulario = ref(null)

const reglas = {
  nombre: CompanyRules.name_rules(), documento: CompanyRules.document_rules(), direccion: CompanyRules.address_rules(),
  telefono: CompanyRules.phone_rules(), correo: CompanyRules.email_rules(), correlativo: CompanyRules.correlative_rules(),
}

function fijarTodo (empresa) {
  const valores = CompanyMappers.putMap(empresa)
  for (const s of SECCIONES) {
    estado[s.clave].fijar(Object.fromEntries(s.campos.map(c => [c, valores[c] ?? vacios([c])[c]])))
  }
}

async function cargar () {
  cargando.value = true
  try {
    fijarTodo((await CompanyDataService.get()).data)
  } finally {
    cargando.value = false
  }
}

function deshacer (clave) {
  estado[clave].deshacer()
  for (const c in estado[clave].archivos) estado[clave].archivos[c] = null
  formulario.value?.resetValidation()
}

// Dejar la seccion con cambios, por «Empresa» o por Atras, pregunta antes.
onBeforeRouteUpdate(async () => {
  const dejada = abierta.value
  if (!dejada || !cambiado(dejada)) return true
  const { isConfirmed } = await Swal.fire({
    icon: 'warning', title: '¿Volver sin guardar?', text: 'Lo que cambiaste en esta sección se pierde.',
    showCancelButton: true, confirmButtonText: 'Volver', cancelButtonText: 'Seguir editando',
  })
  if (isConfirmed) deshacer(dejada)
  return isConfirmed
})

// Manda solo los campos de la seccion; un archivo, solo si se eligio uno nuevo.
async function guardar () {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  const s = seccion.value
  const datos = new FormData()
  for (const campo of s.campos.filter(c => !s.archivos.includes(c))) {
    const valor = d.value[campo]
    datos.append(campo, campo === 'bank_accounts' ? JSON.stringify(valor) : (valor ?? ''))
  }
  for (const [campo, archivo] of Object.entries(archivos.value)) if (archivo) datos.append(campo, archivo)

  guardando.value = true
  try {
    await CompanyDataService.update(datos)
    fijarTodo((await CompanyDataService.get()).data)
    for (const c in archivos.value) archivos.value[c] = null
    Toast.fire({ ...appStore.toastGuardadoExito, title: `${s.titulo}: guardado` })
  } catch (e) {
    const nombres = { email: 'Correo', name: 'Nombre', address: 'Dirección', phone: 'Teléfono' }
    Swal.fire({ ...appStore.errorSavedOptions, text: mensajeDeError(e, 'No se pudo guardar.', nombres) })
  } finally {
    guardando.value = false
  }
}

const letraOEspacio = (e) => Characters.checkCharacter(e, true)
const letraODigito = (e) => Characters.checkCharacterAndDigits(e, true)
const digito = (e) => Characters.checkDigits(e, false)

onMounted(cargar)
</script>

<style scoped>
.portada {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
@media (max-width: 60rem) {
  .portada { grid-template-columns: minmax(0, 1fr); }
}
.tarjeta-de-seccion {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s;
}
.tarjeta-de-seccion:hover { background: rgb(var(--v-theme-panel)); }
.dibujo-de-seccion { width: 6rem; height: 6rem; flex: 0 0 auto; }
.imagen { max-width: 22rem; }
.archivos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}
.cuenta { padding: 0.5rem; background: rgba(var(--v-theme-on-surface), 0.03); }
</style>
