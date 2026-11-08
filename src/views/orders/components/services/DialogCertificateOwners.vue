<template>
  <v-dialog :model-value="Boolean(cambio)" class="dialog-premium" width="640" persistent>
    <v-card v-if="cambio">
      <base-modal-header title="Cambiaste el cliente de la orden" icon="mdi-account-switch-outline" @close="emit('volver')">
        {{ cambio.anterior.name }} → {{ cambio.nuevo.name }}
      </base-modal-header>

      <v-card-text class="pt-4">
        <p class="text-body-2 text-medium-emphasis mb-3">Marca los certificados que también pasan al cliente nuevo.</p>
        <v-table density="compact">
          <thead>
            <tr>
              <th style="width: 2.5rem;"></th>
              <th>Certificado</th>
              <th>Equipo</th>
              <th>Hoy a nombre de</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in cambio.filas" :key="fila.id">
              <td>
                <v-icon v-if="fila.publicado" size="small" color="medium-emphasis">mdi-lock-outline</v-icon>
                <v-checkbox-btn v-else v-model="pasan" :value="fila.id" density="compact" />
              </td>
              <td class="text-no-wrap">{{ fila.registry_code }}</td>
              <td>{{ [fila.name, fila.serie].filter(Boolean).join(' · ') }}</td>
              <td>
                {{ duenoDe(fila).name }}
                <div v-if="fila.publicado" class="text-caption text-medium-emphasis">Ya está en la nube</div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="emit('volver')">Volver</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" @click="aplicar">Aplicar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

// Al editar una orden y cambiarle el cliente: cada certificado dice a nombre de quien queda.
// `cambio`: { anterior, nuevo, filas }, con las filas que llevan certificado.
const props = defineProps({
  cambio: { type: Object, default: null },
})
const emit = defineEmits(['volver', 'aplicado'])

const pasan = ref([])
const duenoDe = (fila) => fila.titular_data ?? props.cambio.anterior

// Pasan los que estaban a nombre del cliente anterior.
watch(() => props.cambio, (cambio) => {
  pasan.value = (cambio?.filas ?? []).filter(f => !f.publicado && duenoDe(f).id === cambio.anterior.id).map(f => f.id)
})

// Titular en null es el de la orden: los que no pasan quedan con el suyo escrito.
function aplicar() {
  for (const fila of props.cambio.filas) {
    const dueno = duenoDe(fila)
    if (pasan.value.includes(fila.id)) {
      fila.titular = null
      fila.titular_data = null
    } else {
      fila.titular = dueno.id
      fila.titular_data = { id: dueno.id, name: dueno.name }
    }
  }
  emit('aplicado')
}
</script>
