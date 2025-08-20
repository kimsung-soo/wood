<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="수리 관리">
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

    <ag-grid-vue
      style="height: 240px"
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
          <v-text-field label="설비코드" v-model="form.code" dense outlined readonly />
          <v-text-field label="설비명" v-model="form.name" dense outlined readonly />
          <v-text-field label="설비유형" v-model="form.type" dense outlined readonly />
          <v-text-field label="고장유형" v-model="form.err" dense outlined readonly />
          <v-text-field label="수리내역" v-model="form.note" dense outlined />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field label="비가동 시작일" v-model="form.repairStart" dense outlined readonly />
          <v-text-field label="수리 완료일" v-model="form.repairEnd" dense outlined readonly />
          <v-text-field label="담당자" v-model="form.manager" dense outlined />
          <v-text-field label="비고" v-model="form.remark" dense outlined />
          <div class="text-right mt-2">
            <v-btn color="primary" @click="completeRepair">수리완료</v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </UiParentCard>
</template>

<script setup>
import { ref, reactive, shallowRef, onMounted, watch } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import MoDal from '@/views/common/NewModal.vue';

import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

import axios from 'axios';
import dayjs from 'dayjs';

const apiBase = import.meta?.env?.VITE_API_BASE || '/api';
const PROCESS_API = `${apiBase}/process`;

const page = ref({ title: '설비 수리관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '수리 관리', disabled: false, href: '#' }
]);

/* 공정코드 필터 */
const processCode = ref('');
const gridApi = ref(null);
const onGridReady = (e) => (gridApi.value = e.api);
const applyProcessFilter = (procCode) => {
  if (!gridApi.value) return;
  gridApi.value.setFilterModel({
    공정코드: { filterType: 'text', type: 'equals', filter: procCode || '' }
  });
  gridApi.value.onFilterChanged();
};

// 컬럼 정의
const columnDefs = ref([
  { field: '공정코드', hide: true, filter: 'agTextColumnFilter' },
  { field: '설비코드', flex: 1 },
  { field: '설비명', flex: 1 },
  { field: '설비유형', flex: 1 },
  {
    field: '설비상태',
    flex: 1,
    cellStyle: (p) => {
      if (p.value === '가동') return { color: 'blue', fontWeight: 'bold' };
      if (p.value === '비가동') return { color: 'red', fontWeight: 'bold' };
      return null;
    }
  },
  { field: '비가동사유', flex: 1 },
  { field: '고장유형', flex: 1 },
  { field: '비가동시작시간', flex: 1 },
  { field: '담당자', flex: 1 }
]);
const defaultColDef = { editable: false, sortable: true, resizable: true };

//DB 연동

// 설비 메타(FACILITY)
const fetchFacilities = async () => {
  const { data } = await axios.get(`${apiBase}/facility`);
  return Array.isArray(data) ? data : [];
};

// 설비상태
const fetchStatusList = async () => {
  const { data } = await axios.get(`${apiBase}/facility/status`);
  return Array.isArray(data) ? data : [];
};

const rows = ref([]);
const composeRows = (statusRows, facilities) => {
  const facMap = new Map(facilities.map((f) => [f.FAC_ID, f]));
  const openDowns = statusRows.filter((s) => Number(s.FS_STATUS) === 1 && (s.FS_REASON || '') === '고장');

  return openDowns.map((s) => {
    const f = facMap.get(s.FAC_ID) || {};
    return {
      공정코드: f.PR_ID || '',
      설비코드: s.FAC_ID,
      설비명: s.FAC_NAME || f.FAC_NAME || '',
      설비유형: f.FAC_TYPE_NM || f.FAC_TYPE || '-',
      설비상태: '비가동',
      비가동사유: s.FS_REASON || '고장',
      고장유형: s.FS_TYPE_NM || '-',
      비가동시작시간: s.DOWN_STARTDAY ? fmt(s.DOWN_STARTDAY) : '-',
      담당자: (s.MANAGER ?? s.FS_MANAGER ?? s.MGR ?? '').toString() || (f.MANAGER ?? '-') || '-',
      _fsId: s.FS_ID,
      _fsType: s.FS_TYPE || null
    };
  });
};

// 초기 로드
const init = async () => {
  try {
    const [facilities, statusRows] = await Promise.all([fetchFacilities(), fetchStatusList()]);
    rows.value = composeRows(statusRows, facilities);
    if (processCode.value) applyProcessFilter(processCode.value);
  } catch (e) {
    console.error(e);
    rows.value = [];
  }
};

//상세 폼
const form = reactive({
  code: '',
  name: '',
  type: '',
  err: '',
  manager: '',
  repairStart: '',
  repairEnd: '',
  note: '',
  remark: '',
  _fsId: null
});

const selectedRowIndex = ref(-1);
const onPick = (e) => {
  const d = e.data;
  selectedRowIndex.value = e.rowIndex ?? -1;

  form.code = d.설비코드;
  form.name = d.설비명;
  form.type = d.설비유형;
  form.err = d.고장유형;
  form.manager = d.담당자 === '-' ? '' : d.담당자;
  form.repairStart = d.비가동시작시간 || now();
  form.repairEnd = '';
  form.note = '';
  form.remark = '';
  form._fsId = d._fsId || null;
};

//폼의 담당자 입력
watch(
  () => form.manager,
  (val) => {
    if (selectedRowIndex.value > -1 && rows.value[selectedRowIndex.value]) {
      rows.value[selectedRowIndex.value].담당자 = (val || '').trim() || '-';
    }
  }
);

//수리 완료
const completeRepair = async () => {
  if (!form._fsId) return alert('선택된 비가동 건이 없습니다.');
  if (!form.note || !form.note.trim()) return alert('수리내역을 입력해 주세요.');

  const endAt = form.repairEnd || now();
  form.repairEnd = endAt;

  await axios.patch(`${apiBase}/facility/status/end`, {
    FS_ID: form._fsId,
    endTime: endAt,
    restoreStatus: 0,
    checkTime: endAt,
    repairContent: form.note,
    repairNote: form.remark || null,
    MANAGER: (form.manager || '').trim() || null
  });

  form._fsId = null;
  await init();
  form.code = '';
  alert('수리 완료 처리되었습니다.');
};

/* 유틸 */
function now() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

//공정 조회 모달
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

onMounted(init);
</script>
