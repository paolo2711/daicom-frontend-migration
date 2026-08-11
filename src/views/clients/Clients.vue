<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-2 flex-wrap ga-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">mdi-account-group</v-icon>
            <h2 class="text-h5 font-weight-bold mb-0">Gestión de Clientes</h2>
          </div>

          <v-spacer></v-spacer>

          <div class="d-flex align-center flex-wrap ga-3">
            <div style="min-width: 340px;">
              <div class="d-flex align-center">
                <v-text-field
                  v-model="documentoBuscar"
                  label="Agregar cliente por RUC / DNI"
                  placeholder="Ej: 20558088649"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="width: 300px;"
                  prepend-inner-icon="mdi-fingerprint"
                  @keyup.enter="onBuscarReniec"
                />
                <v-btn color="primary" variant="flat" class="ml-2" @click="onBuscarReniec" :loading="loadingExternal || loadingResolve">
                  <v-icon start size="small">mdi-magnify</v-icon> Agregar
                </v-btn>
              </div>
              <div class="text-caption text-medium-emphasis mt-1" style="max-width: 340px; line-height: 1.2;">
                Recomendado: valida contra SUNAT/RENIEC y crea o actualiza el cliente automáticamente.
              </div>
            </div>

            <v-btn color="primary" variant="outlined" prepend-icon="mdi-pencil-plus-outline" @click="listClients?.openAddDialog()">
              CARGA MANUAL
            </v-btn>
          </div>
        </div>

        <list-clients ref="listClients" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { ref, defineAsyncComponent } from 'vue'
import Swal from 'sweetalert2'
import ListClients from '@/views/clients/components/ListClients.vue'
import { useClientLookup } from '@/composables/useClientLookup'

const listClients = ref(null)

const documentoBuscar = ref('')
const { loadingExternal, loadingResolve, buscarReniec, resolverContraBaseDeDatos } = useClientLookup()

const onBuscarReniec = async () => {
  const doc = documentoBuscar.value.trim()
  if (!doc) return

  try {
    const resultadoReniec = await buscarReniec(doc)
    const clienteResuelto = await resolverContraBaseDeDatos(resultadoReniec)

    documentoBuscar.value = ''
    listClients.value?.retrieveAllClients()

    Toast.fire({ timer: 3000,
      icon: 'success',
      title: clienteResuelto.created ? 'Nuevo cliente registrado' : 'Cliente sincronizado con RENIEC/SUNAT'
    })
  } catch (error) {
    Swal.fire('No encontrado', 'El documento no existe en SUNAT/RENIEC o hubo un error.', 'warning')
  }
}
</script>