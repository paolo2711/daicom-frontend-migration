<template>
  <v-text-field v-model="nueva" label="Contraseña nueva (*)" :rules="REGLAS_DE_LA_NUEVA" v-bind="CAMPO_DE_FORMULARIO"
                :type="visibles.nueva ? 'text' : 'password'" :append-inner-icon="visibles.nueva ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password" @click:append-inner="visibles.nueva = !visibles.nueva"
                @keydown.space.prevent @keypress="caracterDeContrasena" />
  <v-text-field v-model="repetida" label="Repite la nueva (*)" :rules="reglasDeLaRepetida" v-bind="CAMPO_DE_FORMULARIO"
                :type="visibles.repetida ? 'text' : 'password'"
                :append-inner-icon="visibles.repetida ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password" @click:append-inner="visibles.repetida = !visibles.repetida"
                @keydown.space.prevent />
</template>

<script setup>
// Una contraseña nueva: se escribe dos veces y cada campo se puede ver. Va dentro del v-form que la valida, con
// un :key por apertura para empezar vacia. `new-password` evita que el navegador llene la sesion guardada.
import { reactive, ref } from 'vue'
import Characters from '@/validators/commonValidators/characters'
import UsersRules from '@/validators/rules/usersRules'
import { CAMPO_DE_FORMULARIO } from '@/utils/fields'

const nueva = defineModel({ type: String, default: '' })
const repetida = ref('')
const visibles = reactive({ nueva: false, repetida: false })

const REGLAS_DE_LA_NUEVA = UsersRules.password_rules()
const reglasDeLaRepetida = [(v) => v === nueva.value || 'Las contraseñas no coinciden.']
const caracterDeContrasena = (e) => Characters.checkCharacterDigitsAndSymbols(e, false)
</script>
