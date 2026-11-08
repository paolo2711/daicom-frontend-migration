<template>
  <v-row dense align="center">
    <v-col cols="12" :md="COLUMNAS[forma].cliente">
      <client-select
        :class="{ 'cliente-que-baja': forma === 'apilada' }"
        :model-value="modelValue"
        :seed="clienteSembrado"
        label="Cliente (nombre o documento)"
        no-data-text="Sin coincidencias. Puede buscar por RUC/DNI en SUNAT/RENIEC →"
        @update:model-value="onPickLocal"
        @selected="onPickCliente"
      />
    </v-col>

    <v-col cols="12" :md="COLUMNAS[forma].documento">
      <v-text-field
        v-model="documentoBuscar"
        :class="{ 'campo-corto': forma === 'ajustada' }"
        label="RUC/DNI en SUNAT/RENIEC"
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
        <!-- Alta manual, para cuando no esta en la base ni en SUNAT/RENIEC -->
        <template v-if="creatable" v-slot:append>
          <add-new-button texto="Nuevo cliente" @click="dialogAbierto = true" />
        </template>
      </v-text-field>
    </v-col>

    <!-- Dentro de la fila a proposito: con dos nodos raiz el componente deja de
         heredar la clase que le pasa el padre (los paneles le mandan mb-4). -->
    <client-form-dialog v-if="creatable" v-model="dialogAbierto" @reloadListComponent="adoptarCliente" />
  </v-row>
</template>

<script setup>
import { ref, watch, onMounted, defineAsyncComponent } from 'vue'
import { useClientLookup } from '@/composables/useClientLookup'
import ClientDataService from '@/services/clients/clientDataService'
import ClientMappers from '@/mappers/clientMappers'
import ClientSelect from '@/components/shared/ClientSelect.vue'
import AddNewButton from '@/components/commonComponents/AddNewButton.vue'

const ClientFormDialog = defineAsyncComponent(() => import('@/views/clients/components/ClientFormDialog.vue'))

const props = defineProps({
  modelValue: { type: [Number, String], default: null }, // Recibe el ID vinculado
  creatable: { type: Boolean, default: false },          // Muestra el boton de alta manual
  // El cliente vinculado, si quien abre el formulario ya lo tiene. Sin esto hay
  // que ir a buscarlo por su id.
  seed: { type: Object, default: null },
  // 'mitades': cliente y RUC/DNI en 7/5 de la fila. 'ajustada': el RUC/DNI mide lo que su dato
  // (11 cifras) y el cliente toma el resto. 'apilada': uno debajo del otro, para una columna angosta.
  forma: { type: String, default: 'mitades' },
})

const COLUMNAS = {
  mitades: { cliente: 7, documento: 5 },
  ajustada: { cliente: true, documento: 'auto' },
  apilada: { cliente: 12, documento: 12 },
}

const emit = defineEmits(['update:modelValue', 'client-selected'])

const documentoBuscar = ref('')
const dialogAbierto = ref(false)

// El cliente vinculado, para que se vea aunque no venga en la tanda que trajo el
// server: al abrir en modo edicion, al resolverlo contra SUNAT o al crearlo a mano.
const clienteSembrado = ref(null)

const { loadingExternal, loadingResolve, buscarYResolver } = useClientLookup()

const cargarClienteVinculado = async (id) => {
  if (!id || clienteSembrado.value?.id === id) return
  if (props.seed?.id === id) {
    clienteSembrado.value = props.seed
    return
  }
  try {
    const res = await ClientDataService.get(id)
    clienteSembrado.value = ClientMappers.getMap(res.data)
  } catch (error) {
    console.error('Error cargando cliente inicial:', error)
  }
}

onMounted(() => cargarClienteVinculado(props.modelValue))
watch(() => props.modelValue, cargarClienteVinculado)

const onPickLocal = (id) => emit('update:modelValue', id)

const onPickCliente = (cliente) => {
  if (!cliente) return
  clienteSembrado.value = cliente
  emit('client-selected', cliente)
}

// Vale para el recien creado a mano y para el resuelto contra SUNAT/RENIEC: en
// los dos casos hay que dejarlo seleccionado sin salir a buscarlo de nuevo.
const adoptarCliente = (cliente) => {
  if (!cliente?.id) return
  clienteSembrado.value = cliente
  emit('update:modelValue', cliente.id)
  emit('client-selected', cliente)
}

const onBuscarReniec = async () => {
  const doc = documentoBuscar.value.trim()
  if (!doc) return

  const clienteResuelto = await buscarYResolver(doc)
  if (!clienteResuelto) return

  adoptarCliente(clienteResuelto)
  documentoBuscar.value = ''
}
</script>

<style scoped>
/* En una columna angosta el nombre elegido baja de linea; al escribir para buscar, vuelve a una. */
.cliente-que-baja:not(:focus-within) :deep(.v-autocomplete__selection),
.cliente-que-baja:not(:focus-within) :deep(.v-autocomplete__selection-text) {
  white-space: normal;
  overflow: visible;
  height: auto;
}
</style>
