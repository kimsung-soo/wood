<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="수리 내역">
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
import { ref, shallowRef, computed, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

/* ===== 헤더 ===== */
const page = ref({ title: '설비 수리 관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '수리 내역', disabled: false, href: '#' }
]);

/* ===== API base ===== */
const apiBase = 'http://localhost:3000';

/* ===== 컬럼 ===== */
const columnDefs = ref([
  { headerName: '설비코드', field: '설비코드', flex: 1 },
  { headerName: '설비명', field: '설비명', flex: 1 },
  { headerName: '설비유형', field: '설비유형', flex: 1 },
  { headerName: '고장유형', field: '고장유형', flex: 1 },
  { headerName: '비가동시작일', field: '비가동시작일', flex: 1.5 },
  { headerName: '수리완료일', field: '수리완료일', flex: 1.5 },
  { headerName: '수리내역', field: '수리내역', flex: 1.5 },
  { headerName: '담당자', field: '담당자', flex: 1 },
  { headerName: '비고', field: '비고', flex: 2 }
]);
const defaultColDef = { editable: false, sortable: true, resizable: true, suppressMenu: true };

/* ===== 검색 ===== */
const productKeyword = ref('');
const rawItems = ref([]);

/* ===== 날짜 포맷 ===== */
function fmt(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ===== 코드 라벨 맵 (FC/RR) ===== */
let fcMap = new Map(); // 설비유형
let rrMap = new Map(); // 고장유형
const preloadCodeMaps = async () => {
  const [fcRes, rrRes] = await Promise.all([axios.get(`${apiBase}/common/codes/FC`), axios.get(`${apiBase}/common/codes/RR`)]);
  const toMap = (rows) => {
    const m = new Map();
    for (const r of rows || []) m.set(String(r.code ?? r.CODE), r.code_name ?? r.CODE_NAME);
    return m;
  };
  fcMap = toMap(fcRes.data);
  rrMap = toMap(rrRes.data);
};

/* ===== 백엔드 호출 ===== */
const fetchRepairs = async () => {
  const { data } = await axios.get(`${apiBase}/facility/repairs`);
  return Array.isArray(data) ? data : [];
};
const fetchFacilities = async () => {
  const { data } = await axios.get(`${apiBase}/facility`);
  return Array.isArray(data) ? data : [];
};
const fetchStatusList = async () => {
  const { data } = await axios.get(`${apiBase}/facility/status`);
  return Array.isArray(data) ? data : [];
};

/* ===== 조합: repairs + facilities + status =====
   - 설비명/유형: FACILITY
   - 비가동 시작/완료: FACILITY_STATUS (FS_ID 매칭)
   - 고장유형 라벨: RR 맵 (FR_TYPE 우선, 없으면 상태의 FS_TYPE)
================================================= */
const loadRepairs = async () => {
  try {
    await preloadCodeMaps();

    const [repairs, facilities, statuses] = await Promise.all([fetchRepairs(), fetchFacilities(), fetchStatusList()]);

    const facMap = new Map(facilities.map((f) => [f.FAC_ID, f]));
    const statusByFsId = new Map(statuses.map((s) => [s.FS_ID, s]));

    rawItems.value = repairs.map((r) => {
      const f = facMap.get(r.FAC_ID) || {};
      const s = statusByFsId.get(r.FS_ID) || {};

      const facTypeLabel = f.FAC_TYPE ? fcMap.get(String(f.FAC_TYPE)) || f.FAC_TYPE : f.FAC_TYPE_NM || '';
      const rrCode = r.FR_TYPE ?? s.FS_TYPE ?? null;
      const rrLabel = rrCode ? rrMap.get(String(rrCode)) || rrCode : '';

      return {
        설비코드: r.FAC_ID ?? '',
        설비명: f.FAC_NAME ?? '',
        설비유형: facTypeLabel,
        고장유형: rrLabel,
        비가동시작일: fmt(s.DOWN_STARTDAY ?? r.REPAIR_STARTDAY),
        수리완료일: fmt(s.DOWN_ENDDAY ?? r.REPAIR_ENDDAY),
        수리내역: r.FR_CONTENT ?? '',
        담당자: r.MANAGER ?? f.MANAGER ?? '',
        비고: r.FR_NOTE ?? ''
      };
    });
  } catch (e) {
    console.error('loadRepairs error', e);
    rawItems.value = [];
  }
};
onMounted(loadRepairs);

/* ===== 필터 ===== */
const filteredItems = computed(() => {
  const kw = (productKeyword.value || '').trim().toLowerCase();
  if (!kw) return rawItems.value;
  return rawItems.value.filter((row) => {
    const code = String(row.설비코드 || '').toLowerCase();
    const name = String(row.설비명 || '').toLowerCase();
    return code.includes(kw) || name.includes(kw);
  });
});
</script>
