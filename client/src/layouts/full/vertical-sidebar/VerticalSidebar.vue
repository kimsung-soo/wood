<script setup lang="ts">
import { computed } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import sidebarItems from './sidebarItem';
import { useAuthStore } from '@/stores/auth';

import NavGroup from './NavGroup/NavGroup.vue';
import NavItem from './NavItem/NavItem.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
// import ExtraBox from './extrabox/ExtraBox.vue';
import Logo from '../logo/LogoMain.vue';

const customizer = useCustomizerStore();
const authStore = useAuthStore(); // ✅ 현재 로그인 사용자 정보 가져오기

// 현재 로그인한 유저 권한 (예: '관리자', '부서담당자', '일반사원' 등)
const userAuth = computed(() => authStore.user?.auth ?? '일반사원'); // 기본값 방어

// ✅ 재귀 필터: 권한 체크 + 자식도 필터 + 빈 섹션 숨김(링크/자식 둘 다 없으면 제거)
// 원본 sidebarItems를 건드리지 않도록 복사본에 처리
function filterAndPrune(items, role) {
  const result = [];
  for (const it of items) {
    const allowed = !it.auth || it.auth.includes(role);
    if (!allowed) continue;

    const copy = { ...it };
    if (copy.children) {
      copy.children = filterAndPrune(copy.children, role);
    }

    const hasChildren = Array.isArray(copy.children) && copy.children.length > 0;
    if (!copy.to && !hasChildren) continue; // 폴더인데 비면 숨김

    result.push(copy);
  }
  return result;
}

// ✅ 최종 사이드바 메뉴(여기만 쓰세요)
const sidebarMenu = computed(() => filterAndPrune(sidebarItems, userAuth.value));
</script>

<template>
  <v-navigation-drawer
    width="300"
    left
    v-model="customizer.Sidebar_drawer"
    elevation="0"
    rail-width="75"
    mobile-breakpoint="lg"
    app
    class="leftSidebar"
    :rail="customizer.mini_sidebar"
    expand-on-hover
  >
    <div class="pa-5">
      <Logo />
    </div>
    <perfect-scrollbar class="scrollnavbar">
      <v-list class="pa-4">
        <!---Menu Loop -->
        <template v-for="(item, i) in sidebarMenu" :key="i">
          <!---Item Sub Header -->
          <NavGroup :item="item" v-if="item.header" :key="item.title" />
          <!---Item Divider -->
          <v-divider class="my-3" v-else-if="item.divider" />
          <!---If Has Child -->
          <NavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
          <!---Single Item-->
          <NavItem :item="item" v-else class="leftPadding" />
          <!---End Single Item-->
        </template>
      </v-list>
    </perfect-scrollbar>
  </v-navigation-drawer>
</template>
