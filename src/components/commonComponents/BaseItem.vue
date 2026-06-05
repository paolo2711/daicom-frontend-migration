<template>
  <v-list-item
    :href="href"
    :target="href && href !== '#' ? '_blank' : undefined"
    :to="item.to"
    :prepend-icon="item.icon"
    :title="item.title"
    color="primary"
    rounded="lg"
  ></v-list-item>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({
      href: undefined,
      icon: undefined,
      title: undefined,
      to: undefined,
    }),
  },
  text: {
    type: Boolean,
    default: false,
  },
})

const href = computed(() => props.item.href || (!props.item.to ? '#' : undefined))
</script>