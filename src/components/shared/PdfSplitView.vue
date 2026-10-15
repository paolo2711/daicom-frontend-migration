<template>
  <!-- Una lista con el PDF de la fila elegida al lado. La lista va en el slot;
       sus filas marcan `fila-con-pdf` (clic) y `fila-en-vista` (la elegida). -->
  <div ref="contenedor" class="d-flex align-start" :class="{ arrastrando }">
    <div ref="lista" :class="enVista ? 'flex-shrink-0' : 'flex-grow-1'" :style="enVista ? { width: `${ancho}%` } : null">
      <slot />
    </div>

    <template v-if="enVista">
      <div class="divisor" title="Arrastre para cambiar el ancho" @pointerdown="empezarArrastre" />

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
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import PdfPreview from '@/components/shared/PdfPreview.vue'
import { debounce } from '@/utils/debounce'
import { OTRA_PESTANA, abrirEnOtraPestana } from '@/utils/pdf'

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
const cerrar = () => emit('update:modelValue', null)

// En pantallas chicas no entra al lado: se abre aparte. Si la fila deja la
// lista (otra pagina, un filtro), la vista se cierra y no vuelve sola.
watch(enVista, (fila) => {
  if (!fila) {
    if (props.modelValue !== null) cerrar()
  } else if (!mdAndUp.value) {
    abrirEnOtraPestana(props.pdfDe(fila))
    cerrar()
  } else {
    nextTick(medirVisor)
  }
})

// ── El ancho: lo elige cada uno arrastrando el divisor, en % del espacio, y
// se recuerda en ese navegador. La lista no se angosta hasta tener que
// desplazarse de costado y el PDF no baja de MINIMO_DEL_PDF. ──
const guardado = `vistaPdf.${props.clave}`
const contenedor = ref(null)
const lista = ref(null)
const arrastrando = ref(false)
const ancho = ref(leerAncho())

function leerAncho () {
  try {
    const valor = Number(localStorage.getItem(guardado))
    return valor > 0 && valor < 100 ? valor : ANCHO_INICIAL
  } catch {
    return ANCHO_INICIAL
  }
}

watch(ancho, debounce((valor) => {
  try { localStorage.setItem(guardado, String(valor)) } catch { /* sin almacenamiento: vale para esta visita */ }
}))

const enRem = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize)

// Lo minimo que necesita la lista sin barra horizontal: se la deja sin ancho un
// instante, se mide lo que pide su tabla y se devuelve, antes de que se pinte.
function minimoDeLaLista () {
  const caja = lista.value
  const envoltura = caja.querySelector('.v-table__wrapper')
  if (!envoltura) return 0
  const bordes = caja.offsetWidth - envoltura.clientWidth
  const antes = caja.style.width
  caja.style.width = '0'
  const tabla = envoltura.scrollWidth
  caja.style.width = antes
  return tabla + bordes
}

function empezarArrastre (e) {
  const divisor = e.currentTarget
  const zona = contenedor.value.getBoundingClientRect()
  const enPorcentaje = (medida) => (medida / zona.width) * 100
  const minimo = Math.ceil(enPorcentaje(minimoDeLaLista()) * 10) / 10
  const maximo = Math.floor(enPorcentaje(zona.width - divisor.offsetWidth - enRem(MINIMO_DEL_PDF)) * 10) / 10
  arrastrando.value = true
  divisor.setPointerCapture(e.pointerId)
  const mover = (ev) => {
    const porcentaje = Math.round(enPorcentaje(ev.clientX - zona.left) * 10) / 10
    ancho.value = Math.min(maximo, Math.max(minimo, porcentaje))
  }
  const soltar = () => {
    arrastrando.value = false
    divisor.removeEventListener('pointermove', mover)
    divisor.removeEventListener('pointerup', soltar)
    divisor.removeEventListener('pointercancel', soltar)
  }
  divisor.addEventListener('pointermove', mover)
  divisor.addEventListener('pointerup', soltar)
  divisor.addEventListener('pointercancel', soltar)
}

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
.divisor {
  align-self: stretch;
  width: 0.75rem;
  flex-shrink: 0;
  cursor: col-resize;
  touch-action: none;
  background: linear-gradient(rgba(var(--v-border-color), var(--v-border-opacity)), rgba(var(--v-border-color), var(--v-border-opacity)))
    center / 0.125rem 3rem no-repeat;
}
.divisor:hover { background-color: rgba(var(--v-theme-primary), 0.08); }
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
