<script setup lang="ts">
// import { ref } from 'vue';
import { LogoutIcon } from 'vue-tabler-icons';
import { useAuthStore } from '@/stores/auth';

// const swt1 = ref(true);
// const swt2 = ref(false);
const authStore = useAuthStore();
</script>

<template>
  <div class="pa-4">
    <h4 class="mb-n1">환영합니다 ! <span class="font-weight-regular"></span></h4>
    <v-divider></v-divider>

    <v-list class="mt-3">
      <v-list-item @click="authStore.logout()" color="secondary" rounded="md">
        <template v-slot:prepend>
          <LogoutIcon size="20" class="mr-2" />
        </template>

        <v-list-item-title class="text-subtitle-2"> Logout</v-list-item-title>
      </v-list-item>
    </v-list>
    <!-- </perfect-scrollbar> -->
  </div>
</template>
