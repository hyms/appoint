<template>
  <div class="skeleton-loader">
    <v-skeleton-loader
      v-for="i in count"
      :key="i"
      :type="type"
      :loading="true"
      class="mb-3"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'card' | 'list-item' | 'list-item-avatar' | 'article' | 'paragraph' | 'heading'
  count?: number
}

withDefaults(defineProps<Props>(), {
  type: 'list-item',
  count: 3,
})
</script>

<style scoped>
.skeleton-loader :deep(.v-skeleton-loader__bone) {
  border-radius: 8px;
}
</style>
