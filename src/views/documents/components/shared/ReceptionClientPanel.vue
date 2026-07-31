<template>
  <v-card variant="flat" class="border rounded-lg pa-4 mb-4 bg-surface">
    <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
      <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon> Datos de la Guía
    </div>
    <v-row dense class="mb-4">
      <v-col cols="12" md="3">
        <v-text-field v-model="formato.date" label="Fecha" type="date" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field v-model="formato.city" label="Ciudad" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
    </v-row>

    <v-divider class="mb-4"></v-divider>

    <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
      <v-icon size="small" class="mr-1">mdi-domain</v-icon> Cliente (Propietario de los equipos)
    </div>
    
    <ClientSmartSearch
      :model-value="clientId"
      @update:model-value="onClientIdChanged"
      @client-selected="aplicarCliente"
      class="mb-4"
    />

    <v-alert v-if="showIncompleteAlert" type="warning" variant="tonal" density="compact" class="mb-4" icon="mdi-alert">
      Este cliente está incompleto. Use la barra de arriba para buscar su RUC/DNI en SUNAT/RENIEC y actualizarlo automáticamente.
    </v-alert>

    <div class="mb-3 d-flex align-center">
      <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase text-no-wrap" style="flex-shrink: 0;">
        Quien entrega el equipo
        <span class="text-lowercase font-weight-regular">(cliente o representante)</span>
      </span>
      <v-divider class="ml-3"></v-divider>
    </div>

    <v-row dense>
      <v-col cols="12" md="8">
        <v-text-field v-model="cliente.full_name" label="Nombres y Apellidos" :disabled="isLocked" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field v-model="cliente.dni" label="DNI" :disabled="isLocked" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
    </v-row>

    <div class="mt-5 mb-3 d-flex align-center">
      <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase text-no-wrap" style="flex-shrink: 0;">
        Empresa (si aplica)
      </span>
      <v-divider class="ml-3"></v-divider>
    </div>

    <v-row dense>
      <v-col cols="12" md="8" class="mt-2">
        <v-text-field v-model="cliente.business_name" label="Razón Social / Empresa" :disabled="isEmpresaLocked" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="4" class="mt-2">
        <v-text-field v-model="cliente.ruc" label="RUC" :disabled="isEmpresaLocked" :readonly="!isEmpresaLocked" hint="Se autocompleta con la búsqueda" persistent-hint density="compact" variant="outlined" hide-details="auto" bg-color="grey-lighten-4" />
      </v-col>

      <v-col cols="12" md="8" class="mt-2">
        <v-text-field v-model="cliente.address" label="Dirección" :disabled="isEmpresaLocked" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
      <v-col cols="12" md="4" class="mt-2">
        <v-text-field v-model="cliente.phone" label="Teléfono de Contacto" :disabled="isLocked" density="compact" variant="outlined" hide-details="auto" />
      </v-col>
    </v-row>

  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ClientSmartSearch from '@/components/shared/ClientSmartSearch.vue'

const props = defineProps({
  formato: Object,
  cliente: Object,
  clientId: { type: [Number, String], default: null }
})

const emit = defineEmits(['update:clientId'])

// Tipo de documento del último cliente vinculado: 1 = DNI, 2 = RUC, 3 = Sin Documento
// (ajustar el valor "3" si ClientSmartSearch usa otro código para "sin documento")
const selectedDocType = ref(null)

// Modo edición: si el formato ya trae un cliente vinculado (guía existente),
// selectedDocType nunca pasó por aplicarCliente(). Lo inferimos de los datos
// ya guardados para que los bloqueos (isEmpresaLocked) queden correctos desde
// el primer render, en vez de bloquear por error una empresa ya cargada.
onMounted(() => {
  if (!props.clientId) return
  if (props.cliente?.ruc && props.cliente.ruc.trim() !== '') {
    selectedDocType.value = 2
  } else if (props.cliente?.dni && props.cliente.dni.trim() !== '') {
    selectedDocType.value = 1
  } else {
    selectedDocType.value = 3
  }
})

// LÓGICA DE BLOQUEO GENERAL
// Se aplica a: teléfono (es solo un dato de contacto, no pertenece ni al RUC ni al DNI
// específicamente) y a la sección "quien entrega el equipo" (full_name/dni).
// Se desbloquea en cuanto se vincula CUALQUIER cliente (RUC, DNI o Sin Documento).
const isLocked = computed(() => !props.clientId)

// LÓGICA DE BLOQUEO ESPECÍFICA DE EMPRESA
// Razón Social / RUC / Dirección solo se desbloquean y autocompletan si el cliente
// vinculado es efectivamente una empresa (RUC), ya que la dirección está asociada
// al RUC, no al DNI. Si es persona o sin documento, esta sección permanece
// bloqueada y vacía porque no existe empresa asociada.
const isEmpresaLocked = computed(() => isLocked.value || selectedDocType.value !== 2)

// Alerta de "cliente incompleto": solo debe salir si el cliente vinculado NO tiene
// RUC ni DNI registrado en BD por falta de datos, no cuando es intencionalmente
// "Sin Documento" (tipo 3), caso en el que no aplica.
const showIncompleteAlert = computed(() => {
  if (!props.clientId) return false
  if (selectedDocType.value === 3) return false
  const hasDoc = (props.cliente?.ruc && props.cliente.ruc.trim() !== '') ||
                 (props.cliente?.dni && props.cliente.dni.trim() !== '')
  return !hasDoc
})

// Cuando ClientSmartSearch limpia la selección (id null), sí propagamos.
// Cuando trae un id (selección normal), NO lo propagamos aquí: la decisión de
// si ese id se adopta como clientId real la toma aplicarCliente(), que llega
// inmediatamente después con el objeto completo y puede aplicar la regla
// RUC > DNI (ver más abajo).
const onClientIdChanged = (id) => {
  if (!id) {
    selectedDocType.value = null
    emit('update:clientId', null)
  }
}

const aplicarCliente = (c) => {
  if (c.documentType === 2) {
    // Empresa (RUC) — La prioridad siempre la tiene la empresa: ese es el
    // cliente real, sin importar qué había seleccionado antes.
    selectedDocType.value = 2
    emit('update:clientId', c.id)
    props.cliente.business_name = c.name
    props.cliente.ruc = c.document
    // NOTA CLAVE: NO tocamos full_name ni dni aquí.
    // Esto permite que el usuario escriba (o ya haya seleccionado) manualmente
    // los datos de quien entrega el equipo.
    props.cliente.address = c.address || ''
    props.cliente.phone = c.phone || ''
    return
  }

  if (selectedDocType.value === 2) {
    // Ya hay una EMPRESA vinculada como cliente real (RUC gana).
    // Esta persona/DNI que acabas de buscar NO reemplaza al cliente real;
    // solo se usa para identificar a quien entrega el equipo físicamente.
    props.cliente.full_name = c.name
    props.cliente.dni = c.documentType === 1 ? c.document : ''
    // No tocamos clientId, business_name, ruc, address ni phone.
    return
  }

  // No hay empresa asociada — Excepción: la persona natural (o sin documento)
  // pasa a ser el cliente real.
  selectedDocType.value = c.documentType
  emit('update:clientId', c.id)
  props.cliente.full_name = c.name
  props.cliente.dni = c.documentType === 1 ? c.document : ''
  props.cliente.business_name = ''
  props.cliente.ruc = ''
  props.cliente.address = ''
  props.cliente.phone = c.phone || ''
}
</script>