<script setup lang="ts">
import { RouterView } from 'vue-router';
import VerticalSidebarVue from './vertical-sidebar/VerticalSidebar.vue';
import VerticalHeaderVue from './vertical-header/VerticalHeader.vue';
// import Customizer from './customizer/CustomizerPanel.vue';
// import FooterPanel from './footer/FooterPanel.vue';
import { useCustomizerStore } from '../../stores/customizer';
const customizer = useCustomizerStore();
</script>

<template>
  <v-locale-provider>
    <v-app
      theme="PurpleTheme"
      :class="[customizer.fontTheme, customizer.mini_sidebar ? 'mini-sidebar' : '', customizer.inputBg ? 'inputWithbg' : '']"
    >
      <!-- <Customizer /> -->
      <VerticalSidebarVue />
      <VerticalHeaderVue />

      <v-main>
        <v-container fluid class="page-wrapper">
          <div>
            <RouterView />
            <!-- <v-btn
              class="customizer-btn"
              size="large"
              icon
              variant="flat"
              color="secondary"
              @click.stop="customizer.SET_CUSTOMIZER_DRAWER(!customizer.Customizer_drawer)"
            >
              <SettingsIcon class="icon" />
            </v-btn> -->
          </div>
        </v-container>
        <v-container fluid class="pt-0">
          <div>
            <!-- <FooterPanel /> -->
          </div>
        </v-container>
      </v-main>
    </v-app>
  </v-locale-provider>
</template>

<style scoped>
.reset-box {
  all: initial; /* 거의 모든 스타일 초기화 */
  all: unset; /* 일부 브라우저에선 더 나을 수도 있음 */
  font-family: inherit;
  color: inherit;
}

.safety-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  padding: 24px 32px;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.safety-text {
  font-size: 1.4rem;
  font-weight: bold;
  line-height: 1.8;
  color: #000;
}

.gongjaki {
  height: 140px;
  width: auto;
}
</style>
