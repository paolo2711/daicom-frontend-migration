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
        <v-col md="5" class="pl-10">Descripción y comentario</v-col>
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

      <div v-for="(fila, i) in items" :key="i" class="d-flex align-start px-3 py-2 border-b-thin"
           :class="{ 'fila-con-error': errores[i], 'fila-grupo': esGrupo(fila) }">
        <div class="d-flex flex-column mr-2">
          <v-btn icon="mdi-chevron-up" variant="text" size="x-small" density="comfortable" :disabled="i === 0"
                 title="Subir" @click="mover(i, -1)" />
          <v-btn icon="mdi-chevron-down" variant="text" size="x-small" density="comfortable" :disabled="i === items.length - 1"
                 title="Bajar" @click="mover(i, 1)" />
        </div>
        <template v-if="esGrupo(fila)">
          <div class="flex-grow-1">
            <v-text-field v-model="fila.description" placeholder="Ej: COLECTOR DE POLVO DC-001"
                          :maxlength="LIMITES.grupo" prepend-inner-icon="mdi-format-list-group"
                          density="compact" variant="outlined" hide-details class="titulo-de-grupo font-weight-bold">
              <template #append-inner><inner-counter :valor="fila.description" :max="LIMITES.grupo" /></template>
            </v-text-field>
            <div v-if="errores[i]" class="text-caption text-error">{{ errores[i] }}</div>
          </div>
        </template>
        <template v-else>
        <span class="text-medium-emphasis font-weight-bold pt-2 mr-3">{{ numeros[i] }}</span>
        <v-row dense class="ma-0 flex-grow-1">
          <v-col cols="12" md="5">
            <catalog-description-field :fila="fila" :moneda="moneda" :placeholder="tipo.ejemploItem"
                                       :maxlength="LIMITES.descripcion" @elegido="s => elegidos.set(fila, s)" />
            <v-textarea v-if="conComentario(fila)" v-model="fila.observations" placeholder="Comentario del ítem (opcional)"
                        :maxlength="LIMITES.comentario" rows="1" auto-grow :ref="el => campoDeComentario.set(fila, el)"
                        density="compact" variant="underlined" hide-details class="text-medium-emphasis"
                        @blur="cerrarSiVacio(fila)">
              <template #append-inner><inner-counter :valor="fila.observations" :max="LIMITES.comentario" /></template>
            </v-textarea>
            <div v-if="errores[i]" class="text-caption text-error">{{ errores[i] }}</div>
          </v-col>
          <v-col cols="4" md="1">
            <v-text-field :model-value="fila.quantity" type="number" min="1" :max="LIMITES.cantidad"
                          :label="mdAndUp ? undefined : 'Cant.'" density="compact" variant="outlined" hide-details
                          @input="e => fijar(e, fila, 'quantity', LIMITES.cantidad)" />
          </v-col>
          <v-col cols="4" md="2">
            <v-select v-model="fila.unit" :items="UNIDADES" :label="mdAndUp ? undefined : 'Unidad'"
                      density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="4" md="2">
            <v-text-field :model-value="fila.unit_price" type="number" min="0" :max="LIMITES.precio" :prefix="simboloDe(moneda)"
                          :label="mdAndUp ? undefined : 'P. unit.'" density="compact" variant="outlined" hide-details
                          @input="e => fijar(e, fila, 'unit_price', LIMITES.precio)">
              <!-- Recien elegido del catalogo: sus dos precios, aunque se haya borrado o cambiado el precio. -->
              <template v-if="preciosDelCatalogo(fila).length" #append-inner>
                <v-menu location="bottom end">
                  <template #activator="{ props: menu }">
                    <v-icon v-bind="menu" size="small" class="cursor-pointer" title="Precios del catálogo">mdi-tag-multiple-outline</v-icon>
                  </template>
                  <v-list>
                    <v-list-item v-for="precio in preciosDelCatalogo(fila)" :key="precio.titulo" :title="precio.titulo"
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
        <!-- El de comentario va primero: oculto (comentario abierto) deja su hueco
             junto al total y no entre los demas. -->
        <v-btn icon="mdi-comment-plus-outline" variant="text" size="small" class="ml-1" title="Agregar comentario"
               :style="{ visibility: conComentario(fila) ? 'hidden' : 'visible' }" @click="abrirComentario(fila)" />
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
        <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" class="ml-1" @click="items.splice(i, 1)" />
      </div>
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
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useDisplay } from 'vuetify'
import CompanyDataService from '@/services/company/companyDataService'
import InnerCounter from '@/components/shared/InnerCounter.vue'
import CatalogDescriptionField from './CatalogDescriptionField.vue'
import { LIMITES, UNIDADES, acotado, esGrupo, grupoVacio, itemVacio, totalDeFila } from '@/utils/documents/quoteDefaults'
import { monto, simboloDe } from '@/utils/money'

// Sin la fila de titulos (pantalla angosta) cada numero lleva su etiqueta.
const { mdAndUp } = useDisplay()

// Los errores son los que el back marco por posicion al guardar.
const items = defineModel('items', { type: Array, required: true })

const props = defineProps({
  totales: { type: Object, required: true },
  moneda: { type: String, default: 'PEN' },
  igv: { type: Number, default: 18 },
  errores: { type: Object, default: () => ({}) },
  // El de TIPOS_DE_COTIZACION: titulo, unidad por defecto y ejemplo.
  tipo: { type: Object, required: true },
})

// El servicio recien elegido de cada fila, solo mientras se edita: no se guarda.
// Al reabrir una cotizacion el precio es un campo normal. Si se cambio el texto
// (sin equipo) ya no vale. Son en soles: en dolares no se ofrecen.
const elegidos = reactive(new WeakMap())
const preciosDelCatalogo = (fila) => {
  const servicio = elegidos.get(fila)
  if (props.moneda !== 'PEN' || !servicio || servicio.equipo !== fila.equipo) return []
  return [
    { titulo: 'Estándar', valor: Number(servicio.precio_estandar) },
    { titulo: 'Corporativo', valor: Number(servicio.precio_corporativo) },
  ]
}

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

// El comentario se ve si tiene texto o si se abrio con su boton; abierto y
// dejado vacio, se cierra al salir. Se recuerda la fila (no la posicion):
// sigue abierto aunque la fila se mueva.
const comentariosAbiertos = ref(new Set())
const campoDeComentario = new WeakMap()
const conComentario = (fila) => Boolean(fila.observations) || comentariosAbiertos.value.has(fila)
const abrirComentario = (fila) => {
  comentariosAbiertos.value = new Set(comentariosAbiertos.value).add(fila)
  nextTick(() => campoDeComentario.get(fila)?.$el.querySelector('textarea')?.focus())
}
const cerrarSiVacio = (fila) => {
  if ((fila.observations || '').trim()) return
  fila.observations = ''
  const abiertos = new Set(comentariosAbiertos.value)
  abiertos.delete(fila)
  comentariosAbiertos.value = abiertos
}

// Cantidad y precio no pasan de su tope ni de dos decimales. Si se pasan, se
// corrige tambien lo que se ve en el campo: con el valor ya en el tope, Vue no
// lo redibujaria. Lo que se esta escribiendo ("1.") no se toca.
const fijar = (evento, fila, campo, maximo) => {
  const escrito = evento.target.value
  const valor = acotado(escrito, maximo)
  fila[campo] = valor === '' ? '' : Number(valor)
  if (Number(escrito) > maximo || /\.\d{3,}/.test(escrito)) evento.target.value = valor
}

const mover = (i, paso) => {
  const [fila] = items.value.splice(i, 1)
  items.value.splice(i + paso, 0, fila)
}
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
.fila-grupo { background-color: rgba(var(--v-theme-primary), 0.05); }
/* Como sale en el PDF; lo guardado queda como se escribio. */
.titulo-de-grupo :deep(input) { text-transform: uppercase; }
</style>
