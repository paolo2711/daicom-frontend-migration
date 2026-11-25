<template>
  <detail-panel :titulo="titulo" @cerrar="emit('cerrar')">
      <section class="seccion">
        <div class="titulo-de-seccion">Equipo</div>
        <v-text-field :model-value="eq.name" label="Equipo" disabled v-bind="CAMPO" />
        <v-text-field :model-value="eq.detalle || '—'" label="Marca, modelo y serie" disabled v-bind="CAMPO" />
      </section>

      <section class="seccion">
        <div class="titulo-de-seccion">Fechas</div>
        <v-text-field v-model="eq.departure_date" :label="FECHAS_ALQUILER.departure_date" type="date" persistent-hint
                      :clearable="nuevo" :disabled="!seCorrige('departure_date')" :hint="NOTA_DEL_INICIO[eq.estado ?? 'nuevo']"
                      :rules="eq.estado === 'en_obra' ? [reglaObligatoria] : []" v-bind="CAMPO" hide-details="auto" />
        <v-text-field v-model="eq.expected_return_date" :label="FECHAS_ALQUILER.expected_return_date" type="date"
                      :min="eq.departure_date || undefined" :rules="[reglaNoAntesDe(eq.departure_date)]"
                      :disabled="!seCorrige('expected_return_date')" clearable v-bind="CAMPO" hide-details="auto" />
        <v-text-field v-if="eq.actual_return_date" :model-value="eq.actual_return_date" type="date"
                      :label="FECHAS_ALQUILER.actual_return_date" disabled v-bind="CAMPO" />
        <div v-if="eq.estado === 'devuelto'" class="text-caption text-medium-emphasis">
          Para corregir las fechas, deshaz la devolución en la lista de equipos.
        </div>
      </section>

      <section class="seccion">
        <div class="titulo-de-seccion">Observaciones de entrega</div>
        <v-textarea v-model="eq.delivery_notes" label="Estuche, accesorios, estado" rows="1" auto-grow
                    v-bind="CAMPO" />
      </section>

      <div v-if="error" class="text-caption text-error">{{ error }}</div>

    <template v-if="seQuitaElAlquiler(eq)" #pie>
      <item-actions @quitar="emit('borrar', indice)" />
    </template>
  </detail-panel>
</template>

<script setup>
import { computed } from 'vue'
import DetailPanel from '@/components/shared/DetailPanel.vue'
import ItemActions from '@/components/shared/ItemActions.vue'
import { CAMPO } from '@/utils/fields'
import {
  ESTADOS_ALQUILER, FECHAS_ALQUILER, FECHAS_EDITABLES, reglaNoAntesDe, reglaObligatoria, seQuitaElAlquiler,
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
const nuevo = computed(() => props.eq.modo !== 'linea')
const seCorrige = (fecha) => nuevo.value || FECHAS_EDITABLES[props.eq.estado].includes(fecha)
const NOTA_DEL_INICIO = { nuevo: 'Vacío: queda reservado', reservado: 'Se registra en la lista de equipos' }
</script>
