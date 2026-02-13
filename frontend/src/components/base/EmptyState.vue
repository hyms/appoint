<template>
  <div class="empty-state pa-6 text-center">
    <v-icon
      :icon="icon"
      :size="iconSize"
      :color="iconColor"
      class="mb-4"
    />
    <h3 class="text-h6 mb-2">{{ title }}</h3>
    <p v-if="description" class="text-body-2 text-medium-emphasis mb-4">
      {{ description }}
    </p>
    <BaseButton
      v-if="actionLabel"
      :to="actionTo"
      @click="$emit('action')"
      color="primary"
      size="default"
    >
      {{ actionLabel }}
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import BaseButton from './BaseButton.vue'

interface Props {
  icon?: string
  iconSize?: string | number
  iconColor?: string
  title?: string
  description?: string
  actionLabel?: string
  actionTo?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi-inbox-outline',
  iconSize: 64,
  iconColor: 'grey-lighten-1',
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

@media (max-width: 600px) {
  .empty-state {
    min-height: 200px;
  }
}
</style>
