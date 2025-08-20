<script setup lang="ts">
import { useCustomizerStore } from '../../../stores/customizer';
import { Menu2Icon } from 'vue-tabler-icons';

const customizer = useCustomizerStore();
</script>

<template>
  <v-app-bar elevation="0" height="80">
    <h1>공작이</h1>

    <v-btn
      class="hidden-lg-and-up text-secondary ms-3"
      color="lightsecondary"
      icon
      rounded="sm"
      variant="flat"
      @click.stop="customizer.SET_SIDEBAR_DRAWER"
      size="small"
    >
      <Menu2Icon size="20" stroke-width="1.5" />
    </v-btn>

    <v-spacer />

    <div>
      <span>누구누구님, 환영합니다! (로그인 했을 때에만 보이게 하기)</span>
    </div>
    <div>
      <v-btn :to="'/login'">
        <i class="fa-solid fa-right-from-bracket fa-2xl"></i>
      </v-btn>
    </div>
  </v-app-bar>
</template>

<style scoped>
div {
  margin-right: 25px;
}

h1,
span {
  user-select: none;
}
</style>
