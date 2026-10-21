<template>
  <tr :class="{ 'fila-con-error': error }">
    <td class="text-no-wrap">
      <drag-handle v-bind="asa" class="mr-1" />
      <span v-if="eq.modo === 'nuevo'" class="numero-estimado">{{ estimado }}</span>
      <span v-else class="font-weight-medium">{{ eq.registry_code }}</span>
    </td>
    <td>
      <paginated-autocomplete v-if="eq.modo === 'nuevo'" v-model="eq.name" :fetch="fetchEquipments"
                              :mapper="EquipmentMappers.getMap" recurso="equipos" :seed="semillaDeEquipo"
                              :return-object="false" item-title="name" item-value="id"
                              variant="plain" density="compact" hide-details />
      <template v-else>
        <span class="text-subtitle-2">{{ eq.name }}</span>
        <span class="text-caption text-medium-emphasis"> · vinculado</span>
      </template>
      <div v-if="error" class="text-caption text-error">{{ error }}</div>
    </td>
    <template v-if="eq.modo === 'nuevo'">
      <td>
        <paginated-autocomplete v-model="eq.lab" :fetch="fetchLabs" :mapper="LabMappers.getMap"
                                recurso="labs" :seed="eq.lab_data" @selected="l => (eq.lab_data = l)"
                                :return-object="false" item-title="name" item-value="id"
                                variant="plain" density="compact" hide-details />
      </td>
      <td>
        <v-select v-model="eq.certificate_type" :items="TIPOS_CERTIFICADO"
                  variant="plain" density="compact" hide-details />
      </td>
    </template>
    <template v-else>
      <td class="text-medium-emphasis">{{ eq.lab_data?.name || '—' }}</td>
      <td class="text-medium-emphasis">{{ nombreDelTipo(eq.certificate_type) }}</td>
    </template>
    <td class="text-right">
      <v-btn icon size="x-small" variant="text" color="red" density="comfortable" @click="emit('borrar', indice)">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import DragHandle from '@/components/shared/DragHandle.vue'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import LabDataService from '@/services/labs/labDataService'
import EquipmentMappers from '@/mappers/equipmentMappers'
import LabMappers from '@/mappers/labMappers'
import { TIPOS_CERTIFICADO, nombreDelTipo } from '@/utils/certificates/tipos'

// Una fila de FormOrderService. Es su propio componente para que editarla no redibuje las demas.
const props = defineProps({
  eq: { type: Object, required: true },
  indice: { type: Number, required: true },
  estimado: { type: String, default: '' },
  error: { type: String, default: '' },
  // El asa(i) de useRowDrag.
  asa: { type: Object, required: true },
})
const emit = defineEmits(['borrar'])

const fetchEquipments = (page, size, query) => EquipmentDataService.getFiltered(page, size, query)
const fetchLabs = (page, size, query) => LabDataService.getFiltered(page, size, query)
// El equipo se guarda como su nombre, que en el catalogo es tambien el id.
const semillaDeEquipo = computed(() => (props.eq.name ? { id: props.eq.name, name: props.eq.name } : null))
</script>
