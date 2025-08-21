<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="설비 점검관리">
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
      style="height: 260px"
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

    <v-card v-if="form.code" class="mt-6 pa-4 rounded-xl elevation-1 checker-card">
      <h3>점검 처리 입력</h3>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field label="설비코드" v-model="form.code" dense outlined readonly />
          <v-text-field label="설비명" v-model="form.name" dense outlined readonly />
          <v-text-field label="설비유형" v-model="form.type" dense outlined readonly />
          <v-text-field label="점검내역" v-model="form.inspectNote" dense outlined />
          <v-text-field label="담당자" v-model="form.manager" dense outlined />
          <v-text-field label="부적합 사유" v-model="form.ngReason" dense outlined :disabled="form.fit !== '부적합'" />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field label="비가동 시작일" v-model="form.downStart" dense outlined readonly />
          <v-text-field label="점검 완료일" v-model="form.doneAt" dense outlined readonly />
          <v-text-field label="다음 점검일" v-model="form.nextAt" type="date" dense outlined />

          <div class="mt-2">
            <v-label class="mb-2 d-block">적합 여부</v-label>
            <v-radio-group v-model="form.fit" inline density="compact">
              <v-radio label="적합" value="적합" />
              <v-radio label="부적합" value="부적합" />
            </v-radio-group>
          </div>

          <div class="text-right mt-6">
            <v-btn color="primary" @click="completeInspection">점검완료</v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </UiParentCard>
</template>

<script setup>
import { ref, reactive, shallowRef, onMounted } from 'vue';

import axios from 'axios';
import dayjs from 'dayjs';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import MoDal from '@/views/common/NewModal.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

// ag-grid 등록
ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

const page = ref({ title: '설비 점검관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '점검 관리', disabled: false, href: '#' }
]);


// API 경로
const apiBase = import.meta?.env?.VITE_API_BASE || '/api';
const INSPECTION_COMPLETE_API = `${apiBase}/facility/inspection/complete`;
const PROCESS_API = `${apiBase}/process`;

// 설비유형 코드맵
let fcMap = new Map();
const preloadCodeMaps = async () => {
  const { data } = await axios.get(`${apiBase}/common/codes/FC`);
  fcMap = new Map(data.map((r) => [String(r.code ?? r.CODE), r.code_name ?? r.CODE_NAME]));
};

// 공정코드 필터링
const processCode = ref('');
const gridApi = ref(null);
const onGridReady = (e) => {
  gridApi.value = e.api;
  init();
};


const applyProcessFilter = (procCode) => {
  if (!gridApi.value) return;
  gridApi.value.setFilterModel({
    공정코드: { filterType: 'text', type: 'equals', filter: procCode || '' }
  });
  gridApi.value.onFilterChanged();
};


// 컬럼 정의

const columnDefs = ref([
  { field: '설비코드', flex: 1 },
  { field: '설비명', flex: 1 },
  { field: '설비유형', flex: 1 },
  {
    field: '설비상태',
    flex: 1,

    cellStyle: (p) => (p.value === '점검' ? { color: 'red', fontWeight: 'bold' } : { color: 'blue', fontWeight: 'bold' })

  },
  { field: '비가동사유', flex: 1 },
  { field: '비가동시작시간', flex: 1 },
  { field: '적합여부', flex: 1, hide: true },
  { field: '다음점검일', flex: 1, hide: true },
  { field: '담당자', flex: 1 }
]);
const defaultColDef = { editable: false, sortable: true, resizable: true };


// 데이터 조회
const fetchFacilities = async () => (await axios.get(`${apiBase}/facility`)).data || [];
const fetchStatusList = async () => (await axios.get(`${apiBase}/facility/status`)).data || [];


const rows = ref([]);

const fmtDT = (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-');

// 점검대상
const composeRows = (statusRows, facilities) => {
  const facMap = new Map(facilities.map((f) => [f.FAC_ID, f]));
  const openInspections = statusRows.filter((s) => Number(s.FS_STATUS) === 1 && (s.FS_REASON || '') === '점검');

  return openInspections.map((s) => {
    const f = facMap.get(s.FAC_ID) || {};
    const facTypeLabel = f.FAC_TYPE ? fcMap.get(String(f.FAC_TYPE)) || f.FAC_TYPE : f.FAC_TYPE_NM || '-';

    return {
      공정코드: f.PR_ID || '',
      설비코드: s.FAC_ID,
      설비명: f.FAC_NAME || '',
      설비유형: facTypeLabel,
      설비상태: '점검',
      비가동사유: s.FS_REASON || '점검',
      비가동시작시간: s.DOWN_STARTDAY ? fmtDT(s.DOWN_STARTDAY) : s.FS_CHECKDAY ? fmtDT(s.FS_CHECKDAY) : '',
      적합여부: '-',
      다음점검일: s.FS_NEXTDAY ? String(s.FS_NEXTDAY).slice(0, 10) : '-',
      담당자: s.MANAGER ?? f.MANAGER ?? '-',
      _fsId: s.FS_ID
    };
  });
};

// 초기 데이터 로드
const init = async () => {
  try {
    await preloadCodeMaps();
    const [facilities, statusRows] = await Promise.all([fetchFacilities(), fetchStatusList()]);
    rows.value = composeRows(statusRows, facilities);
    if (processCode.value) applyProcessFilter(processCode.value);
  } catch (e) {
    console.error(e);
    rows.value = [];
  }
};


const form = reactive({
  code: '',
  name: '',
  type: '',
  manager: '',
  downStart: '',
  doneAt: '',
  nextAt: '',
  inspectNote: '',
  fit: '',
  ngReason: '',
  _fsId: null
});
const onPick = (e) => {
  const d = e.data;
  Object.assign(form, {
    code: d.설비코드,
    name: d.설비명,
    type: d.설비유형,
    manager: d.담당자 === '-' ? '' : d.담당자,
    downStart: d.비가동시작시간 || now(),
    doneAt: '',
    nextAt: d.다음점검일 === '-' ? '' : d.다음점검일,
    inspectNote: '',
    fit: '',
    ngReason: '',
    _fsId: d._fsId
  });
};


// 점검완료 처리

const completeInspection = async () => {
  if (!form._fsId) return alert('설비를 먼저 선택하세요.');
  if (!form.fit) return alert('적합 여부를 선택하세요.');
  if (form.fit === '부적합' && !form.ngReason.trim()) return alert('부적합 사유를 입력하세요.');

  form.doneAt = now();

  try {
    await axios.post(INSPECTION_COMPLETE_API, {
      FS_ID: form._fsId,
      FAC_ID: form.code,
      fit: form.fit,
      ngReason: form.fit === '부적합' ? form.ngReason : null,
      content: form.inspectNote || null,
      nextAt: form.nextAt || null,
      doneAt: form.doneAt,
      manager: form.manager || null
    });


    await init();


    gridApi.value?.refreshCells({ force: true });
    alert('점검이 완료되었습니다.');
    // 선택 폼 초기화
    Object.assign(form, {
      code: '',
      name: '',
      type: '',
      manager: '',
      downStart: '',
      doneAt: '',
      nextAt: '',
      inspectNote: '',
      fit: '',
      ngReason: '',
      _fsId: null
    });
  } catch (e) {
    console.error('[inspection complete] error:', e);
    alert('점검 완료 처리 중 오류가 발생했습니다.');
  }
};


// 유틸: 현재시각

function now() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

// 공정 목록 모달

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

// 공정 데이터 매핑
const mapProcess = (r) => ({
  공정코드: r.PR_ID ?? r.PRC_CODE ?? '',
  공정명: r.PRC_NAME ?? '',

  설비유형: r.FAC_TYPE ? fcMap.get(String(r.FAC_TYPE)) || r.FAC_TYPE : '-',
  등록일자: r.PRC_RDATE ? dayjs(r.PRC_RDATE).format('YYYY-MM-DD') : '',

  작성자: r.PRC_WRITER ?? '',
  비고: r.PRC_NOTE ?? ''
});

// 공정 목록 조회
const fetchProcessList = async () => {
  const { data } = await axios.get(PROCESS_API);
  return (Array.isArray(data) ? data : []).map(mapProcess);
};

// 모달 열기
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

// 모달 선택 반영
const modalConfirm = (selectedRow) => {
  if (!selectedRow) return;
  processCode.value = selectedRow.공정코드 || '';
  applyProcessFilter(selectedRow.공정코드);
};

onMounted(init);
</script>
