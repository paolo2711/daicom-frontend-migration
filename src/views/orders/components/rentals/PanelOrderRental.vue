<template>
  <detail-panel :titulo="titulo" @cerrar="emit('cerrar')">
      <section class="seccion">
        <div class="titulo-de-seccion">Equipo</div>
        <v-text-field :model-value="eq.name" label="Equipo" readonly v-bind="CAMPO" />
        <v-text-field :model-value="eq.series || '—'" label="Serie" readonly v-bind="CAMPO" />
      </section>

      <section class="seccion">
        <div class="titulo-de-seccion">Fechas</div>
        <v-text-field v-if="nuevo" v-model="eq.departure_date" :label="FECHAS_ALQUILER.departure_date" type="date"
                      :max="hoy" :rules="[reglaNoFutura(hoy)]" persistent-hint clearable
                      hint="Vacía: queda reservado y la salida se registra al salir" v-bind="CAMPO"
                      hide-details="auto" />
        <v-text-field v-else :model-value="salidaDe(eq)" :label="FECHAS_ALQUILER.departure_date" readonly
                      v-bind="CAMPO" />
        <v-text-field v-model="eq.expected_return_date" :label="FECHAS_ALQUILER.expected_return_date" type="date"
                      :min="eq.departure_date || undefined" :rules="[reglaNoAntesDe(eq.departure_date)]"
                      :readonly="!seCorrigenLasFechas" clearable v-bind="CAMPO" hide-details="auto" />
        <v-text-field v-if="eq.actual_return_date" :model-value="fechaCorta(eq.actual_return_date)"
                      :label="FECHAS_ALQUILER.actual_return_date" readonly v-bind="CAMPO" />
        <div v-if="!seCorrigenLasFechas" class="text-caption text-medium-emphasis">
          Ya salió: su salida, devolución y fechas se registran en "Gestionar alquiler".
        </div>
      </section>

      <section class="seccion">
        <div class="titulo-de-seccion">Observaciones de entrega</div>
        <v-textarea v-model="eq.delivery_notes" label="Estuche, accesorios, estado" rows="1" auto-grow
                    v-bind="CAMPO" />
      </section>

      <div v-if="error" class="text-caption text-error">{{ error }}</div>

    <template v-if="seQuitaElAlquiler(eq)" #pie>
      <v-spacer />
      <v-btn variant="text" color="red" prepend-icon="mdi-delete" @click="emit('borrar', indice)">Quitar</v-btn>
    </template>
  </detail-panel>
</template>

<script setup>
import { computed } from 'vue'
import DetailPanel from '@/components/shared/DetailPanel.vue'
import { fechaCorta, hoyISO } from '@/utils/dates'
import { CAMPO } from '@/utils/fields'
import {
  ESTADOS_ALQUILER, FECHAS_ALQUILER, reglaNoAntesDe, reglaNoFutura, salidaDe, seQuitaElAlquiler,
} from '@/utils/orders/alquiler'

// Todo lo de un equipo de FormOrderRental, en una columna.
const props = defineProps({
  eq: { type: Object, required: true },
  indice: { type: Number, required: true },
  error: { type: String, default: '' },
})
const emit = defineEmits(['cerrar', 'borrar'])

const titulo = computed(() => [props.eq.internal_id, props.eq.estado && ESTADOS_ALQUILER[props.eq.estado].texto.toLowerCase()]
  .filter(Boolean).join(' · '))
const hoy = hoyISO()
const nuevo = computed(() => props.eq.modo !== 'linea')
// Las mismas que "Gestionar alquiler" deja corregir a uno reservado (FECHAS_EDITABLES en el back).
const seCorrigenLasFechas = computed(() => nuevo.value || props.eq.estado === 'reservado')
</script>
