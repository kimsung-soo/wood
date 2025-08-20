<template>
  <v-dialog v-model="isOpen" width="500">
    <v-card>
      <v-card-title class="text-h6">{{ title }}</v-card-title>
      <v-card-text>{{ content }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" @click="isOpen = false">닫기</v-btn>
        <v-btn color="primary">확인</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, defineExpose } from 'vue';

interface Props {
  title: string;
  content: string;
}

const { title, content } = defineProps<Props>();

const isOpen = ref(false);

defineExpose({
  open: () => {
    isOpen.value = true;
    setTimeout(() => {
      document.querySelector('html')?.classList.remove('v-overlay-scroll-blocked');
    }, 50);
  },
  close: () => (isOpen.value = false)
});
</script>
