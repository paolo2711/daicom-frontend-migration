<template>
  <v-dialog v-model="abierto" class="dialog-premium" width="90%" max-width="30rem" persistent>
    <v-card>
      <base-modal-header :title="titulo" icon="mdi-lock-reset" @close="abierto = false" />
      <v-card-text class="pt-4">
        <p v-if="aviso" class="text-body-2 text-medium-emphasis mb-4">{{ aviso }}</p>
        <v-form ref="formulario" class="d-flex flex-column ga-3" @submit.prevent>
          <v-text-field v-if="pedirActual" v-model="actual" label="Contraseña actual (*)" :rules="REGLAS_DE_LA_ACTUAL"
                        v-bind="CAMPO_DE_FORMULARIO" :type="verActual ? 'text' : 'password'"
                        :append-inner-icon="verActual ? 'mdi-eye' : 'mdi-eye-off'" autocomplete="current-password"
                        @click:append-inner="verActual = !verActual" @keydown.space.prevent />
          <new-password-fields :key="aperturas" v-model="nueva" />
        </v-form>
      </v-card-text>
      <v-card-actions class="px-6 pb-4 flex-wrap ga-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="abierto = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-lock-check"
               :loading="guardando" @click="confirmar">{{ titulo }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// Cambiar una contraseña, el mismo dialogo en toda la app. `cambiar({ actual, nueva })` llama al back;
// la actual solo se pide con `pedirActual`.
import { nextTick, ref, watch } from 'vue'
import NewPasswordFields from '@/components/shared/NewPasswordFields.vue'
import { useActionCall } from '@/composables/useActionCall'
import UsersRules from '@/validators/rules/usersRules'
import { CAMPO_DE_FORMULARIO } from '@/utils/fields'

const props = defineProps({
  titulo: { type: String, default: 'Cambiar contraseña' },
  aviso: { type: String, default: '' },
  pedirActual: { type: Boolean, default: false },
  cambiar: { type: Function, required: true },
})
const abierto = defineModel({ type: Boolean, default: false })

const REGLAS_DE_LA_ACTUAL = UsersRules.current_password_rules()
const formulario = ref(null)
const actual = ref('')
const verActual = ref(false)
const nueva = ref('')
const aperturas = ref(0)
const guardando = ref(false)
const { llamarSinPreguntar } = useActionCall()

watch(abierto, async (valor) => {
  if (!valor) return
  actual.value = ''
  verActual.value = false
  nueva.value = ''
  aperturas.value++
  await nextTick()
  formulario.value?.resetValidation()
})

async function confirmar () {
  const { valid } = await formulario.value.validate()
  if (!valid) return
  guardando.value = true
  const hecho = await llamarSinPreguntar(() => props.cambiar({ actual: actual.value, nueva: nueva.value }),
    'Contraseña cambiada', 'No se pudo cambiar la contraseña.')
  guardando.value = false
  if (hecho) abierto.value = false
}
</script>
