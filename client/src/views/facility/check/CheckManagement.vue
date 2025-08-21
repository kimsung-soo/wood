<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard title="설비 점검관리">
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

    <!-- 공정 조회 모달 -->
    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />

    <!-- 상세입력 -->
    <v-card v-if="form.code" class="mt-6 pa-4 rounded-xl elevation-1 checker-card">
      <h3>점검 처리 입력</h3>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field label="설비코드" v-model="form.code" dense outlined readonly />
          <v-text-field label="설비명" v-model="form.name" dense outlined readonly />
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
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import axios from 'axios';
ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

const page = ref({ title: '설비 점검관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '점검관리', disabled: false, href: '#' }
]);

const processCode = ref('');
const gridApi = ref(null);
const onGridReady = (e) => (gridApi.value = e.api);

/** 공정코드 필터 */
const applyProcessFilter = (procCode) => {
  if (!gridApi.value) return;
  gridApi.value.setFilterModel({
    공정코드: { filterType: 'text', type: 'equals', filter: procCode || '' }
  });
  gridApi.value.onFilterChanged();
};

/* 컬럼 정의 */
const columnDefs = ref([
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
  { field: '비가동시작시간', flex: 1 },
  { field: '적합여부', flex: 1 },
  { field: '다음점검일', flex: 1 },
  { field: '담당자', flex: 1 }
]);
const defaultColDef = { editable: false, sortable: true, resizable: true };

/* ───────── API ───────── */
const apiBase = 'http://localhost:3000';
const INSPECTION_OPEN_API = `${apiBase}/facility/inspections/open`;
const INSPECTION_COMPLETE_API = `${apiBase}/facility/inspection/complete`;
const STATUS_CURRENT_API = (facId) => `${apiBase}/facility/status/current/${facId}`;
const PROCESS_API = `${apiBase}/process`;

/* 서버 → 그리드 매핑 */
const rows = ref([]);
const mapOpenInspection = (r) => ({
  공정코드: r.PR_ID ?? '',
  설비코드: r.FAC_ID,
  설비명: r.FAC_NAME,
  설비유형: r.FAC_TYPE_NM ?? r.FAC_TYPE ?? '',
  설비상태: '비가동',
  비가동사유: r.FS_REASON ?? '',
  비가동시작시간: r.DOWN_STARTDAY ? String(r.DOWN_STARTDAY).slice(0, 19).replace('T', ' ') : '',
  적합여부: '-',
  다음점검일: r.FS_NEXTDAY ? String(r.FS_NEXTDAY).slice(0, 10) : '-',
  담당자: r.MANAGER ?? ''
});

// const loadOpenInspections = async () => {
//   const { data } = await axios.get(INSPECTION_OPEN_API);
//   rows.value = (Array.isArray(data) ? data : []).map(mapOpenInspection);
//   if (processCode.value) applyProcessFilter(processCode.value);
// };

onMounted(loadOpenInspections);

/* 상세 폼 */
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
  ngReason: ''
});

const onPick = (e) => {
  const d = e.data;
  form.code = d.설비코드;
  form.name = d.설비명;
  form.type = d.설비유형;
  form.manager = d.담당자 || '';
  form.downStart = d.비가동시작시간 || now();
  form.doneAt = '';
  form.nextAt = '';
  form.inspectNote = '';
  form.fit = '';
  form.ngReason = '';
};

//점검완료
const completeInspection = async () => {
  if (!form.code) return alert('설비를 먼저 선택하세요.');
  if (!form.fit) return alert('적합 여부를 선택하세요.');
  if (form.fit === '부적합' && !form.ngReason.trim()) return alert('부적합 사유를 입력하세요.');

  form.doneAt = now();

  try {
    // 1) 현재 상태
    const { data: cur } = await axios.get(STATUS_CURRENT_API(form.code)); // /facility/status/current/:facId
    const FS_ID = Array.isArray(cur) ? cur[0]?.FS_ID : cur?.FS_ID;
    if (!FS_ID) return alert('상태(FS_ID)를 찾을 수 없습니다.');

    // 2) 점검완료 저장
    await axios.post(INSPECTION_COMPLETE_API, {
      FS_ID,
      FAC_ID: form.code,
      fit: form.fit, // '적합' | '부적합'
      ngReason: form.fit === '부적합' ? form.ngReason : null,
      content: form.inspectNote || null,
      nextAt: form.nextAt || null,
      doneAt: form.doneAt,
      manager: form.manager || null
    });

    // 3) 목록 갱신
    await loadOpenInspections();
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
      ngReason: ''
    });
  } catch (e) {
    console.error('[inspection complete] error:', e);
    alert('점검 완료 처리 중 오류가 발생했습니다.');
  }
};

function now() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* 공정 조회 모달 */
import MoDal from '@/views/common/NewModal.vue';
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
  등록일자: typeof r.PRC_RDATE === 'string' ? r.PRC_RDATE.slice(0, 10) : '',
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
</script>
