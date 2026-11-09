<template>
  <div class="d-flex flex-column fill-height">
    <div class="titulo-de-hoja bg-primary flex-shrink-0">
      <span>Equipo {{ indice + 1 }}</span>
      <span v-if="eq.registry_code" class="text-caption ml-2">· Certificado {{ eq.registry_code }}</span>
      <span v-else-if="eq.certificate_type" class="text-caption ml-2">· N° estimado {{ estimado }}</span>
      <v-spacer />
      <v-btn icon="mdi-check" color="white" variant="flat" size="x-small" class="text-primary" title="Listo (Enter)"
             @click="emit('cerrar')" />
    </div>

    <div class="d-flex flex-column ga-3 pa-3 overflow-y-auto flex-grow-1">
      <section class="seccion">
        <div class="titulo-de-seccion">Equipo</div>
        <paginated-autocomplete v-if="nuevo" v-model="eq.name" :fetch="fetchEquipments" :mapper="EquipmentMappers.getMap"
                                recurso="equipos" :seed="semillaDeEquipo" @selected="conSuLaboratorio"
                                label="Equipo" :return-object="false" item-title="name" item-value="id"
                                v-bind="CAMPO" />
        <v-text-field v-else :model-value="eq.name" label="Equipo" readonly v-bind="CAMPO" />
        <v-textarea v-for="campo in CAMPOS" :key="campo.clave" v-model="eq[campo.clave]"
                    :label="campo.etiqueta" :maxlength="largos[campo.clave]" :readonly="eq.publicado" v-bind="TEXTO" />
        <div v-if="eq.publicado" class="text-caption text-medium-emphasis">
          Su certificado está en la nube: marca, modelo, serie y titular ya no cambian.
        </div>
      </section>

      <section class="seccion">
        <div class="titulo-de-seccion">Servicio</div>
        <v-select v-if="nuevo" v-model="opcion" :items="itemsDeSeleccion(opciones)" label="Servicio"
                  :error="!eq.tipo_servicio" v-bind="CAMPO" />
        <v-text-field v-else :model-value="tituloDe(eq, opciones)" label="Servicio" readonly v-bind="CAMPO" />
        <paginated-autocomplete v-if="nuevo" v-model="eq.lab" :fetch="fetchLabs" :mapper="LabMappers.getMap"
                                recurso="labs" :seed="eq.lab_data" @selected="l => (eq.lab_data = l)"
                                label="Laboratorio" :return-object="false" item-title="name" item-value="id"
                                v-bind="CAMPO" />
        <v-text-field v-else :model-value="eq.lab_data?.name || '—'" label="Laboratorio" readonly v-bind="CAMPO" />
        <template v-if="eq.certificate_type">
          <div class="text-caption text-medium-emphasis mt-1">Certificado a nombre de</div>
          <client-select :model-value="eq.titular ?? cliente?.id" :seed="eq.titular_data ?? cliente"
                         :label="cliente || eq.titular ? 'Cliente' : 'El cliente de la orden'" :disabled="eq.publicado"
                         @update:model-value="conTitular" @selected="conTitularElegido" />
        </template>
      </section>

      <section class="seccion">
        <div class="titulo-de-seccion">Comentario</div>
        <v-textarea v-model="eq.comentario" label="Estado, accesorios" :maxlength="largos.comentario" v-bind="TEXTO" />
      </section>

      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </div>

    <div class="d-flex ga-2 px-4 py-3 border-t-thin flex-shrink-0">
      <v-btn variant="outlined" prepend-icon="mdi-content-copy" title="Mismo equipo, marca, modelo y servicio, sin serie"
             @click="emit('otro-igual')">Otro igual</v-btn>
      <v-spacer />
      <v-btn v-if="seQuita(eq)" variant="text" color="red" prepend-icon="mdi-delete" @click="emit('borrar', indice)">
        Quitar
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import LabDataService from '@/services/labs/labDataService'
import EquipmentMappers from '@/mappers/equipmentMappers'
import LabMappers from '@/mappers/labMappers'
import ClientSelect from '@/components/shared/ClientSelect.vue'
import { conOpcion, itemsDeSeleccion, opcionDe, seQuita, tituloDe, useOrderServices } from '@/composables/useOrderServices'

// Todo lo de un equipo de FormOrderService, en una columna. Enter lo cierra y
// Shift+Enter baja de linea.
const props = defineProps({
  eq: { type: Object, required: true },
  indice: { type: Number, required: true },
  estimado: { type: String, default: '' },
  error: { type: String, default: '' },
  // El cliente de la orden, {id, name}.
  cliente: { type: Object, default: null },
})
const emit = defineEmits(['cerrar', 'otro-igual', 'borrar'])

const CAMPO = { density: 'compact', variant: 'outlined', rounded: 'lg', hideDetails: true }
const CAMPOS = [
  { clave: 'marca', etiqueta: 'Marca' },
  { clave: 'modelo', etiqueta: 'Modelo' },
  { clave: 'serie', etiqueta: 'Serie / Código' },
]
const TEXTO = { ...CAMPO, rows: 1, noResize: true, class: 'crece-con-texto', onKeydown: alEnter }

function alEnter(e) {
  if (e.key !== 'Enter' || e.shiftKey) return
  e.preventDefault()
  emit('cerrar')
}

const nuevo = computed(() => props.eq.modo === 'nuevo')
const fetchEquipments = (page, size, query) => EquipmentDataService.getFiltered(page, size, query)
const fetchLabs = (page, size, query) => LabDataService.getFiltered(page, size, query)
// El equipo se guarda como su nombre, que en el catalogo es tambien el id.
const semillaDeEquipo = computed(() => (props.eq.name ? { id: props.eq.name, name: props.eq.name } : null))

const { opciones, largos } = useOrderServices()
const opcion = computed({
  get: () => opcionDe(props.eq),
  set: (clave) => conOpcion(props.eq, clave, opciones.value),
})

// Sin titular, o con el mismo cliente de la orden, el certificado sale a nombre de la orden.
function conTitular(id) {
  if (id && id !== props.cliente?.id) return
  props.eq.titular = null
  props.eq.titular_data = null
}

function conTitularElegido(cliente) {
  if (!cliente || cliente.id === props.cliente?.id) return
  props.eq.titular = cliente.id
  props.eq.titular_data = { id: cliente.id, name: cliente.name }
}

// El equipo trae el laboratorio que lo calibra; sin uno, queda el ya elegido.
function conSuLaboratorio(equipo) {
  if (!equipo?.laboratorio) return
  props.eq.lab = equipo.laboratorio.id
  props.eq.lab_data = equipo.laboratorio
}
</script>
