<template>
  <v-card variant="flat" class="pa-2 bg-surface">
    
    <!-- TEXTO INTRODUCTORIO -->
    <div class="mb-4">
      <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mb-1">Texto Introductorio</div>
      <v-textarea v-model="quote.intro_text" density="compact" variant="outlined" rows="2" auto-grow hide-details="auto" />
    </div>

    <v-divider class="my-4"></v-divider>

    <!-- NOTA GENERAL DE SERVICIO (Lo que antes parecía una fila) -->
    <div class="mb-4">
      <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mb-1">Nota destacada del servicio (Opcional)</div>
      <v-text-field v-model="quote.service_conditions_note" density="compact" variant="outlined" hide-details="auto" placeholder="Ej: (EL PRESUPUESTO ES SOLO POR CALIBRACIÓN...)" />
    </div>

    <!-- CONDICIONES DE SERVICIO (Array) -->
    <div class="mb-4 border rounded-lg pa-3" :class="$vuetify.theme.current.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'">
      <div class="d-flex align-center mb-2">
        <v-icon size="small" class="mr-1">mdi-format-list-checks</v-icon>
        <span class="text-subtitle-2 font-weight-bold">Condiciones del Servicio</span>
      </div>
      <v-row dense v-for="(cond, index) in quote.service_conditions" :key="'cond'+index" class="mb-1 align-center">
        <v-col cols="11">
          <v-text-field v-model="quote.service_conditions[index]" density="compact" variant="outlined" hide-details="auto" />
        </v-col>
        <v-col cols="1" class="text-right">
          <v-btn icon variant="text" size="small" color="error" @click="quote.service_conditions.splice(index, 1)">
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-btn variant="text" color="primary" size="small" class="mt-2" prepend-icon="mdi-plus" @click="quote.service_conditions.push('')">
        Añadir Condición
      </v-btn>
    </div>

    <!-- ENTREGABLES Y REQUERIMIENTOS -->
    <v-row dense>
      <v-col cols="12" md="6">
        <div class="border rounded-lg pa-3 h-100">
          <div class="text-subtitle-2 font-weight-bold mb-2">Tiempos de Entrega</div>
          <v-text-field v-model="quote.estimated_delivery.label" label="Título" density="compact" variant="outlined" hide-details="auto" class="mb-2" />
          <v-text-field v-model="quote.estimated_delivery.value" label="Valor (Ej: 4 días hábiles)" density="compact" variant="outlined" hide-details="auto" />
          
          <div class="text-subtitle-2 font-weight-bold mt-4 mb-2">Nota Final</div>
          <v-text-field v-model="quote.final_note" density="compact" variant="outlined" hide-details="auto" />
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <div class="border rounded-lg pa-3 h-100">
          <v-text-field v-model="quote.requirements_note" label="Título Requerimientos" density="compact" variant="outlined" hide-details="auto" class="mb-2 font-weight-bold" />
          
          <div v-for="(req, index) in quote.requirements" :key="'req'+index" class="d-flex align-center mb-1">
            <v-text-field v-model="quote.requirements[index]" density="compact" variant="outlined" hide-details="auto" />
            <v-btn icon variant="text" size="small" color="error" class="ml-1" @click="quote.requirements.splice(index, 1)">
              <v-icon size="small">mdi-close</v-icon>
            </v-btn>
          </div>
          <v-btn variant="text" color="primary" size="small" class="mt-1" prepend-icon="mdi-plus" @click="quote.requirements.push('')">Añadir Requerimiento</v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- OBSERVACIONES GENERALES (Array - Bancos, Horarios) -->
    <div class="mt-4 border rounded-lg pa-3">
      <div class="text-subtitle-2 font-weight-bold mb-2">Observaciones / Cuentas Bancarias</div>
      <div v-for="(obs, index) in quote.observations" :key="'obs'+index" class="d-flex align-center mb-1">
        <v-text-field v-model="quote.observations[index]" density="compact" variant="outlined" hide-details="auto" />
        <v-btn icon variant="text" size="small" color="error" class="ml-1" @click="quote.observations.splice(index, 1)">
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </div>
      <v-btn variant="text" color="primary" size="small" class="mt-1" prepend-icon="mdi-plus" @click="quote.observations.push('')">Añadir Observación</v-btn>
    </div>

  </v-card>
</template>

<script setup>
const props = defineProps({
  quote: Object
})
</script>