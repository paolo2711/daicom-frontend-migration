<template>
  <div ref="campo" class="position-relative">
    <v-textarea :model-value="fila.description" :placeholder="placeholder" :maxlength="maxlength" rows="1" no-resize
                density="compact" variant="outlined" hide-details class="crece-con-texto" :loading="loading && abierto"
                @update:model-value="escribir" @focus="enfocado = true" @blur="enfocado = false"
                @keydown.esc="cerrado = true">
      <template v-if="fila.equipo" #prepend-inner>
        <v-icon size="small" color="primary" title="Vinculado a un equipo del catálogo: se usa al crear la orden">mdi-book-open-variant</v-icon>
      </template>
      <template #append-inner><inner-counter :valor="fila.description" :max="maxlength" /></template>
    </v-textarea>
    <v-menu :model-value="abierto" activator="parent" :open-on-click="false" location="bottom start"
            :width="anchoDelMenu" max-height="320">
      <v-list>
        <v-list-item v-for="s in items" :key="s.id" :title="s.nombre" @mousedown.prevent @click="elegir(s)"
                     :subtitle="`Estándar ${monto(s.precio_estandar)} · Corporativo ${monto(s.precio_corporativo)}`" />
        <more-results-hint v-if="total > items.length" />
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import InnerCounter from '@/components/shared/InnerCounter.vue'
import MoreResultsHint from '@/components/shared/MoreResultsHint.vue'
import ServicioCatalogoDataService from '@/services/equipments/servicioCatalogoDataService'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { monto } from '@/utils/money'

// Busca en el catalogo mientras se escribe. Elegir copia nombre y precio y guarda
// el id del equipo y el tipo de servicio (los usa la orden); cambiar el texto
// quita el vinculo.
// 'elegido' lleva el servicio, para ofrecer sus precios mientras se edita.
const emit = defineEmits(['elegido'])

const props = defineProps({
  fila: { type: Object, required: true },
  moneda: { type: String, default: 'PEN' },
  placeholder: { type: String, default: '' },
  maxlength: { type: Number, required: true },
})

const LETRAS_PARA_BUSCAR = 2

const { items, loading, searchQuery, total } = usePaginatedSearch(ServicioCatalogoDataService.getFiltered, x => x)

const campo = ref(null)
const enfocado = ref(false)
const cerrado = ref(false)

const termino = computed(() => (props.fila.description || '').trim())
const abierto = computed(() => enfocado.value && !cerrado.value && !props.fila.equipo
  && termino.value.length >= LETRAS_PARA_BUSCAR && searchQuery.value === termino.value && items.value.length > 0)

// Se mide al abrir: leer el ancho en cada dibujo obliga a recalcular toda la pagina.
const anchoDelMenu = ref(undefined)
watch(abierto, (si) => { if (si) anchoDelMenu.value = campo.value?.offsetWidth })

function escribir (texto) {
  props.fila.description = texto
  if (props.fila.equipo) Object.assign(props.fila, { equipo: null, tipo_servicio: null })
  cerrado.value = false
  const buscado = (texto || '').trim()
  if (buscado.length >= LETRAS_PARA_BUSCAR) searchQuery.value = buscado
}

function elegir (servicio) {
  props.fila.description = servicio.nombre
  props.fila.equipo = servicio.equipo
  props.fila.tipo_servicio = servicio.tipo_servicio
  emit('elegido', servicio)
  // Los precios del catalogo son en soles: en dolares no se ponen.
  if (props.moneda === 'PEN') props.fila.unit_price = Number(servicio.precio_estandar)
}
</script>
