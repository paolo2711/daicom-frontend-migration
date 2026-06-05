<template>
  <div>
    <v-card-title class="pt-4.5 px-6 pb-3.5">
      <div class="d-flex align-center w-100">
        
        <div class="d-flex align-center flex-grow-1 overflow-hidden">
          <v-icon v-if="icon" :color="iconColor" size="32" class="me-3">{{ icon }}</v-icon>
          
          <div>
            <h3 class="text-h6 font-weight-bold mb-0 text-high-emphasis text-truncate" style="line-height: 1.2;">
              {{ title }}
            </h3>
            
            <div v-if="$slots.default" class="text-caption text-medium-emphasis font-weight-medium mt-1 d-flex align-center">
              <slot></slot>
            </div>
          </div>
        </div>

        <v-btn icon variant="text" @click="$emit('close')" color="grey" class="ms-4 flex-shrink-0">
          <v-icon>mdi-close</v-icon>
        </v-btn>

      </div>
    </v-card-title>

    <v-divider class="mb-0"></v-divider>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: "" },
  iconColor: { type: String, default: "primary" }
})

defineEmits(['close'])
</script>