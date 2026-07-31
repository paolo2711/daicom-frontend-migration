<template>
  <v-card variant="flat" class="pa-2 bg-surface">

    <div class="d-flex align-center mb-3">
      <div class="text-subtitle-1 font-weight-bold text-primary">
        <v-icon size="small" class="mr-1">mdi-toolbox-outline</v-icon> Lista de Instrumentos
      </div>
      <v-spacer />
      <v-btn color="primary" variant="flat" density="compact" prepend-icon="mdi-plus" @click="addInstrument">
        AÑADIR INSTRUMENTO
      </v-btn>
    </div>

    <v-table density="compact" class="tabla-mejorada border rounded-lg mb-3">
      <thead :class="$vuetify.theme.current.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'">
        <tr>
          <th width="50" class="text-center font-weight-bold">Item</th>
          <th class="text-left font-weight-bold">Descripción</th>
          <th width="140" class="text-left font-weight-bold">Marca</th>
          <th width="140" class="text-left font-weight-bold">Modelo</th>
          <th width="120" class="text-left font-weight-bold">Serie</th>
          <th width="130" class="text-left font-weight-bold">Estado</th>
          <th width="60" class="text-center font-weight-bold">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="instruments.length === 0">
          <td colspan="7" class="text-center text-medium-emphasis py-4">
            No hay instrumentos agregados. Haga clic en "Añadir Instrumento".
          </td>
        </tr>

        <tr v-for="(row, index) in instruments" :key="index">
          <td class="text-center font-weight-bold text-grey-darken-1">{{ index + 1 }}</td>
          <td class="py-1">
            <v-text-field v-model="row.description" density="compact" variant="outlined" hide-details placeholder="Ej: Vernier digital" />
          </td>
          <td class="py-1">
            <v-text-field v-model="row.brand" density="compact" variant="outlined" hide-details />
          </td>
          <td class="py-1">
            <v-text-field v-model="row.model" density="compact" variant="outlined" hide-details />
          </td>
          <td class="py-1">
            <v-text-field v-model="row.serial" density="compact" variant="outlined" hide-details />
          </td>
          <td class="py-1">
            <v-select v-model="row.condition" :items="['Bueno', 'Regular', 'Malo']" density="compact" variant="outlined" hide-details />
          </td>
          <td class="text-center">
            <v-btn icon variant="text" size="small" color="error" @click="removeInstrument(index)">
              <v-icon size="small">mdi-delete-outline</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup>
const props = defineProps({
  instruments: Array
})

const addInstrument = () => {
  props.instruments.push({
    description: "",
    brand: "",
    model: "",
    serial: "",
    condition: "Bueno"
  })
}

const removeInstrument = (index) => {
  props.instruments.splice(index, 1)
}
</script>