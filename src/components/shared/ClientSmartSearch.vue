<template>
  <v-row dense align="center">
    <!-- Buscador Local -->
    <v-col cols="12" :md="creatable ? 5 : 7">
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
    <v-col cols="12" :md="creatable ? 4 : 5">
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

    <!-- Alta manual, para cuando no esta en la base ni en SUNAT/RENIEC -->
    <v-col v-if="creatable" cols="12" md="3">
      <v-btn color="primary" variant="flat" block height="40" @click="dialogAbierto = true">
        <v-icon start>mdi-plus</v-icon> NUEVO
      </v-btn>
    </v-col>

    <!-- Dentro de la fila a proposito: con dos nodos raiz el componente deja de
         heredar la clase que le pasa el padre (los paneles le mandan mb-4). -->
    <client-form-dialog v-if="creatable" v-model="dialogAbierto" @reloadListComponent="onClienteCreado" />
  </v-row>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useClientLookup } from '@/composables/useClientLookup'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'

const ClientFormDialog = defineAsyncComponent(() => import('@/views/clients/components/ClientFormDialog.vue'))

const props = defineProps({
  modelValue: { type: [Number, String], default: null }, // Recibe el ID vinculado
  creatable: { type: Boolean, default: false },          // Muestra el boton de alta manual
})

const emit = defineEmits(['update:modelValue', 'client-selected'])

const documentoBuscar = ref('')
const dialogAbierto = ref(false)

// RENIEC/SUNAT y resolución contra BD (sin cambios)
const {
  loadingExternal, loadingResolve, buscarYResolver,
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

// Recien creado a mano: lo sembramos en la lista y lo dejamos seleccionado, si
// no habria que salir a buscarlo otra vez.
const onClienteCreado = (cliente) => {
  if (!cliente?.id) return
  localResults.value = [cliente]
  emit('update:modelValue', cliente.id)
  emit('client-selected', cliente)
}

const onBuscarReniec = async () => {
  const doc = documentoBuscar.value.trim()
  if (!doc) return

  const clienteResuelto = await buscarYResolver(doc)
  if (!clienteResuelto) return

  // Inyectamos el cliente en la lista para que Vuetify mapee el ID al Nombre
  localResults.value = [clienteResuelto]

  emit('update:modelValue', clienteResuelto.id)
  emit('client-selected', clienteResuelto)

  documentoBuscar.value = ''
}
</script>