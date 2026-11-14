<template>
  <div ref="campo" class="position-relative" :style="medidas">
    <v-textarea :model-value="texto" :placeholder="fila.servicio ? '…' : placeholder"
                :maxlength="maxlength - (fila.servicio ? fila.servicio.length + 1 : 0)" rows="1" no-resize
                density="compact" variant="outlined" hide-details :loading="loading && abierto"
                :class="['crece-con-texto', { 'con-servicio': fila.servicio, 'texto-abajo': textoAbajo }]"
                @update:model-value="escribir" @focus="alEnfocar" @blur="enfocado = false"
                @keydown.esc="cerrado = true">
      <template v-if="fila.servicio" #prepend-inner>
        <v-chip ref="pildora" size="small" variant="tonal" prepend-icon="mdi-book-open-variant" closable
                class="servicio" :title="fila.servicio" close-label="Soltar del catálogo" @click:close="soltar">
          {{ fila.servicio }}
        </v-chip>
      </template>
      <template #append-inner>
        <inner-counter :valor="fila[campo]" :max="maxlength" />
        <v-icon v-if="desplegable && !fila.servicio" class="cursor-pointer" :title="abierto ? 'Cerrar la lista' : 'Ver la lista'"
                @mousedown.prevent @click="alternarLista">{{ abierto ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
      </template>
    </v-textarea>
    <v-menu :model-value="abierto" activator="parent" :open-on-click="false" location="bottom start"
            :width="anchoDelMenu" max-height="320">
      <v-list>
        <v-list-item v-for="s in items" :key="s.id" :title="s.nombre ?? s.nombre_tecnico" @mousedown.prevent
                     :subtitle="deEquipos ? undefined : `Estándar ${monto(s.precio_estandar)} · Corporativo ${monto(s.precio_corporativo)}`"
                     @click="elegir(s)" />
        <more-results-hint v-if="total > items.length" />
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import InnerCounter from '@/components/shared/InnerCounter.vue'
import MoreResultsHint from '@/components/shared/MoreResultsHint.vue'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import ServicioCatalogoDataService from '@/services/equipments/servicioCatalogoDataService'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { monto } from '@/utils/money'

// Sugiere del catalogo mientras se escribe y deja cualquier texto. Un servicio queda como pildora con su precio;
// un equipo solo escribe su nombre. 'elegido' lleva lo elegido.
const emit = defineEmits(['elegido'])

const props = defineProps({
  fila: { type: Object, required: true },
  moneda: { type: String, default: 'PEN' },
  placeholder: { type: String, default: '' },
  maxlength: { type: Number, required: true },
  catalogo: { type: String, default: 'servicios', validator: (v) => ['servicios', 'equipos'].includes(v) },
  // El campo de `fila` donde va el texto.
  campo: { type: String, default: 'description' },
  // Con su flecha: al entrar sin texto muestra la lista entera.
  desplegable: { type: Boolean, default: false },
  // Al elegir un servicio pone su precio estandar; sin el, el precio vuelve a cero y se elige uno de los dos.
  conPrecio: { type: Boolean, default: true },
})
const deEquipos = props.catalogo === 'equipos'

const LETRAS_PARA_BUSCAR = 2

const buscar = deEquipos ? EquipmentDataService.getFiltered : ServicioCatalogoDataService.getFiltered
const { items, loading, searchQuery, total } = usePaginatedSearch(buscar, x => x)

const campo = ref(null)

// Con pildora, el campo muestra solo lo que va despues del servicio.
const texto = computed(() => (props.fila.servicio
  ? (props.fila[props.campo] || '').slice(props.fila.servicio.length).trimStart()
  : props.fila[props.campo]))

// La pildora va encima de la primera linea y el texto sigue despues de ella, como texto corrido;
// si la primera palabra no entra a su lado, el texto empieza abajo. Se mide solo al cambiar de tamaño.
const SEPARACION_EN_EM = 0.4
const pildora = ref(null)
const tamanoDePildora = ref({ ancho: 0, alto: 0 })
const anchoDelTexto = ref(0)
const separacion = ref(0)
const regla = document.createElement('canvas').getContext('2d')
const medidor = new ResizeObserver((entradas) => entradas.forEach(({ target, contentRect, borderBoxSize: [caja] }) => {
  if (target.tagName === 'TEXTAREA') {
    const estilo = getComputedStyle(target)
    anchoDelTexto.value = contentRect.width
    separacion.value = SEPARACION_EN_EM * parseFloat(estilo.fontSize)
    regla.font = estilo.font
  } else tamanoDePildora.value = { ancho: caja.inlineSize, alto: caja.blockSize }
}))
watch(() => pildora.value?.$el, (el, antes) => {
  if (antes) medidor.unobserve(antes)
  if (el) medidor.observe(el)
})
watch(campo, (el) => el && medidor.observe(el.querySelector('textarea')))
onBeforeUnmount(() => medidor.disconnect())
const textoAbajo = computed(() => {
  const palabra = (texto.value || '').split(/\s/)[0]
  return Boolean(palabra) && anchoDelTexto.value > 0
    && regla.measureText(palabra).width > anchoDelTexto.value - tamanoDePildora.value.ancho - separacion.value
})
const medidas = computed(() => ({
  '--sangria': `${tamanoDePildora.value.ancho}px`, '--alto-pildora': `${tamanoDePildora.value.alto}px`,
  '--separacion': `${SEPARACION_EN_EM}em`,
}))
const enfocado = ref(false)
const cerrado = ref(false)

const termino = computed(() => (props.fila[props.campo] || '').trim())
const buscable = computed(() => termino.value.length >= LETRAS_PARA_BUSCAR || (props.desplegable && !termino.value))
const abierto = computed(() => enfocado.value && !cerrado.value && !props.fila.servicio && buscable.value
  && searchQuery.value === (termino.value || '') && items.value.length > 0)

function alEnfocar () {
  enfocado.value = true
  if (props.desplegable && !termino.value) searchQuery.value = ''
}
function alternarLista () {
  if (abierto.value) {
    cerrado.value = true
    return
  }
  cerrado.value = false
  campo.value?.querySelector('textarea')?.focus()
  searchQuery.value = termino.value.length >= LETRAS_PARA_BUSCAR ? termino.value : ''
}

// Se mide al abrir: leer el ancho en cada dibujo obliga a recalcular toda la pagina.
const anchoDelMenu = ref(undefined)
watch(abierto, (si) => { if (si) anchoDelMenu.value = campo.value?.offsetWidth })

function escribir (escrito) {
  if (props.fila.servicio) {
    props.fila[props.campo] = escrito ? `${props.fila.servicio} ${escrito}` : props.fila.servicio
    return
  }
  props.fila[props.campo] = escrito
  cerrado.value = false
  const buscado = (escrito || '').trim()
  if (buscado.length >= LETRAS_PARA_BUSCAR || (props.desplegable && !buscado)) searchQuery.value = buscado
}

function soltar () {
  Object.assign(props.fila, { [props.campo]: texto.value, servicio: null, equipo: null, tipo_servicio: null })
}

function elegir (elegido) {
  if (deEquipos) {
    props.fila[props.campo] = elegido.nombre_tecnico
    cerrado.value = true
    emit('elegido', elegido)
    return
  }
  const servicio = elegido
  props.fila[props.campo] = servicio.nombre
  props.fila.servicio = servicio.nombre
  props.fila.equipo = servicio.equipo
  props.fila.tipo_servicio = servicio.tipo_servicio
  emit('elegido', servicio)
  // Los precios del catalogo son en soles: en dolares no se ponen.
  if (!props.conPrecio) props.fila.unit_price = 0
  else if (props.moneda === 'PEN') props.fila.unit_price = Number(servicio.precio_estandar)
}
</script>

<style scoped>
.con-servicio :deep(.v-field) { --v-field-padding-start: 1rem; padding-inline-start: 0; }
.con-servicio :deep(.v-field__prepend-inner) {
  position: absolute; inset-inline-start: var(--v-field-padding-start); top: var(--v-field-input-padding-top);
  grid-area: auto; z-index: 1; width: max-content; max-width: 75%; padding: 0;
}
.con-servicio :deep(textarea) { text-indent: calc(var(--sangria) + var(--separacion)); }
.con-servicio.texto-abajo :deep(textarea) {
  text-indent: 0; padding-top: calc(var(--v-field-input-padding-top) + var(--alto-pildora) + 0.25rem);
}
/* Un nombre muy largo se corta: el completo va en el title. */
.servicio { max-width: 100%; }
.servicio :deep(.v-chip__content) { overflow: hidden; text-overflow: ellipsis; }
</style>
