<template>
  <v-list-item
    :href="href"
    :target="href && href !== '#' ? '_blank' : undefined"
    :to="item.to"
    :prepend-icon="item.icon"
    :title="item.title"
    title-class="text-body-2 font-weight-regular"
    color="primary"
  ></v-list-item>
</template>

<script setup>
defineProps({
  heading: {
    type: String,
    default: '',
  }
})
</script>