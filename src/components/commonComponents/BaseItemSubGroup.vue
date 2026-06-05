<template>
  <BaseItemGroup
    :item="item"
    :text="true"
    :sub-group="true"
    class="xyz"
  />
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    default: () => ({
      avatar: undefined,
      group: undefined, 
      title: undefined,
      children: [],
    }),
  },
})
</script>