<template>
  <v-list-group :value="group" v-if="item">
    <template v-slot:activator="{ props }">
      <v-list-item
        v-bind="props"
        :prepend-icon="item.sicon || item.icon"
        :title="item.title"
        active-class="bg-primary text-white"
        rounded="lg"
      ></v-list-item>
    </template>

    <template v-for="(child, i) in children" :key="i">
      <BaseItemSubGroup
        v-if="child.children"
        :item="child"
        class="second-dd"
      />
      <BaseItem
        v-else
        :item="child"
        :text="true"
      />
    </template>
  </v-list-group>
</template>

<script setup>
import { computed } from 'vue'
import kebabCase from 'lodash/kebabCase'
import BaseItem from '@/components/commonComponents/BaseItem.vue'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({
      avatar: undefined,
      group: undefined,
      title: undefined,
      children: [],
    }),
  },
  subGroup: { type: Boolean, default: false },
  text: { type: Boolean, default: false },
})

const children = computed(() => {
  return props.item.children.map(item => ({
    ...item,
    to: !item.to ? undefined : `${props.item.group}/${item.to}`,
  }))
})

const genGroup = (childrenList) => {
  return childrenList
    .filter(item => item.to)
    .map(item => {
      const parent = item.group || props.item.group
      let grp = `${parent}/${kebabCase(item.to)}`
      if (item.children) grp = `${grp}|${genGroup(item.children)}`
      return grp
    }).join('|')
}

const group = computed(() => genGroup(props.item.children))
</script>