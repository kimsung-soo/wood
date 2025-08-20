<template>
  <v-dialog v-model="isOpen" max-width="800">
    <v-card>
      <v-card-title class="text-h6 d-flex justify-space-between align-center">
        {{ title }}
        <v-btn icon @click="isOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-text-field v-model="searchKeyword" label="검색" dense clearable class="mb-4" />

        <!-- 사용자 정의 slot: 표 들어갈 자리 -->
        <slot :search="searchKeyword" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="error" @click="isOpen = false">닫기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
}>();

const isOpen = ref(false);
const searchKeyword = ref('');

defineExpose({
  open: () => (isOpen.value = true),
  close: () => (isOpen.value = false)
});
</script>
