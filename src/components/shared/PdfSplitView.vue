<template>
  <!-- Una lista con el PDF de la fila elegida al lado. La lista va en el slot;
       sus filas marcan `fila-con-pdf` (clic) y `fila-en-vista` (la elegida). -->
  <div ref="contenedor" class="d-flex align-start" :class="{ arrastrando }">
    <div ref="lista" :class="alLado ? 'flex-shrink-0' : 'flex-grow-1'" :style="alLado ? { width: `${ancho}%` } : null">
      <slot />
    </div>

    <template v-if="alLado">
      <split-divider @pointerdown="empezarArrastre" />

      <v-card ref="visor" class="visor d-flex flex-column flex-grow-1" rounded="lg" border elevation="0"
              :style="{ height: altoDelVisor }">
        <div class="visor-header d-flex align-center px-3 flex-shrink-0">
          <span class="text-subtitle-2 font-weight-bold text-truncate">{{ tituloDe(enVista) }}</span>
          <v-spacer />
          <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-open-in-new"
                 :href="pdfDe(enVista)" target="_blank">
            {{ OTRA_PESTANA }}
          </v-btn>
          <v-btn icon="mdi-close" size="small" variant="text" @click="cerrar" />
        </div>
        <pdf-preview class="flex-grow-1" :url="pdfDe(enVista)" :titulo="tituloDe(enVista)" al-ancho />
      </v-card>
    </template>

    <pdf-preview-dialog :model-value="Boolean(enVista) && !alLado" :url="enVista ? pdfDe(enVista) : ''">
      <template #encabezado>
        <v-icon class="ml-4 mr-2">mdi-file-pdf-box</v-icon>
        <span class="text-subtitle-1 font-weight-bold text-truncate">{{ enVista && tituloDe(enVista) }}</span>
      </template>
      <template #acciones>
        <v-btn variant="text" class="mr-2 font-weight-bold" prepend-icon="mdi-open-in-new"
               :href="enVista ? pdfDe(enVista) : undefined" target="_blank">
          {{ OTRA_PESTANA }}
        </v-btn>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </template>
    </pdf-preview-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import PdfPreview from '@/components/shared/PdfPreview.vue'
import { useSplitWidth } from '@/composables/useSplitWidth'
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'
import SplitDivider from '@/components/shared/SplitDivider.vue'
import { OTRA_PESTANA } from '@/utils/pdf'

const props = defineProps({
  // El id de la fila cuyo PDF se ve; null, ninguna.
  modelValue: { type: [Number, String], default: null },
  // Las filas que muestra la lista, en su orden: ↑ ↓ las recorren.
  items: { type: Array, required: true },
  pdfDe: { type: Function, required: true },
  tituloDe: { type: Function, required: true },
  // Con que nombre se recuerda el ancho de la lista en esta pantalla.
  clave: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const ANCHO_INICIAL = 40   // % de la lista
// En rem; el CSS las toma de aca (v-bind).
const MINIMO_DEL_PDF = 20
const MARGEN = 1
const minimoDelPdf = `${MINIMO_DEL_PDF}rem`
const margen = `${MARGEN}rem`

const { mdAndUp } = useDisplay()
const enVista = computed(() => props.items.find(i => i.id === props.modelValue) || null)
// Sigue al ancho mientras esta abierto: al lado si entra; si no, el mismo PDF a pantalla completa.
const alLado = computed(() => Boolean(enVista.value) && mdAndUp.value)
const cerrar = () => emit('update:modelValue', null)

// Si la fila deja la lista (otra pagina, un filtro), la vista se cierra y no vuelve sola.
watch([enVista, alLado], ([fila, lado]) => {
  if (!fila && props.modelValue !== null) cerrar()
  else if (lado) nextTick(medirVisor)
})

// El ancho de la lista: lo elige cada uno arrastrando el divisor y se recuerda en ese navegador.
const { contenedor, lista, ancho, arrastrando, empezarArrastre, enRem } =
  useSplitWidth(`vistaPdf.${props.clave}`, { inicial: ANCHO_INICIAL, minimoDelPanel: MINIMO_DEL_PDF })

// ── El alto: de su borde de arriba al pie de la pantalla, tanto donde empieza
// como pegado arriba al bajar por la lista. ──
const visor = ref(null)
const arribaDelVisor = ref(0)
const altoDelVisor = computed(() =>
  `calc(${100 - (arribaDelVisor.value / window.innerHeight) * 100}vh - ${MARGEN}rem)`)

function medirVisor () {
  const borde = visor.value?.$el.getBoundingClientRect().top
  if (borde !== undefined) arribaDelVisor.value = Math.max(borde, enRem(MARGEN))
}

// ── Teclado: ↑ ↓ pasan a la fila de al lado y Esc cierra. Con un dialogo o
// menu abierto encima, las teclas son de el. ──
function alTeclado (e) {
  if (!enVista.value || e.target.closest?.('input, textarea, [contenteditable]')) return
  if (document.querySelector('.v-overlay--active')) return
  if (e.key === 'Escape') return cerrar()
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  const conPdf = props.items.filter(i => props.pdfDe(i))
  const otra = conPdf[conPdf.findIndex(i => i.id === props.modelValue) + (e.key === 'ArrowDown' ? 1 : -1)]
  if (otra) {
    e.preventDefault()
    emit('update:modelValue', otra.id)
  }
}

onMounted(() => {
  window.addEventListener('keydown', alTeclado)
  window.addEventListener('scroll', medirVisor, { passive: true, capture: true })
  window.addEventListener('resize', medirVisor)
})
onUnmounted(() => {
  window.removeEventListener('keydown', alTeclado)
  window.removeEventListener('scroll', medirVisor, { capture: true })
  window.removeEventListener('resize', medirVisor)
})
</script>

<style scoped>
/* Mientras se arrastra, el PDF no se queda con el mouse. */
.arrastrando :deep(iframe) { pointer-events: none; }
.arrastrando { user-select: none; }
:deep(.fila-con-pdf) { cursor: pointer; }
:deep(.fila-en-vista) > td { background-color: rgba(var(--v-theme-primary), 0.14); }
.visor {
  position: sticky;
  top: v-bind(margen);
  min-width: v-bind(minimoDelPdf);
}
.visor-header {
  height: 3rem;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
