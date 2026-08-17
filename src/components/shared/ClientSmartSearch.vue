<template>
  <v-row dense align="center">
    <!-- Buscador Local -->
    <v-col cols="12" md="7">
      <v-autocomplete
        :model-value="modelValue"
        @update:model-value="onPickLocal"
        @update:search="searchQuery = $event"
        :items="localResults"
        :loading="loadingLocal"
        item-title="name"
        item-value="id"
        density="compact"
        variant="outlined"
        hide-details="auto"
        clearable
        label="Buscar cliente registrado (nombre o documento)"
        no-data-text="Sin coincidencias. Puede buscar por RUC/DNI en SUNAT/RENIEC →"
        no-filter
        @click:clear="onClear"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props">
            <v-list-item-subtitle class="text-caption">
              {{ item.raw.documentType_name }}: {{ item.raw.document || '---' }}
            </v-list-item-subtitle>
          </v-list-item>
        </template>
        <!-- Aviso generico: hay mas coincidencias de las mostradas. -->
        <template v-if="hayMasClientes" v-slot:append-item>
          <div class="px-4 py-2 text-caption text-medium-emphasis">
            <v-icon size="14" class="mr-1">mdi-magnify</v-icon>
            Hay más resultados — escribe para afinar la búsqueda.
          </div>
        </template>
      </v-autocomplete>
    </v-col>

    <!-- La Lupita (SUNAT/RENIEC) -->
    <v-col cols="12" md="5">
      <v-text-field
        v-model="documentoBuscar"
        label="Buscar RUC/DNI en SUNAT/RENIEC"
        density="compact"
        variant="outlined"
        hide-details="auto"
        @keyup.enter="onBuscarReniec"
      >
        <template v-slot:append-inner>
          <v-btn icon size="small" variant="text" color="primary" @click="onBuscarReniec" :loading="loadingExternal || loadingResolve">
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </template>
      </v-text-field>
    </v-col>
  </v-row>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { ref, computed, inject, watch, onMounted } from 'vue'
import { useClientLookup } from '@/composables/useClientLookup'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'

const props = defineProps({
  modelValue: { type: [Number, String], default: null }, // Recibe el ID vinculado
})

const emit = defineEmits(['update:modelValue', 'client-selected'])
const swal = inject('$swal')

const documentoBuscar = ref('')

// RENIEC/SUNAT y resolución contra BD (sin cambios)
const {
  loadingExternal, loadingResolve,
  buscarReniec, resolverContraBaseDeDatos,
} = useClientLookup()

// SOLUCIÓN DE RAÍZ: búsqueda local vía usePaginatedSearch, que preserva el
// ítem activo (modelValue) aunque el backend no lo devuelva en la nueva página/búsqueda.
// Esto evita que Vuetify pierda el nombre y muestre el ID crudo tras seleccionar.
const {
  items: localResults,
  loading: loadingLocal,
  searchQuery,
  retrieveData,
  total: totalClientes,
} = usePaginatedSearch(
  ClientDataService.getFiltered,
  ClientMappers.getMap,
  () => props.modelValue
)

// ¿El server tiene mas coincidencias que las mostradas? -> aviso "escribe para afinar".
const hayMasClientes = computed(() => totalClientes.value > localResults.value.length)

// Carga inicial: si el componente se abre en modo edición, usePaginatedSearch
// no puede "adivinar" el cliente porque nunca estuvo en `items`, así que lo
// traemos explícitamente por ID y lo sembramos en la lista.
const loadInitialClient = async (id) => {
  if (!id) return
  if (localResults.value.some(c => c.id === id)) return

  try {
    const res = await ClientDataService.get(id)
    localResults.value = [ClientMappers.getMap(res.data)]
  } catch (error) {
    console.error("Error cargando cliente inicial:", error)
  }
}

onMounted(() => {
  // Carga inicial: los primeros 10 clientes (mismo patron que el resto de
  // comboboxes) para que el desplegable NUNCA abra vacio. Al teclear, re-busca.
  retrieveData('')
  if (props.modelValue) loadInitialClient(props.modelValue)
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) loadInitialClient(newVal)
})

const onPickLocal = (id) => {
  emit('update:modelValue', id)
  if (!id) return

  const cliente = localResults.value.find(c => c.id === id)
  if (cliente) {
    emit('client-selected', cliente)
  }
}

const onClear = () => {
  emit('update:modelValue', null)
}

const onBuscarReniec = async () => {
  const doc = documentoBuscar.value.trim()
  if (!doc) return

  try {
    const resultadoReniec = await buscarReniec(doc)
    const clienteResuelto = await resolverContraBaseDeDatos(resultadoReniec)

    // Inyectamos el cliente en la lista para que Vuetify mapee el ID al Nombre
    localResults.value = [clienteResuelto]

    emit('update:modelValue', clienteResuelto.id)
    emit('client-selected', clienteResuelto)

    documentoBuscar.value = ''

    if (clienteResuelto.created && swal) {
      Toast.fire({ timer: 3000,
        icon: 'success',
        title: 'Nuevo cliente registrado'
      })
    }
  } catch (error) {
    if (swal) {
      swal.fire('No encontrado', 'El documento no existe en SUNAT/RENIEC o hubo un error.', 'warning')
    }
  }
}
</script>