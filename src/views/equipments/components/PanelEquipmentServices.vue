<template>
  <v-card class="panel-servicios d-flex flex-column" elevation="0" rounded="lg" border>
    <detail-empty v-if="!equipo" titulo="Servicios" icono="mdi-format-list-bulleted-type"
                  texto="Elige un equipo para ver sus servicios." />

    <template v-else>
      <div class="pa-3 border-b-thin flex-shrink-0 position-relative">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-format-list-bulleted-type</v-icon>
          <span class="text-subtitle-2 font-weight-bold text-truncate">{{ equipo.nombre_tecnico }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" density="comfortable" title="Cerrar" @click="emit('cerrar')" />
        </div>
        <div class="text-caption text-medium-emphasis">{{ laboratorio }}</div>
        <v-progress-linear :active="cargando" indeterminate absolute location="bottom" height="2" color="primary" />
      </div>

      <div class="cuerpo d-flex flex-column ga-2 pa-3 flex-grow-1" :class="{ cargando }">
        <v-btn v-if="puedeEditar" variant="tonal" prepend-icon="mdi-plus" class="align-self-start mb-1"
               @click="emit('accion', 'agregar')">Agregar servicio</v-btn>

        <div v-for="servicio in servicios" :key="servicio.id" class="d-flex align-center ga-2"
             :class="{ 'fila-que-abre': puedeEditar, 'servicio-solo-lectura': !puedeEditar }"
             @click="puedeEditar && emit('accion', 'editar', servicio)"
             @contextmenu="e => puedeEditar && alClickDerecho(e, { item: servicio })">
          <div class="flex-grow-1 min-w-0">
            <div class="text-body-2 font-weight-medium">{{ servicio.nombre }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ servicio.tipo_servicio_label }} · Estándar {{ monto(servicio.precio_estandar) }}
              · Corporativo {{ monto(servicio.precio_corporativo) }}
            </div>
          </div>
          <v-btn v-if="puedeEditar" icon="mdi-dots-vertical" variant="text" density="comfortable"
                 color="grey-darken-1" @click.stop="alBotonDeFila($event, servicio)" />
        </div>

        <p v-if="detalle && !servicios.length" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
          Este equipo todavía no tiene servicios.
        </p>
      </div>
    </template>

    <action-menu v-model:menu="menu" :acciones="accionesDe(menu.filas)"
                 @accion="clave => emit('accion', clave, menu.filas[0])" />
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import { useContextMenu } from '@/composables/useContextMenu'
import { useLatestRequest } from '@/composables/useLatestRequest'
import ActionMenu from '@/components/shared/ActionMenu.vue'
import DetailEmpty from '@/components/shared/DetailEmpty.vue'
import { mensajeDeError } from '@/utils/errors'
import { monto } from '@/utils/money'

// Los servicios del equipo elegido en el catalogo, pedidos al abrirlo. `recarga` cambia cuando la pantalla
// guardo algo; `accionesDe` son las de un servicio (useCatalogActions).
const props = defineProps({
  equipo: { type: Object, default: null },
  recarga: { type: Number, default: 0 },
  accionesDe: { type: Function, required: true },
  puedeEditar: { type: Boolean, default: false },
})
// accion(clave, servicio): 'agregar' sin servicio.
const emit = defineEmits(['cerrar', 'accion'])

const detalle = ref(null)
const cargando = ref(false)
const servicios = computed(() => detalle.value?.servicios ?? [])
const laboratorio = computed(() => props.equipo?.laboratorio_data?.name || 'Sin laboratorio')
const { menu, alClickDerecho, alBotonDeFila } = useContextMenu(servicios)
const { begin, isLatest } = useLatestRequest()

// Lo del equipo anterior se queda, apagado, hasta que llega lo nuevo.
async function cargar () {
  if (!props.equipo) return
  const token = begin()
  cargando.value = true
  try {
    const { data } = await EquipmentDataService.get(props.equipo.id)
    if (isLatest(token)) detalle.value = data
  } catch (err) {
    if (isLatest(token)) Swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, 'No se pudieron leer sus servicios.') })
  } finally {
    if (isLatest(token)) cargando.value = false
  }
}
watch(() => [props.equipo?.id, props.recarga], cargar, { immediate: true })
</script>

<style scoped>
.panel-servicios { max-height: 85vh; }
.cuerpo { overflow-y: auto; min-height: 0; }
.cargando { opacity: 0.5; pointer-events: none; }
.servicio-solo-lectura { padding: 0.625rem 0.75rem; border-radius: 0.625rem; background: rgba(var(--v-theme-on-surface), 0.05); }
</style>
