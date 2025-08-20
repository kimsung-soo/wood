<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="전체 조회">
    <!-- 상단: 공정 조회 버튼 -->
    <v-row class="mb-2 py-0">
      <v-col cols="12" class="d-flex align-center">
        <v-btn color="warning" variant="flat" @click="openModal('공정 조회')"> 공정 조회 </v-btn>
      </v-col>
    </v-row>

    <!-- 선택된 공정 -->
    <v-row class="mb-4 pt-0">
      <v-col cols="12" md="3">
        <v-text-field label="공정코드" v-model="processCode" readonly hide-details density="comfortable" variant="outlined" />
      </v-col>
    </v-row>

    <!-- 공정 모달 -->
    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />

    <!-- 설비 리스트 -->
    <ag-grid-vue
      style="height: 460px; margin-top: 8px"
      :theme="quartz"
      :rowData="form.items"
      :columnDefs="columnDefs"
      :animateRows="true"
      :suppressClickEdit="true"
      :pagination="true"
      :pagination-page-size="10"
      @grid-ready="onGridReady"
    />
  </UiParentCard>
</template>

<script setup>
/* ─ 기본 ─ */
import { ref, reactive, shallowRef, onMounted } from 'vue';
import axios from 'axios';

/* ─ 공용 컴포넌트 ─ */
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import MoDal from '@/views/common/NewModal.vue';

/* ─ ag-grid ─ */
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

/* ─ API (프리픽스 없이) ─ */
const API_FAC_STATUS = 'http://localhost:3000/facility/status'; // 최신 상태 포함
const API_PROCESS = 'http://localhost:3000/process'; // 공정 목록(모달)
const API_CODES_FC = 'http://localhost:3000/common/codes/FC'; // 설비유형
const API_CODES_RR = 'http://localhost:3000/common/codes/RR'; // 고장유형

/* ─ 상태 ─ */
const processCode = ref('');
const processName = ref('');
const form = reactive({ items: [] });

/* ─ 코드 라벨 맵 ─ */
const FC_LABEL = ref({}); // 설비유형 라벨
const RR_LABEL = ref({}); // 고장유형 라벨
const buildLabelMap = (list) =>
  (Array.isArray(list) ? list : []).reduce((acc, r) => {
    if (r?.code) acc[r.code] = r.code_name ?? r.code;
    return acc;
  }, {});

/* ─ 날짜 포맷 ─ */
const fmtDate = (v) => (typeof v === 'string' ? v.slice(0, 10) : (v ?? ''));

/* ─ 컬럼 정의 ─ */
const columnDefs = ref([
  { field: '공정코드', hide: true, filter: 'agTextColumnFilter' },
  { field: '설비코드', flex: 1 },
  { field: '설비명', flex: 1 },
  {
    headerName: '설비유형',
    flex: 1,
    valueGetter: (p) => FC_LABEL.value[p.data?.FAC_TYPE] || p.data?.FAC_TYPE || ''
  },
  {
    field: '사용유무',
    flex: 1,
    cellStyle: (p) =>
      p.value === '사용' ? { color: 'blue', fontWeight: 'bold' } : p.value === '정지' ? { color: 'red', fontWeight: 'bold' } : null
  },
  { field: '제조사', flex: 1 },
  { field: '설비제조일', flex: 1 },
  { field: '설비설치일', flex: 1 },
  { field: '점검주기일', flex: 1 },
  { headerName: '고장유형', field: '고장유형', flex: 1 },
  { field: '담당자', flex: 1 }
]);

/* ─ 그리드 필터 ─ */
const gridApi = ref(null);
const gridColumnApi = ref(null);
const onGridReady = (e) => {
  gridApi.value = e.api;
  gridColumnApi.value = e.columnApi;
  if (processCode.value) applyProcessFilter(processCode.value);
};
const applyProcessFilter = (procCode) => {
  if (!gridApi.value) return;
  gridApi.value.setFilterModel({
    공정코드: { filterType: 'text', type: 'equals', filter: String(procCode) }
  });
  gridApi.value.onFilterChanged();
};

/* ─ 목록 매핑 ─
   /facility/status 응답에 FS_TYPE(고장유형) 포함됨 */
const mapRow = (r) => ({
  공정코드: r.PR_ID ?? '',
  설비코드: r.FAC_ID ?? '',
  설비명: r.FAC_NAME ?? '',
  FAC_TYPE: r.FAC_TYPE ?? '', // 라벨은 컬럼 valueGetter에서 처리
  사용유무: (r.FAC_USE ?? 1) === 1 ? '사용' : '정지',
  제조사: r.FAC_COMPANY ?? '',
  설비제조일: fmtDate(r.FAC_MDATE),
  설비설치일: fmtDate(r.FAC_IDATE),
  점검주기일: r.FAC_CHECKDAY ?? '',
  고장유형: RR_LABEL.value[r.FS_TYPE] || (r.FS_TYPE ?? '-'),
  담당자: r.MANAGER ?? ''
});

/* ─ 초기 데이터 로딩 ─ */
const preloadCodes = async () => {
  const [fc, rr] = await Promise.all([axios.get(API_CODES_FC), axios.get(API_CODES_RR)]);
  FC_LABEL.value = buildLabelMap(fc.data);
  RR_LABEL.value = buildLabelMap(rr.data);
};
const fetchList = async () => {
  const { data } = await axios.get(API_FAC_STATUS);
  form.items = (Array.isArray(data) ? data : []).map(mapRow);
  if (processCode.value) applyProcessFilter(processCode.value);
};
onMounted(async () => {
  try {
    await preloadCodes(); // 라벨 먼저
    await fetchList(); // 데이터
  } catch (e) {
    console.error('[init] error:', e);
    alert('초기 로딩 실패');
  }
});

/* ─ 모달: 공정 목록 ─ */
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([
  { field: '공정코드', headerName: '공정코드', flex: 1 },
  { field: '공정명', headerName: '공정명', flex: 1 },
  { field: '설비유형', headerName: '설비유형', flex: 1 },
  { field: '등록일자', headerName: '등록일자', flex: 1 },
  { field: '작성자', headerName: '작성자', flex: 1 },
  { field: '비고', headerName: '비고', flex: 1 }
]);
const mapProcess = (r) => ({
  공정코드: r.PR_ID ?? r.PRC_CODE ?? '',
  공정명: r.PRC_NAME ?? '',
  설비유형: FC_LABEL.value[r.FAC_TYPE] || r.FAC_TYPE || '',
  등록일자: fmtDate(r.PRC_RDATE),
  작성자: r.PRC_WRITER ?? '',
  비고: r.PRC_NOTE ?? ''
});
const fetchProcessList = async () => {
  const { data } = await axios.get(API_PROCESS);
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
  processName.value = selectedRow.공정명 || '';
  if (selectedRow.공정코드) applyProcessFilter(selectedRow.공정코드);
};

/* ─ UI 상단 ─ */
const page = ref({ title: '설비 정보 관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '전체 조회', disabled: false, href: '#' }
]);
</script>
