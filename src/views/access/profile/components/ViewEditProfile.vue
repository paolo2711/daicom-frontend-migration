<template>
  <div class="d-flex flex-column ga-4">

    <section class="hoja d-flex align-center ga-4 pa-4">
      <div class="iniciales">{{ iniciales }}</div>
      <div class="d-flex flex-column flex-grow-1">
        <span class="text-h6 font-weight-bold">{{ nombreCompleto || 'Sin nombre' }}</span>
        <span class="text-body-2 text-medium-emphasis">@{{ datos.username }} · {{ rol }}</span>
      </div>
      <themed-illustration nombre="perfil" class="dibujo-de-perfil" />
    </section>

    <div class="secciones">
      <v-form ref="formulario" @submit.prevent>
        <settings-section titulo="Tus datos" icono="mdi-account-outline" :cambiado="hayCambios" :guardando="guardando"
                          @deshacer="deshacerTodo" @guardar="guardar">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="datos.first_name" label="Nombre (*)" counter="120" :rules="reglas.nombre"
                            v-bind="CAMPO" @keypress="letraOEspacio" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="datos.last_name" label="Apellidos (*)" counter="120" :rules="reglas.apellido"
                            v-bind="CAMPO" @keypress="letraOEspacio" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="datos.username" label="Usuario (*)" counter="120" :rules="reglas.usuario"
                            prepend-inner-icon="mdi-account" v-bind="CAMPO" @keydown.space.prevent
                            @keypress="letraODigito" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="datos.email" label="Correo" :rules="reglas.correo" prepend-inner-icon="mdi-email"
                            v-bind="CAMPO" />
            </v-col>
          </v-row>
          <file-preview-field v-model="firma" class="firma" etiqueta="Firma digital" :actual="datos.signature_image"
                              icono="mdi-draw-pen" />
        </settings-section>
      </v-form>

      <settings-section titulo="Seguridad" icono="mdi-lock-outline" :se-guarda="false">
        <div class="text-body-2 text-medium-emphasis">
          Para cambiar tu contraseña te pedimos la actual.
        </div>
        <div>
          <v-btn variant="tonal" prepend-icon="mdi-lock-reset" @click="abrirContrasena">Cambiar contraseña</v-btn>
        </div>
      </settings-section>
    </div>

    <v-dialog v-model="enContrasena" class="dialog-premium" width="90%" max-width="30rem" persistent>
      <v-card>
        <base-modal-header title="Cambiar contraseña" icon="mdi-lock-reset" @close="enContrasena = false" />
        <v-card-text class="pt-4">
          <v-form ref="formularioContrasena" class="d-flex flex-column ga-3" @submit.prevent>
            <v-text-field v-for="campo in CAMPOS_DE_CONTRASENA" :key="campo.clave" v-model="pw[campo.clave]"
                          :label="campo.etiqueta" :type="visible[campo.clave] ? 'text' : 'password'"
                          :append-inner-icon="visible[campo.clave] ? 'mdi-eye' : 'mdi-eye-off'"
                          :rules="campo.reglas" v-bind="CAMPO" @keydown.space.prevent
                          @keypress="campo.clave === 'nueva' && caracterDeContrasena($event)"
                          @click:append-inner="visible[campo.clave] = !visible[campo.clave]" />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-4 flex-wrap ga-2">
          <v-spacer />
          <v-btn variant="flat" class="font-weight-bold px-4" @click="enContrasena = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-lock-check"
                 :loading="guardandoContrasena" @click="cambiarContrasena">Cambiar contraseña</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/composables/usePermissions'
import { useLeaveGuard, useUnsavedChanges } from '@/composables/useUnsavedChanges'
import UsersRules from '@/validators/rules/usersRules'
import ProfileDataService from '@/services/profile/profileDataService'
import ProfileMappers from '@/mappers/profileMappers'
import Characters from '@/validators/commonValidators/characters'
import { mensajeDeError } from '@/utils/errors'
import SettingsSection from '@/components/shared/SettingsSection.vue'
import FilePreviewField from '@/components/shared/FilePreviewField.vue'
import ThemedIllustration from '@/components/shared/ThemedIllustration.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const { roleName: rol } = usePermissions()
const CAMPO = { density: 'compact', variant: 'outlined', hideDetails: 'auto' }

const { datos, cambiado, fijar, deshacer } = useUnsavedChanges({
  username: '', first_name: '', last_name: '', email: '', signature_image: '',
})
const firma = ref(null)
const hayCambios = computed(() => cambiado.value || Boolean(firma.value))
useLeaveGuard(() => hayCambios.value)

const nombreCompleto = computed(() => [datos.first_name, datos.last_name].filter(Boolean).join(' '))
const iniciales = computed(() => (datos.first_name[0] || '') + (datos.last_name[0] || '') || '?')

const formulario = ref(null)
const guardando = ref(false)
const reglas = {
  nombre: UsersRules.first_name_rules(), apellido: UsersRules.last_name_rules(),
  usuario: UsersRules.user_name_rules(), correo: UsersRules.email_rules(),
}
const NOMBRES_DE_CAMPOS = { email: 'Correo', username: 'Usuario', password: 'Contraseña', current_password: 'Contraseña actual' }
const avisarError = (e, porDefecto) =>
  Swal.fire({ ...appStore.errorSavedOptions, text: mensajeDeError(e, porDefecto, NOMBRES_DE_CAMPOS) })

async function cargar () {
  try {
    const p = ProfileMappers.putMap((await ProfileDataService.get()).data)
    fijar({ username: p.username ?? '', first_name: p.first_name ?? '', last_name: p.last_name ?? '',
            email: p.email ?? '', signature_image: p.signature_image ?? '' })
  } catch {
    Swal.fire('Error', 'No se pudo cargar tu perfil.', 'error')
  }
}

function deshacerTodo () {
  deshacer()
  firma.value = null
  formulario.value?.resetValidation()
}

async function guardar () {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  guardando.value = true
  try {
    const datosAMandar = new FormData()
    for (const campo of ['username', 'first_name', 'last_name']) datosAMandar.append(campo, datos[campo])
    datosAMandar.append('email', datos.email ?? '')
    if (firma.value) datosAMandar.append('signature_image', firma.value)
    await ProfileDataService.update(datosAMandar)
    authStore.cambiarUsuario(datos.username)
    firma.value = null
    await cargar()
    Toast.fire({ icon: 'success', title: 'Tus datos se guardaron' })
  } catch (e) {
    avisarError(e, 'No se pudieron guardar tus datos.')
  } finally {
    guardando.value = false
  }
}

// La contraseña, en su dialogo: el back valida la actual contra la base.
const enContrasena = ref(false)
const guardandoContrasena = ref(false)
const formularioContrasena = ref(null)
const pw = reactive({ actual: '', nueva: '', repetida: '' })
const visible = reactive({ actual: false, nueva: false, repetida: false })
const CAMPOS_DE_CONTRASENA = [
  { clave: 'actual', etiqueta: 'Contraseña actual (*)', reglas: UsersRules.current_password_rules() },
  { clave: 'nueva', etiqueta: 'Contraseña nueva (*)', reglas: UsersRules.password_rules() },
  { clave: 'repetida', etiqueta: 'Repite la nueva (*)', reglas: [(v) => v === pw.nueva || 'Las contraseñas no coinciden.'] },
]

async function abrirContrasena () {
  Object.assign(pw, { actual: '', nueva: '', repetida: '' })
  enContrasena.value = true
  await nextTick()
  formularioContrasena.value?.resetValidation()
}

async function cambiarContrasena () {
  const { valid } = await formularioContrasena.value.validate()
  if (!valid) return
  guardandoContrasena.value = true
  try {
    const datosAMandar = new FormData()
    datosAMandar.append('current_password', pw.actual)
    datosAMandar.append('password', pw.nueva)
    await ProfileDataService.update(datosAMandar)
    enContrasena.value = false
    Toast.fire({ icon: 'success', title: 'Contraseña cambiada' })
  } catch (e) {
    avisarError(e, 'No se pudo cambiar la contraseña.')
  } finally {
    guardandoContrasena.value = false
  }
}

const letraODigito = (e) => Characters.checkCharacterAndDigits(e, false)
const letraOEspacio = (e) => Characters.checkCharacter(e, true)
const caracterDeContrasena = (e) => Characters.checkCharacterDigitsAndSymbols(e, false)

onMounted(cargar)
</script>

<style scoped>
.iniciales {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  flex: 0 0 auto;
  border-radius: 50%;
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgb(var(--v-theme-panel));
}
.secciones {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
@media (max-width: 60rem) {
  .secciones { grid-template-columns: minmax(0, 1fr); }
}
.firma { max-width: 22rem; }
.dibujo-de-perfil { width: 8rem; height: 8rem; flex: 0 0 auto; }
@media (max-width: 40rem) {
  .dibujo-de-perfil { display: none; }
}
</style>
