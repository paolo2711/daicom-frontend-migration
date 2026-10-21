<template>
  <div class="d-flex align-start px-3 py-2 border-b-thin" :class="{ 'fila-con-error': error, 'fila-grupo': grupo }">
    <div class="d-flex align-center mr-2">
      <drag-handle v-bind="asa" />
      <div class="d-flex flex-column">
        <v-btn icon="mdi-chevron-up" variant="text" size="x-small" density="comfortable" :disabled="primera"
               title="Subir" @click="emit('mover', indice, -1)" />
        <v-btn icon="mdi-chevron-down" variant="text" size="x-small" density="comfortable" :disabled="ultima"
               title="Bajar" @click="emit('mover', indice, 1)" />
      </div>
    </div>
    <template v-if="grupo">
      <div class="flex-grow-1">
        <v-text-field v-model="fila.description" placeholder="Ej: COLECTOR DE POLVO DC-001"
                      :maxlength="LIMITES.grupo" prepend-inner-icon="mdi-format-list-group"
                      density="compact" variant="outlined" hide-details class="titulo-de-grupo font-weight-bold">
          <template #append-inner><inner-counter :valor="fila.description" :max="LIMITES.grupo" /></template>
        </v-text-field>
        <div v-if="error" class="text-caption text-error">{{ error }}</div>
      </div>
    </template>
    <template v-else>
      <span class="text-medium-emphasis font-weight-bold pt-2 mr-3">{{ numero }}</span>
      <v-row dense class="ma-0 flex-grow-1">
        <v-col cols="12" md="5">
          <catalog-description-field :fila="fila" :moneda="moneda" :placeholder="tipo.ejemploItem"
                                     :maxlength="LIMITES.descripcion" @elegido="s => (elegido = s)" />
          <v-textarea v-if="conComentario" ref="campoDeComentario" v-model="fila.observations"
                      placeholder="Comentario del ítem (opcional)" :maxlength="LIMITES.comentario" rows="1" no-resize
                      density="compact" variant="underlined" hide-details class="crece-con-texto text-medium-emphasis"
                      @blur="cerrarSiVacio">
            <template #append-inner><inner-counter :valor="fila.observations" :max="LIMITES.comentario" /></template>
          </v-textarea>
          <div v-if="error" class="text-caption text-error">{{ error }}</div>
        </v-col>
        <v-col cols="4" md="1">
          <v-text-field :model-value="fila.quantity" type="number" min="1" :max="LIMITES.cantidad"
                        :label="mdAndUp ? undefined : 'Cant.'" density="compact" variant="outlined" hide-details
                        @input="e => fijar(e, 'quantity', LIMITES.cantidad)" />
        </v-col>
        <v-col cols="4" md="2">
          <v-select v-model="fila.unit" :items="UNIDADES" :label="mdAndUp ? undefined : 'Unidad'"
                    density="compact" variant="outlined" hide-details />
        </v-col>
        <v-col cols="4" md="2">
          <v-text-field :model-value="fila.unit_price" type="number" min="0" :max="LIMITES.precio" :prefix="simboloDe(moneda)"
                        :label="mdAndUp ? undefined : 'P. unit.'" density="compact" variant="outlined" hide-details
                        @input="e => fijar(e, 'unit_price', LIMITES.precio)">
            <template v-if="preciosDelCatalogo.length" #append-inner>
              <v-menu location="bottom end">
                <template #activator="{ props: menu }">
                  <v-icon v-bind="menu" size="small" class="cursor-pointer" title="Precios del catálogo">mdi-tag-multiple-outline</v-icon>
                </template>
                <v-list>
                  <v-list-item v-for="precio in preciosDelCatalogo" :key="precio.titulo" :title="precio.titulo"
                               :subtitle="monto(precio.valor, moneda)" @click="fila.unit_price = precio.valor">
                    <template #append>
                      <v-icon v-if="Number(fila.unit_price) === precio.valor" size="small">mdi-check</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-text-field>
        </v-col>
        <v-col cols="12" md="2" class="d-flex justify-end pt-md-3">
          <span class="font-weight-bold text-no-wrap">{{ monto(totalDeFila(fila), moneda) }}</span>
        </v-col>
      </v-row>
      <!-- Primero el de comentario: oculto, deja su hueco junto al total y no entre los demas. -->
      <v-btn icon="mdi-comment-plus-outline" variant="text" size="small" class="ml-1" title="Agregar comentario"
             :style="{ visibility: conComentario ? 'hidden' : 'visible' }" @click="abrirComentario" />
      <v-menu v-if="acreditaciones.length" location="bottom end">
        <template #activator="{ props: menu }">
          <v-btn v-bind="menu" :icon="fila.accreditation ? 'mdi-certificate' : 'mdi-certificate-outline'" variant="text"
                 size="small" class="ml-1" :color="fila.accreditation ? 'primary' : undefined"
                 :title="fila.accreditation ? `Acreditado: ${fila.accreditation}` : 'Marcar como acreditado'" />
        </template>
        <v-list density="compact">
          <v-list-item v-for="a in acreditaciones" :key="a.codigo" :active="fila.accreditation === a.codigo"
                       :title="a.codigo" :subtitle="`${a.organismo} N.° ${a.numero}`" @click="fila.accreditation = a.codigo" />
          <v-list-item title="Sin acreditación" @click="fila.accreditation = ''" />
        </v-list>
      </v-menu>
    </template>
    <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" class="ml-1" @click="emit('borrar', indice)" />
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useDisplay } from 'vuetify'
import InnerCounter from '@/components/shared/InnerCounter.vue'
import DragHandle from '@/components/shared/DragHandle.vue'
import CatalogDescriptionField from './CatalogDescriptionField.vue'
import { LIMITES, UNIDADES, acotado, esGrupo, totalDeFila } from '@/utils/documents/quoteDefaults'
import { monto, simboloDe } from '@/utils/money'

// Una fila de ServicesTable. Es su propio componente para que editarla no redibuje las demas.
const props = defineProps({
  fila: { type: Object, required: true },
  indice: { type: Number, required: true },
  numero: { type: Number, default: null },
  primera: { type: Boolean, default: false },
  ultima: { type: Boolean, default: false },
  error: { type: String, default: '' },
  moneda: { type: String, default: 'PEN' },
  tipo: { type: Object, required: true },
  acreditaciones: { type: Array, default: () => [] },
  // El asa(i) de useRowDrag.
  asa: { type: Object, required: true },
})
const emit = defineEmits(['mover', 'borrar'])

// Sin la fila de titulos (pantalla angosta) cada numero lleva su etiqueta.
const { mdAndUp } = useDisplay()
const grupo = computed(() => esGrupo(props.fila))

// El servicio recien elegido, solo mientras se edita: ofrece sus dos precios
// (en soles) hasta que se cambie el texto.
const elegido = ref(null)
const preciosDelCatalogo = computed(() => {
  const servicio = elegido.value
  if (props.moneda !== 'PEN' || !servicio || servicio.equipo !== props.fila.equipo) return []
  return [
    { titulo: 'Estándar', valor: Number(servicio.precio_estandar) },
    { titulo: 'Corporativo', valor: Number(servicio.precio_corporativo) },
  ]
})

// Se ve con texto o abierto con su boton; abierto y dejado vacio, se cierra al salir.
const comentarioAbierto = ref(false)
const campoDeComentario = ref(null)
const conComentario = computed(() => Boolean(props.fila.observations) || comentarioAbierto.value)
function abrirComentario() {
  comentarioAbierto.value = true
  nextTick(() => campoDeComentario.value?.$el.querySelector('textarea')?.focus())
}
function cerrarSiVacio() {
  if ((props.fila.observations || '').trim()) return
  props.fila.observations = ''
  comentarioAbierto.value = false
}

// Sin pasar del tope ni de dos decimales; si se paso, se corrige tambien lo que se ve.
function fijar(evento, campo, maximo) {
  const escrito = evento.target.value
  const valor = acotado(escrito, maximo)
  props.fila[campo] = valor === '' ? '' : Number(valor)
  if (Number(escrito) > maximo || /\.\d{3,}/.test(escrito)) evento.target.value = valor
}
</script>

<style scoped>
.fila-grupo { background-color: rgba(var(--v-theme-primary), 0.05); }
/* Como sale en el PDF; lo guardado queda como se escribio. */
.titulo-de-grupo :deep(input) { text-transform: uppercase; }
</style>
