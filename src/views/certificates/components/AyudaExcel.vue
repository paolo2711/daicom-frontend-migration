<template>
  <div>
    <p class="text-body-2 mb-4">
      Se busca en <code class="ruta">H:\Certificados Nativos\</code>, en la subcarpeta de su tipo (Acreditados,
      No Acreditados u Operatividad), por el número del certificado. Si no aparece, o quieres usar otro archivo,
      adjúntalo desde su fila.
    </p>

    <v-tabs v-model="tipo" density="compact" class="mb-4">
      <v-tab value="acr">Acreditado</v-tab>
      <v-tab value="nacr">No acreditado y operatividad</v-tab>
    </v-tabs>

    <v-window v-model="tipo">
      <v-window-item value="acr">
        <div class="pasos">
          <div class="paso border rounded-lg pa-3">
            <div class="titulo-paso"><span class="numero">1</span>Llena la hoja de datos</div>
            <div class="pestanas">
              <span>Calibración</span><span class="clave">DATOS CERTIFICADO</span><span>RESULTADOS…</span>
            </div>
            <div class="celdas">
              <span>Solicitante</span><span class="llenar">Minera…</span>
              <span>Marca</span><span class="llenar">FLUKE</span>
              <span>Revisión</span><span class="ok">OK</span>
            </div>
            <p>Solo las celdas amarillas. Con la columna Revisión en OK, la plataforma arma las páginas 1 y 2.</p>
          </div>
          <div class="paso border rounded-lg pa-3">
            <div class="titulo-paso"><span class="numero">2</span>Arma solo los resultados</div>
            <div class="pestanas"><span>DATOS…</span><span class="clave">RESULTADOS CERTIFICADO</span></div>
            <hoja-miniatura :partes="RESULTADOS" />
            <p>Tablas y gráficos, a lo ancho de una A4. Una fila vacía entre uno y otro: la plataforma corta las
              hojas sin partirlos.</p>
          </div>
          <div class="paso border rounded-lg pa-3">
            <div class="titulo-paso"><span class="numero">3</span>Lo demás lo pone la plataforma</div>
            <hoja-miniatura :partes="CARATULA" franja />
            <p>Páginas 1 y 2, el N°, las observaciones, el sello, la firma, el QR, “Página X de Y” y
              “Fin del certificado”.</p>
          </div>
        </div>

        <div class="ejemplos mt-3">
          <div class="border rounded-lg pa-3">
            <div class="titulo-ejemplo">
              <v-icon size="small" color="success">mdi-check-circle</v-icon>Así sí: el título pegado a su tabla
            </div>
            <div class="dibujos"><hoja-miniatura :partes="PEGADO" chica /></div>
            <p>Sin fila vacía entre los dos: van juntos a la misma hoja.</p>
          </div>
          <div class="border rounded-lg pa-3">
            <div class="titulo-ejemplo">
              <v-icon size="small" color="error">mdi-close-circle</v-icon>Así no: una fila vacía debajo del título
            </div>
            <div class="dibujos">
              <hoja-miniatura :partes="SUELTO" chica />
              <hoja-miniatura :partes="['tabla']" chica />
            </div>
            <p>Son dos bloques: el título puede quedar solo al pie de una hoja.</p>
          </div>
        </div>

        <div class="border rounded-lg pa-3 mt-3">
          <div class="titulo-ejemplo">
            <v-icon size="small" color="error">mdi-close-circle</v-icon>No pongas en el Excel
          </div>
          <p>El N° del certificado, “FIN DEL DOCUMENTO” ni notas legales; encabezados o pies de página de Excel;
            rellenos de color (tapan el membrete); títulos con número (“9. Observaciones”: la plataforma numera).</p>
        </div>
      </v-window-item>

      <v-window-item value="nacr">
        <div class="pasos dos">
          <div class="paso border rounded-lg pa-3">
            <div class="titulo-paso"><span class="numero">1</span>La hoja que se imprime</div>
            <div class="pestanas"><span>REGISTRO</span><span class="clave">IMPRESION</span><span>CÁLCULOS</span></div>
            <p>Se llama <b>IMPRESION</b> o <b>IMPRIMIR</b> y sale tal cual: con su área de impresión, sus saltos de
              página y su zoom. Revísala en la vista previa de salto de página.</p>
          </div>
          <div class="paso border rounded-lg pa-3">
            <div class="titulo-paso"><span class="numero">2</span>Deja libre el pie de la página 1</div>
            <hoja-miniatura :partes="['titulo', 'tabla', 'tabla baja']" franja />
            <p>Ahí van el sello, la firma y el QR, siempre en el mismo lugar: de 4,6 a 7,4 cm del borde de abajo.</p>
          </div>
        </div>

        <div class="ejemplos mt-3">
          <div class="border rounded-lg pa-3">
            <div class="titulo-ejemplo"><v-icon size="small" color="success">mdi-check-circle</v-icon>Así sí</div>
            <div class="dibujos"><hoja-miniatura :partes="['titulo', 'tabla']" franja chica /></div>
            <p>Lo del Excel termina antes de la franja.</p>
          </div>
          <div class="border rounded-lg pa-3">
            <div class="titulo-ejemplo"><v-icon size="small" color="error">mdi-close-circle</v-icon>Así no</div>
            <div class="dibujos"><hoja-miniatura :partes="HASTA_ABAJO" franja chica /></div>
            <p>Si el contenido llega hasta abajo, el sello, la firma y el QR quedan encima.</p>
          </div>
        </div>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HojaMiniatura from './HojaMiniatura.vue'

const RESULTADOS = ['titulo', 'tabla', 'titulo', 'tabla', 'titulo corto', 'tabla baja']
const CARATULA = ['titulo largo marcado', 'linea', 'linea', 'linea corta', 'espacio', 'titulo corto', 'linea',
  'linea corta']
const PEGADO = ['tabla', 'espacio', 'titulo', 'tabla']
const SUELTO = ['tabla', 'tabla', 'espacio', 'titulo']
const HASTA_ABAJO = ['titulo', 'tabla', 'tabla', 'tabla baja']

const tipo = ref('acr')
</script>

<style scoped>
.ruta {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 0.25rem;
  padding: 0.05rem 0.3rem;
  font-weight: 600;
  white-space: nowrap;
}

.pasos, .ejemplos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.pasos.dos, .ejemplos {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.paso {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

p {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.titulo-paso, .titulo-ejemplo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.titulo-ejemplo {
  margin-bottom: 0.5rem;
}

.numero {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

/* Las pestañas de un libro de Excel, con la que se usa resaltada. */
.pestanas {
  display: flex;
  gap: 0.15rem;
  font-size: 0.65rem;
  overflow: hidden;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pestanas span {
  padding: 0.15rem 0.4rem;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 0;
  border-radius: 0.25rem 0.25rem 0 0;
  white-space: nowrap;
  opacity: 0.6;
}

.pestanas .clave {
  opacity: 1;
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.celdas {
  display: grid;
  grid-template-columns: 35% 65%;
  gap: 0.1rem;
  font-size: 0.65rem;
}

.celdas span {
  padding: 0.1rem 0.3rem;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.celdas .llenar {
  background: rgba(255, 213, 79, 0.25);
}

.celdas .ok {
  font-weight: 600;
}

.dibujos {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 0.5rem;
}

@media (max-width: 44rem) {
  .pasos, .pasos.dos, .ejemplos {
    grid-template-columns: 1fr;
  }
}
</style>
