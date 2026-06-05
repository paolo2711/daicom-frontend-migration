<template>
  <v-row class="page-breadcrumb">
    <v-col cols="12" sm="12" class="pa-0">
      <v-card class="px-2 elevation-2">
        <v-toolbar density="compact" color="transparent" flat height="40">
          <v-toolbar-title class="pt-3">
            <span class="text-primary">{{ title }}</span>
          </v-toolbar-title>
          
          <template v-slot:extension>
            <div class="pb-3 w-100 d-flex align-center">
              <v-breadcrumbs :items="breadcrumbs" class="pa-0">
                <template v-slot:divider v-if="breadcrumbs">
                  <v-icon>mdi-chevron-right</v-icon>
                </template>
              </v-breadcrumbs>
              <slot></slot>
            </div>
          </template>
          
          <v-spacer></v-spacer>
        </v-toolbar>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  title: String,
  breadcrumbs: Array,
  icon: String
})
</script>

<style lang="scss">
.page-breadcrumb{
  margin: -20px -25px 27px -25px;
}
</style>