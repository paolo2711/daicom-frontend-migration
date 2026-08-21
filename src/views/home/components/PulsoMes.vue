<template>
  <!-- El encabezado y la tarjeta los pone HomeSection. Aca solo va el contenido, y
       se avisa por 'disponible' para que la seccion entera se esconda cuando el
       usuario no tiene acceso a Ordenes (si no, queda un titulo huerfano). -->
  <div v-if="datos && datos.disponible">
    <div class="pulso">
      <!-- Cobrado del mes. Cada moneda va por separado (no convertimos USD a
           soles): el arco es de la moneda principal y la otra va debajo. -->
      <div class="pcell">
        <div v-if="principal" class="d-flex align-center" style="gap: .9rem;">
          <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
            <circle cx="29" cy="29" r="24" fill="none" stroke="rgba(128,128,128,.18)" stroke-width="6" />
            <circle cx="29" cy="29" r="24" fill="none" stroke="var(--notif-teal-fg)" stroke-width="6"
                    stroke-linecap="round" :stroke-dasharray="ARCO"
                    :stroke-dashoffset="ARCO - (ARCO * principal.porcentaje / 100)"
                    transform="rotate(-90 29 29)" />
          </svg>
          <div>
            <div class="p-num">{{ principal.porcentaje }}%</div>
            <div class="p-sub">cobrado del mes</div>
            <div class="p-foot">
              {{ principal.simbolo }} {{ money(principal.cobrado) }} de
              {{ principal.simbolo }} {{ money(principal.facturado) }}
            </div>
          </div>
        </div>
        <div v-else class="p-sub">Sin facturas emitidas este mes</div>

        <!-- Segunda moneda, solo si hubo movimiento -->
        <div v-for="m in otrasMonedas" :key="m.moneda" class="otra-moneda">
          <span class="om-cod">{{ m.moneda }}</span>
          <span class="om-pct">{{ m.porcentaje }}%</span>
          <span class="om-det">{{ m.simbolo }} {{ money(m.cobrado) }} de {{ m.simbolo }} {{ money(m.facturado) }}</span>
        </div>

        <!-- Cobros sin comprobante (INT-). Fuera del arco a proposito: nacen
             cobradas al 100% y empujarian el porcentaje sin significar nada. -->
        <div v-for="s in sinComprobante" :key="'int-' + s.moneda" class="otra-moneda">
          <span class="om-cod">Sin comprobante</span>
          <span class="om-pct">{{ s.simbolo }} {{ money(s.cobrado) }}</span>
          <span class="om-det">{{ s.cantidad }} {{ s.cantidad === 1 ? 'cobro' : 'cobros' }}</span>
        </div>
      </div>

      <!-- Tendencia: cuantas facturas por mes -->
      <div class="pcell">
        <div class="d-flex align-baseline justify-space-between" style="gap: .5rem;">
          <span class="p-num">{{ datos.facturas_del_mes }}</span>
          <span class="p-sub">facturas este mes</span>
        </div>
        <tendencia-facturas :meses="datos.tendencia || []" />
        <div v-if="mesEnCurso" class="p-foot">
          {{ mesEnCurso.etiqueta }} va por el dia {{ mesEnCurso.dias }} de {{ mesEnCurso.dias_mes }}
        </div>
      </div>

      <!-- Sin cobrar separado: lo del mes no queda tapado por la deuda vieja -->
      <div class="pcell">
        <div class="d-flex align-baseline justify-space-between" style="gap: .5rem;">
          <span class="p-num" style="color: var(--notif-crit-fg)">{{ datos.sin_cobrar_total }}</span>
          <span class="p-sub">facturas sin cobrar</span>
        </div>
        <div class="d-flex mt-2" style="gap: .35rem;">
          <span class="tag tag-now">{{ datos.sin_cobrar_mes }} de este mes</span>
          <span class="tag tag-old">{{ datos.sin_cobrar_anteriores }} anteriores</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HomeDataService from '@/services/home/homeDataService'
import TendenciaFacturas from '@/views/home/components/TendenciaFacturas.vue'

const emit = defineEmits(['disponible'])

const ARCO = 150.8   // perimetro del circulo r=24, para el stroke-dasharray
const datos = ref(null)

// El backend manda las monedas ordenadas por facturacion; la primera lleva el arco.
const principal = computed(() => datos.value?.monedas?.[0] || null)
const otrasMonedas = computed(() => (datos.value?.monedas || []).slice(1))

const money = (n) => Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const mesEnCurso = computed(() =>
  (datos.value?.tendencia || []).find(m => m.en_curso) || null)

const sinComprobante = computed(() => datos.value?.sin_comprobante || [])

onMounted(() => {
  HomeDataService.pulso()
    .then((r) => { datos.value = r.data })
    .catch(() => { datos.value = null })
    .finally(() => emit('disponible', !!datos.value?.disponible))
})
</script>

<style scoped>
.pulso { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
.pcell { padding: 1.1rem 1.2rem; border-right: 1px solid rgba(128, 128, 128, .14); }
.pcell:last-child { border-right: none; }
.p-num { font-size: 1.45rem; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
.p-sub { font-size: .74rem; color: rgba(128, 128, 128, .95); }
.p-foot { font-size: .69rem; color: rgba(128, 128, 128, .85); margin-top: .15rem; }
.tag { border-radius: 2rem; padding: .12rem .55rem; font-size: .7rem; font-weight: 650; }
.tag-now { background: var(--notif-crit-bg); color: var(--notif-crit-fg); }
.tag-old { background: rgba(128, 128, 128, .16); color: rgba(128, 128, 128, .95); }
/* Segunda moneda: una linea sobria, sin competir con el arco */
.otra-moneda {
  display: flex; align-items: baseline; gap: .4rem;
  margin-top: .7rem; padding-top: .55rem;
  border-top: 1px solid rgba(128, 128, 128, .14);
  font-size: .72rem;
}
.om-cod { font-weight: 700; letter-spacing: .05em; }
.om-pct { font-weight: 650; font-variant-numeric: tabular-nums; }
.om-det { color: rgba(128, 128, 128, .9); }
</style>
