import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    rules: {
      // Una fila edita los campos de su item; reemplazar el prop entero si es error.
      'vue/no-mutating-props': ['error', { shallowOnly: true }],
      // Los slots de las tablas de Vuetify llevan el campo en el nombre: `item.estado`.
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
    },
  },

  {
    // Las paginas se nombran por su seccion: Clients, Certificates.
    files: ['src/views/**/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
])
