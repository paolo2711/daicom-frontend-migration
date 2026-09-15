<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">

        <!-- ── Barra de título y acciones ── -->
        <div class="d-flex align-center mb-4">

          <v-icon size="large" color="primary" class="mr-3">mdi-certificate</v-icon>
          <h2 class="text-h5 font-weight-bold mb-0">Gestión de Certificados</h2>

          <v-spacer />

          <!-- Excel suelto: no pasa por la lista porque no es de ningún certificado -->
          <v-btn variant="outlined" color="primary" class="mr-3" @click="printSheetRef?.open()">
            <template v-slot:prepend>
              <v-icon>mdi-printer</v-icon>
            </template>
            Excel a PDF
          </v-btn>

          <!-- Nuevo certificado: abre el modal del hijo directamente -->
          <v-btn color="primary" @click="abrirNuevoCertificado">
            <template v-slot:prepend>
              <v-icon>mdi-plus</v-icon>
            </template>
            Nuevo Certificado
          </v-btn>

        </div>

        <!-- Componente hijo (carga lazy) -->
        <list-certificates
          ref="listCerts"
          :modo_agrupar_prop="modo_agrupar_local"
        />

        <print-sheet ref="printSheetRef" />

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'

// Carga lazy idéntica al original
const ListCertificates = defineAsyncComponent(
  () => import('@/views/certificates/components/ListCertificates.vue')
)
const PrintSheet = defineAsyncComponent(
  () => import('@/views/certificates/components/PrintSheet.vue')
)

// ─── Estado local ─────────────────────────────────────────────────────────────
const modo_agrupar_local = ref(false)
// El ref no se puede llamar printSheet: <print-sheet> cameliza a ese nombre y
// Vue resolveria el componente al ref en vez de al import.
const printSheetRef = ref(null)

// ─── Ref al componente hijo ───────────────────────────────────────────────────
// En Vue 3 con <script setup>, para acceder a métodos/refs del hijo,
// éste debe exponerlos con defineExpose() — ver ListCertificates.vue.
const listCerts = ref(null)

// ─── Métodos ──────────────────────────────────────────────────────────────────

/**
 * Abre el modal "Nuevo Certificado" accediendo al ref expuesto del hijo.
 * Equivale al original: this.$refs.listCerts.$refs.certificateModal.open()
 */
function abrirNuevoCertificado () {
  listCerts.value?.certificateModal?.open()
}
</script>