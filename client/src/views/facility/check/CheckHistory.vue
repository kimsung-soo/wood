<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="점검 내역">
    <v-row align="center" class="mb-3">
      <v-col cols="12" md="6" class="d-flex justify-start">
        <v-text-field
          v-model.trim="productKeyword"
          placeholder="설비선택 (설비코드/설비명 입력)"
          hide-details
          density="compact"
          variant="outlined"
          style="max-width: 280px"
        />
      </v-col>
    </v-row>

    <ag-grid-vue
      class="ag-theme-quartz grid-clean"
      style="height: 420px"
      :theme="quartz"
      :rowData="filteredItems"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :animateRows="true"
      :pagination="true"
      :pagination-page-size="10"
      :suppressClickEdit="true"
    />
  </UiParentCard>
</template>

<script setup>
// 기본 UI
import { ref, shallowRef, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

// AG Grid
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

// API
import axios from 'axios';
const apiBase = 'http://localhost:3000';

const columnDefs = ref([
  { field: '설비코드', flex: 1 },
  { field: '설비명', flex: 1 },
  { field: '설비유형', flex: 1 },
  { field: '점검내역', flex: 1 },
  { field: '점검시작일', flex: 1.5 },
  { field: '점검완료일', flex: 1.5 },
  { field: '다음점검일', flex: 1 },
  {
    field: '적합여부',
    flex: 1,
    cellStyle: (p) => {
      if (p.value === '적합') return { color: 'blue', fontWeight: 'bold' };
      if (p.value === '부적합') return { color: 'red', fontWeight: 'bold' };
      return null;
    }
  },
  { field: '부적합사유', flex: 1.5 },
  { field: '담당자', flex: 1 }
]);

const defaultColDef = { editable: false, sortable: true, resizable: true, suppressMenu: true };

const productKeyword = ref('');
const rawItems = ref([]);

function fmt(dt, withTime = true) {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) {
    const s = String(dt);
    return withTime ? s.slice(0, 19).replace('T', ' ') : s.slice(0, 10);
  }
  const p = (n) => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  if (!withTime) return day;
  const time = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  return `${day} ${time}`;
}

// 점검 이력 로드
const loadInspections = async () => {
  try {
    const { data } = await axios.get(`${apiBase}/facility/inspections/history`);
    const arr = Array.isArray(data) ? data : [];
    rawItems.value = arr.map((r) => ({
      설비코드: r.FAC_ID ?? '',
      설비명: r.FAC_NAME ?? '',
      설비유형: r.FAC_TYPE_NM ?? r.FAC_TYPE ?? '',
      점검내역: r.INSPECT_CONTENT ?? '',
      점검시작일: fmt(r.INSPECT_START, true),
      점검완료일: fmt(r.INSPECT_DONE, true),
      다음점검일: fmt(r.NEXT_INSPECT, false),
      적합여부: r.FIT ?? '',
      부적합사유: r.NG_REASON ?? '',
      담당자: r.MANAGER ?? ''
    }));
  } catch (e) {
    console.error('점검 이력 조회 실패:', e);
    rawItems.value = [];
  }
};

onMounted(loadInspections);

// 코드/이름에 대해 간단 검색
const filteredItems = computed(() => {
  const kw = (productKeyword.value || '').trim().toLowerCase();
  if (!kw) return rawItems.value;
  return rawItems.value.filter((row) => {
    const code = String(row.설비코드 || '').toLowerCase();
    const name = String(row.설비명 || '').toLowerCase();
    return code.includes(kw) || name.includes(kw);
  });
});

const page = ref({ title: '설비 점검 관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '점검 내역', disabled: false, href: '#' }
]);
</script>
