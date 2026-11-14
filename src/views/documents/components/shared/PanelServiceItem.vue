<template>
  <detail-panel :titulo="`Ítem ${indice + 1}`" @cerrar="emit('cerrar')">
    <section class="seccion">
      <div class="titulo-de-seccion">Ítem</div>
      <catalog-description-field :fila="item" :moneda="moneda" desplegable :con-precio="false" placeholder="Descripción"
                                 :maxlength="LIMITES.descripcion" @elegido="s => (elegido = s)" />
      <v-textarea v-model="item.observations" :label="etiquetaDelDetalle" :maxlength="LIMITES.comentario" rows="1"
                  no-resize class="crece-con-texto" v-bind="CAMPO" />
    </section>

    <section class="seccion">
      <div class="titulo-de-seccion">Cantidad y precio</div>
      <v-row dense>
        <v-col :cols="unidades ? 6 : 5">
          <v-text-field v-model="item.quantity" type="number" min="0" :max="LIMITES.cantidad" label="Cantidad"
                        v-bind="CAMPO" />
        </v-col>
        <v-col v-if="unidades" cols="6">
          <v-select v-model="item.unit" :items="unidades" label="Unidad" v-bind="CAMPO" />
        </v-col>
        <v-col :cols="unidades ? 12 : 7">
          <v-text-field v-model="item.unit_price" type="number" min="0" :max="LIMITES.precio" label="Precio unitario"
                        :prefix="simboloDe(moneda)" v-bind="CAMPO" />
        </v-col>
      </v-row>
      <div v-if="precios.length">
        <div class="text-caption text-medium-emphasis mb-1">Elige el precio del catálogo</div>
        <segmented-field :model-value="precioElegido" :opciones="opcionesDePrecio" @update:model-value="elegirPrecio" />
      </div>
      <segmented-field v-model="item.incluye_igv" :opciones="IGV" />
    </section>

    <section v-if="acreditaciones.length" class="seccion">
      <div class="titulo-de-seccion">Acreditación</div>
      <v-select v-model="item.accreditation" :items="opcionesDeAcreditacion" label="Se declara bajo" v-bind="CAMPO" />
    </section>

    <div v-if="error" class="text-caption text-error">{{ error }}</div>

    <template #pie>
      <v-spacer />
      <v-btn variant="text" color="red" prepend-icon="mdi-delete" @click="emit('borrar', indice)">Quitar</v-btn>
    </template>
  </detail-panel>
</template>

<script setup>
// El item elegido de una factura, cotizacion o valorizacion. La descripcion sugiere servicios y acepta cualquier texto.
import { computed, ref } from 'vue'
import DetailPanel from '@/components/shared/DetailPanel.vue'
import SegmentedField from '@/components/shared/SegmentedField.vue'
import { LIMITES, preciosDelCatalogo } from '@/utils/documents/quoteDefaults'
import { CAMPO } from '@/utils/fields'
import { importe, simboloDe } from '@/utils/money'
import CatalogDescriptionField from './CatalogDescriptionField.vue'

const props = defineProps({
  item: { type: Object, required: true },
  indice: { type: Number, required: true },
  moneda: { type: String, default: 'PEN' },
  error: { type: String, default: '' },
  // Sin unidades, el item va siempre con la suya (la factura); con ellas se elige.
  unidades: { type: Array, default: null },
  // Las que se pueden declarar hoy; sin ninguna no se muestra la seccion.
  acreditaciones: { type: Array, default: () => [] },
  etiquetaDelDetalle: { type: String, default: 'Detalle' },
})
const emit = defineEmits(['cerrar', 'borrar'])

const IGV = [{ valor: false, texto: 'Más IGV' }, { valor: true, texto: 'Incluye IGV' }]
const opcionesDeAcreditacion = computed(() => [
  { title: 'Sin acreditación', value: '' },
  ...props.acreditaciones.map(a => ({ title: `${a.codigo} · ${a.organismo} N.° ${a.numero}`, value: a.codigo })),
])

const elegido = ref(null)
const precios = computed(() => preciosDelCatalogo(props.item, elegido.value, props.moneda))
const opcionesDePrecio = computed(() => precios.value.map(p => ({ valor: p.titulo, texto: `${p.titulo} ${importe(p.valor)}` })))
// El que se toco, si sigue siendo el precio escrito; si no, el primero que coincida. Con dos iguales se marca uno.
const tocado = ref(null)
const precioElegido = computed(() => {
  const escrito = Number(props.item.unit_price)
  const vigente = precios.value.find(p => p.titulo === tocado.value && p.valor === escrito)
  return (vigente ?? precios.value.find(p => p.valor === escrito))?.titulo ?? null
})
function elegirPrecio (titulo) {
  tocado.value = titulo
  props.item.unit_price = precios.value.find(p => p.titulo === titulo).valor
}
</script>
