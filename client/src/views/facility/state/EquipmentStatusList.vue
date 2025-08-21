<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="전체 조회">
    <v-row class="mb-2 py-0">
      <v-col cols="12" class="d-flex align-center">
        <v-btn color="warning" variant="flat" @click="openModal('공정 조회')">공정 조회</v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4 pt-0">
      <v-col cols="12" md="3">
        <v-text-field label="공정코드" v-model="processCode" readonly hide-details density="comfortable" variant="outlined" />
      </v-col>
    </v-row>

    <ag-grid-vue
      style="height: 420px"
      :theme="quartz"
      :rowData="rows"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :animateRows="true"
      :suppressClickEdit="true"
      :pagination="true"
      :pagination-page-size="10"
      @grid-ready="onGridReady"
    />
  </UiParentCard>

  <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import axios from 'axios';
import dayjs from 'dayjs';
import MoDal from '@/views/common/NewModal.vue';

ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

const apiBase = 'http://localhost:3000';
const PROCESS_API = `${apiBase}/process`;

// 설비유형 코드 라벨 맵
let facTypeMap = new Map();
const fetchFacTypeCodes = async () => {
  const { data } = await axios.get(`${apiBase}/common/codes/FC`);
  const map = new Map();
  for (const r of data || []) map.set(r.code ?? r.CODE, r.code_name ?? r.CODE_NAME);
  facTypeMap = map;
};

//Grid 공정
const processCode = ref('');
const defaultColDef = { editable: false, sortable: true, resizable: true };
const gridApi = ref(null);
const onGridReady = async (e) => {
  gridApi.value = e.api;
  await init();
};
const applyProcessFilter = (procCode) => {
  if (!gridApi.value) return;
  gridApi.value.setFilterModel({
    공정코드: { filterType: 'text', type: 'equals', filter: procCode || '' }
  });
  gridApi.value.onFilterChanged();
};

const statusText = (s) => ({ 0: '가동', 1: '비가동', 2: '점검중' })[Number(s)] ?? String(s);
const statusStyle = (v) => {
  if (v === '가동') return { color: 'blue', fontWeight: 'bold' };
  if (v === '비가동') return { color: 'red', fontWeight: 'bold' };
  return null;
};
const fmt = (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '');

/* 컬럼 정의 */
const columnDefs = ref([
  { field: '공정코드', hide: true, filter: 'agTextColumnFilter' },
  { field: '설비코드', flex: 1 },
  { field: '설비명', flex: 1 },
  { field: '설비유형', flex: 1 },
  { field: '설비상태', flex: 1, cellStyle: (p) => statusStyle(p.value) },
  { field: '비가동사유', flex: 1 },
  { field: '점검완료일', flex: 1 },
  { field: '다음점검일', flex: 1 },
  { field: '담당자', flex: 1 }
]);

const rows = ref([]);

//DB 호출
const fetchFacilities = async () => {
  const { data } = await axios.get(`${apiBase}/facility`);
  return data || [];
};
const fetchStatusList = async () => {
  try {
    const { data } = await axios.get(`${apiBase}/facility/status`);
    return data || [];
  } catch {
    return [];
  }
};

const statusTime = (r) => new Date(r.FS_CHECKDAY || r.DOWN_ENDDAY || r.DOWN_STARTDAY || 0).getTime();

//설비
const mergeFacilitiesWithStatus = (facilities, statusRows) => {
  const sMap = new Map();
  for (const r of statusRows || []) {
    const prev = sMap.get(r.FAC_ID);
    if (!prev || statusTime(r) >= statusTime(prev)) sMap.set(r.FAC_ID, r);
  }

  return (facilities || []).map((f) => {
    const s = sMap.get(f.FAC_ID);
    const stNum = s ? Number(s.FS_STATUS) : 0;
    const stTxt = statusText(stNum);

    let doneAt = '-';
    if (stNum === 2) doneAt = s?.FS_CHECKDAY ? fmt(s.FS_CHECKDAY) : '-';

    const facTypeName = f.FAC_TYPE_NM ?? (f.FAC_TYPE ? facTypeMap.get(String(f.FAC_TYPE)) || f.FAC_TYPE : '-');

    return {
      공정코드: f.PR_ID || '',
      설비코드: f.FAC_ID,
      설비명: f.FAC_NAME || '',
      설비유형: facTypeName,
      설비상태: stTxt,
      비가동사유: stNum === 1 ? s?.FS_REASON || '-' : '-',
      점검완료일: doneAt,
      다음점검일: s?.FS_NEXTDAY ? fmt(s.FS_NEXTDAY) : '-',
      담당자: f.MANAGER && f.MANAGER !== '-' ? f.MANAGER : s?.MANAGER || '-'
    };
  });
};

const init = async () => {
  await fetchFacTypeCodes();
  const [facilities, statusRows] = await Promise.all([fetchFacilities(), fetchStatusList()]);
  rows.value = mergeFacilitiesWithStatus(facilities, statusRows);
  if (processCode.value) applyProcessFilter(processCode.value);
};

//공정 모달
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([
  { field: '공정코드', flex: 1 },
  { field: '공정명', flex: 1 },
  { field: '설비유형', flex: 1 },
  { field: '등록일자', flex: 1 },
  { field: '작성자', flex: 1 },
  { field: '비고', flex: 1 }
]);

const mapProcess = (r) => ({
  공정코드: r.PR_ID ?? r.PRC_CODE ?? '',
  공정명: r.PRC_NAME ?? '',
  설비유형: r.FAC_TYPE ?? '',
  등록일자: r.PRC_RDATE ? dayjs(r.PRC_RDATE).format('YYYY-MM-DD') : '',
  작성자: r.PRC_WRITER ?? '',
  비고: r.PRC_NOTE ?? ''
});

const fetchProcessList = async () => {
  const { data } = await axios.get(PROCESS_API);
  return (Array.isArray(data) ? data : []).map(mapProcess);
};
const openModal = async (title) => {
  try {
    modalTitle.value = title;
    modalRowData.value = await fetchProcessList();
    modalRef.value?.open();
  } catch (e) {
    console.error('[process list] error:', e);
    alert('공정 목록 조회 실패');
  }
};
const modalConfirm = (selectedRow) => {
  if (!selectedRow) return;
  processCode.value = selectedRow.공정코드 || '';
  applyProcessFilter(selectedRow.공정코드);
};

const page = ref({ title: '설비 상태 관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '전체 조회', disabled: false, href: '#' }
]);
</script>
