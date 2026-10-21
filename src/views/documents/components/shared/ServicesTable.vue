<template>
  <div>
    <!-- Los botones de añadir y los titulos de columna quedan a la vista al bajar
         por una lista larga. -->
    <div class="encabezado-fijo">
      <div class="d-flex align-center pb-3">
        <div class="text-subtitle-1 font-weight-bold text-primary">
          <v-icon size="small" class="mr-1">mdi-format-list-numbered</v-icon> {{ tipo.etiquetaItems }}
        </div>
        <v-spacer />
        <v-btn variant="outlined" prepend-icon="mdi-format-list-group" class="mr-2" @click="items.push(grupoVacio())">
          Añadir grupo
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="items.push(itemVacio(tipo.unidad))">
          Añadir ítem
        </v-btn>
      </div>
      <v-row dense class="d-none d-md-flex px-3 py-2 ma-0 border rounded-t-lg text-caption font-weight-bold text-medium-emphasis">
        <v-col md="5" class="pl-15">Descripción y comentario</v-col>
        <v-col md="1">Cant.</v-col>
        <v-col md="2">Unidad</v-col>
        <v-col md="2">P. unit.</v-col>
        <v-col md="2" class="text-right pr-10">Total</v-col>
      </v-row>
    </div>

    <!-- En pantalla ancha cada servicio va en una linea, como tabla; en angosta
         los numeros bajan debajo de la descripcion. -->
    <div class="border rounded-lg" :class="{ 'border-t-0 rounded-t-0': mdAndUp }">

      <div v-if="!items.length" class="text-center text-medium-emphasis py-4">
        Sin ítems. Agregue uno con "Añadir ítem".
      </div>

      <service-row v-for="(fila, i) in items" :key="clave(fila)" v-bind="arrastrable(i)" :class="claseDe(i)"
                   :fila="fila" :indice="i" :numero="numeros[i]" :primera="i === 0" :ultima="i === items.length - 1"
                   :error="errores[i]" :moneda="moneda" :tipo="tipo" :acreditaciones="acreditaciones" :asa="asa(i)"
                   @mover="moverFila" @borrar="borrarFila" />
    </div>

    <v-row class="mt-2">
      <v-col cols="12" sm="6" md="4" class="ml-auto">
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span class="text-medium-emphasis">Subtotal</span><span>{{ monto(totales.subtotal, moneda) }}</span>
        </div>
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span class="text-medium-emphasis">IGV ({{ igv }} %)</span><span>{{ monto(totales.igv, moneda) }}</span>
        </div>
        <v-divider class="my-2" />
        <div class="d-flex justify-space-between align-center">
          <span class="font-weight-bold">Total</span>
          <span class="text-h6 font-weight-bold text-primary">{{ monto(totales.total, moneda) }}</span>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import CompanyDataService from '@/services/company/companyDataService'
import { useRowDrag } from '@/composables/useRowDrag'
import ServiceRow from './ServiceRow.vue'
import { esGrupo, grupoVacio, itemVacio } from '@/utils/documents/quoteDefaults'
import { monto } from '@/utils/money'

const { mdAndUp } = useDisplay()

// Los errores son los que el back marco por posicion al guardar.
const items = defineModel('items', { type: Array, required: true })

defineProps({
  totales: { type: Object, required: true },
  moneda: { type: String, default: 'PEN' },
  igv: { type: Number, default: 18 },
  errores: { type: Object, default: () => ({}) },
  // El de TIPOS_DE_COTIZACION: titulo, unidad por defecto y ejemplo.
  tipo: { type: Object, required: true },
})

// Las acreditaciones que se pueden declarar hoy; sin ninguna, no hay boton.
const acreditaciones = ref([])
onMounted(() => {
  CompanyDataService.acreditaciones()
    .then(({ data }) => { acreditaciones.value = data })
    .catch(() => {})
})

// Los items se numeran de corrido, saltando los grupos, como en el PDF.
const numeros = computed(() => {
  let n = 0
  return items.value.map(fila => (esGrupo(fila) ? null : ++n))
})

const { asa, arrastrable, claseDe, clave, mover } = useRowDrag(items)
const moverFila = (indice, paso) => mover(indice, indice + paso)
const borrarFila = (indice) => items.value.splice(indice, 1)
</script>

<style scoped>
/* El contenedor que se desliza tiene 1rem de relleno arriba (pt-4): sin
   subirla ese rem, las filas se ven pasar por encima de la barra. */
.encabezado-fijo {
  position: sticky;
  top: -1rem;
  margin-top: -1rem;
  padding-top: 1rem;
  z-index: 3;
  background-color: var(--fondo-del-dialogo, rgb(var(--v-theme-surface)));
}
</style>
