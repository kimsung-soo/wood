<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="설비 수정">
    <v-row class="mb-2 py-0">
      <v-col cols="12" class="d-flex align-center">
        <v-btn color="warning" variant="flat" @click="openModal('공정 조회')"> 공정 조회 </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4 pt-0">
      <v-col cols="12" md="3">
        <v-text-field label="공정코드" v-model="processCode" readonly hide-details density="comfortable" variant="outlined" />
      </v-col>
    </v-row>

    <!-- 설비 리스트 -->
    <ag-grid-vue
      style="height: 220px"
      :theme="quartz"
      :rowData="rows"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :animateRows="true"
      :suppressClickEdit="true"
      :pagination="true"
      :pagination-page-size="10"
      @grid-ready="onGridReady"
      @row-clicked="onPick"
    />

    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />

    <v-card v-if="form.code" class="mt-6 pa-4">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field label="설비코드" v-model="form.code" dense outlined />
          <v-text-field label="설비명" v-model="form.name" dense outlined />
          <v-text-field label="설비유형" v-model="form.type" dense outlined />
          <v-text-field label="제조사" v-model="form.manufacturer" dense outlined />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field label="설비등록일" v-model="form.registeredAt" dense outlined />
          <v-text-field label="설비설치일" v-model="form.installedAt" dense outlined />
          <v-text-field label="담당자" v-model="form.manager" dense outlined />
          <v-text-field label="비고" v-model="form.remark" dense outlined />
        </v-col>

        <v-col cols="12" md="6">
          <v-label class="mb-2 d-block">사용유무</v-label>
          <v-radio-group v-model="form.useYn" inline>
            <v-radio label="사용" value="사용" />
            <v-radio label="정지" value="정지" />
          </v-radio-group>
        </v-col>
      </v-row>

      <div class="text-right mt-2">
        <v-btn color="success" @click="saveEdit">수정</v-btn>
      </div>
    </v-card>
  </UiParentCard>
</template>

<script setup>
import { ref, reactive, shallowRef, onMounted } from 'vue';
import axios from 'axios';

import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import MoDal from '@/views/common/NewModal.vue';

import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

/* ====== API 엔드포인트 ====== */
const API_BASE = 'http://localhost:3000';
const LIST_URL = `${API_BASE}/facility`;
const UPDATE_URL = `${API_BASE}/facilityUpdate`;
const PROCESS_API = `${API_BASE}/process`;

/* 공정코드 필터 */
const processCode = ref('');
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
    공정코드: { filterType: 'text', type: 'equals', filter: String(procCode || '') }
  });
  gridApi.value.onFilterChanged();
};

const rows = ref([]);

/* 컬럼 */
const columnDefs = ref([
  { field: '공정코드', hide: true, filter: 'agTextColumnFilter' },
  { field: '설비코드', flex: 1 },
  { field: '설비명', flex: 1 },
  { headerName: '설비유형', field: '설비유형', flex: 1 },
  {
    field: '사용유무',
    flex: 1,
    cellStyle: (p) =>
      p.value === '사용' ? { color: 'blue', fontWeight: 'bold' } : p.value === '정지' ? { color: 'red', fontWeight: 'bold' } : null
  },
  { field: '제조사', flex: 1 },
  { field: '설비등록일', flex: 1 },
  { field: '설비설치일', flex: 1 },
  { field: '담당자', flex: 1 }
]);
const defaultColDef = { editable: false, sortable: true, resizable: true };

const fmtDate = (v) => (typeof v === 'string' ? v.slice(0, 10) : (v ?? ''));
const mapRow = (r) => ({
  공정코드: r.PR_ID ?? '',
  설비코드: r.FAC_ID ?? '',
  설비명: r.FAC_NAME ?? '',

  // 저장용 원본
  FAC_TYPE: r.FAC_TYPE ?? '',
  FAC_TYPE_NM: r.FAC_TYPE_NM ?? undefined,

  // 표시용
  설비유형: r.FAC_TYPE_NM ?? r.FAC_TYPE ?? '',

  사용유무: (r.FAC_USE ?? 1) === 1 ? '사용' : '정지',
  제조사: r.FAC_COMPANY ?? '',
  설비등록일: fmtDate(r.FAC_MDATE),
  설비설치일: fmtDate(r.FAC_IDATE),
  담당자: r.MANAGER ?? '',

  PR_ID: r.PR_ID ?? '',
  FAC_CHECKDAY: r.FAC_CHECKDAY ?? null
});

/* 목록 조회 */
const fetchList = async () => {
  try {
    const { data } = await axios.get(LIST_URL);
    rows.value = (Array.isArray(data) ? data : []).map(mapRow);
    if (processCode.value) applyProcessFilter(processCode.value);
  } catch (e) {
    console.error('[facility list] error:', e);
    alert('설비 목록 조회 실패');
  }
};
onMounted(fetchList);

/* 폼 상태 */
const form = reactive({
  code: '',
  name: '',
  type: '',
  useYn: '',
  manufacturer: '',
  registeredAt: '',
  installedAt: '',
  manager: '',
  remark: '',

  prId: '',
  checkDay: null
});

/* 행 선택 → 폼 채우기 */
const onPick = (e) => {
  const d = e.data;
  form.code = d.설비코드;
  form.name = d.설비명;
  form.type = d.설비유형;
  form.useYn = d.사용유무 || '';
  form.manufacturer = d.제조사 || '';
  form.registeredAt = d.설비등록일 || '';
  form.installedAt = d.설비설치일 || '';
  form.manager = d.담당자 || '';
  form.remark = '';

  form.prId = d.PR_ID || d.공정코드 || '';
  form.checkDay = d.FAC_CHECKDAY ?? null;

  processCode.value = form.prId || '';
};

/* 수정 저장 */
const saveEdit = async () => {
  if (!form.code) return alert('수정할 설비를 선택하세요.');

  const registered = form.registeredAt ? String(form.registeredAt).slice(0, 10) : null;
  const installed = form.installedAt ? String(form.installedAt).slice(0, 10) : null;

  const payload = {
    FAC_ID: form.code,
    FAC_NAME: form.name || null,
    FAC_TYPE: form.type || null,
    FAC_USE: form.useYn === '사용' ? 1 : 0,
    FAC_COMPANY: form.manufacturer || null,
    FAC_MDATE: registered,
    FAC_IDATE: installed,
    FAC_CHECKDAY: form.checkDay ?? null,
    PR_ID: form.prId || null,
    MANAGER: form.manager || null,
    MEMO: form.remark || null
  };
  console.log('[UPDATE payload]', payload);

  try {
    const res = await axios.put(UPDATE_URL, payload, { headers: { 'Content-Type': 'application/json' } });
    if (res.status === 200) {
      alert('수정 되었습니다 ');
      await fetchList();
      gridApi.value?.refreshCells({ force: true });
    } else {
      alert('수정 실패');
    }
  } catch (e) {
    console.error('[facility update] error:', e);
    alert(e?.response?.data?.error || e.message || '수정 저장 실패');
  }
};

//모달
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
  설비유형: r.FAC_TYPE ?? '',
  등록일자: fmtDate(r.PRC_RDATE),
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

const page = ref({ title: '설비 정보 관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '설비 수정', disabled: false, href: '#' }
]);
</script>
