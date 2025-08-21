<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="비가동 관리">
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
      class="ag-theme-quartz grid-clean"
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

    <v-card v-if="detail.code" class="mt-6 pa-4">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field label="설비코드" v-model="detail.code" dense outlined readonly />
          <v-text-field label="설비명" v-model="detail.name" dense outlined readonly />
          <v-text-field label="설비유형" v-model="detail.type" dense outlined readonly />
          <v-text-field label="비가동 시작일시" v-model="detail.downStart" dense outlined readonly />
          <v-text-field class="mt-2" label="비가동 완료일시" v-model="detail.downEnd" dense outlined readonly />
        </v-col>

        <v-col cols="12" md="6">
          <v-label class="mb-1 d-block">상태 선택</v-label>
          <v-radio-group v-model="detail.targetStatus" inline>
            <v-radio label="가동" value="가동" />
            <v-radio label="비가동" value="비가동" />
          </v-radio-group>

          <v-label class="mb-1 d-block">비가동 사유</v-label>
          <v-radio-group v-model="detail.downReason" inline :disabled="detail.targetStatus !== '비가동'">
            <v-radio label="고장" value="고장" />
            <v-radio label="점검" value="점검" />
          </v-radio-group>

          <v-label class="mb-1 d-block">고장 유형</v-label>
          <v-radio-group v-model="detail.errType" inline :disabled="detail.targetStatus !== '비가동' || detail.downReason !== '고장'">
            <v-radio v-for="opt in rrOptions" :key="opt.code" :label="opt.code_name" :value="opt.code" />
          </v-radio-group>

          <div class="text-right mt-2">
            <v-btn color="error" :disabled="detail.targetStatus !== '비가동'" @click="setDown">비가동</v-btn>
            <v-btn class="ml-2" color="primary" :disabled="detail.targetStatus !== '가동'" @click="setUp">가동</v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </UiParentCard>

  <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
</template>

<script setup>
import { ref, reactive, shallowRef } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import MoDal from '@/views/common/NewModal.vue';

// ag-grid
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

const apiBase = 'http://localhost:3000';
const PROCESS_API = `${apiBase}/process`;

let fcMap = new Map();
let rrMap = new Map();
const rrOptions = ref([]);

// 코드 테이블
const preloadCodeMaps = async () => {
  const [fcRes, rrRes] = await Promise.all([axios.get(`${apiBase}/common/codes/FC`), axios.get(`${apiBase}/common/codes/RR`)]);

  const toMap = (rows) => {
    const m = new Map();
    for (const r of rows || []) m.set(String(r.code ?? r.CODE), r.code_name ?? r.CODE_NAME);
    return m;
  };

  fcMap = toMap(fcRes.data);
  rrMap = toMap(rrRes.data);
  rrOptions.value = Array.isArray(rrRes.data) ? rrRes.data : [];
};

const processCode = ref('');
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

const defaultColDef = { editable: false, sortable: true, resizable: true, suppressHeaderMenuButton: true };
const statusStyle = (v) =>
  v === '가동' ? { color: 'blue', fontWeight: 'bold' } : v === '비가동' ? { color: 'red', fontWeight: 'bold' } : null;

const columnDefs = ref([
  { field: '공정코드', hide: true, filter: 'agTextColumnFilter' },
  { field: '설비코드', flex: 1 },
  { field: '설비명', flex: 1 },
  { field: '설비유형', flex: 1 },
  { field: '설비상태', flex: 1, cellStyle: (p) => statusStyle(p.value) },
  { field: '비가동사유', flex: 1 },
  { field: '고장유형', flex: 1 },
  { field: '비가동시작시간', flex: 1 }
]);

const rows = ref([]);

// 설비 목록 조회
const fetchFacilities = async () => {
  const { data } = await axios.get(`${apiBase}/facility`);
  return data || [];
};

// 설비 상태 조회
const fetchStatusList = async () => {
  try {
    const { data } = await axios.get(`${apiBase}/facility/status`);
    return data || [];
  } catch {
    return [];
  }
};

// 유틸
const fmtDT = (v) => {
  if (!v) return '';
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const statusText = (s) => ({ 0: '가동', 1: '비가동', 2: '점검중' })[Number(s)] ?? String(s);

const composeRows = (statusRows, facilities) => {
  const facMap = new Map(facilities.map((f) => [f.FAC_ID, f]));

  return (statusRows || []).map((s) => {
    const f = facMap.get(s.FAC_ID) || {};
    const stNum = Number(s.FS_STATUS ?? 0);
    const stTxt = statusText(stNum);

    const showReason = stNum === 1 ? s.FS_REASON || '-' : '-';
    const rrName = stNum === 1 ? (s.FS_TYPE ? rrMap.get(String(s.FS_TYPE)) || s.FS_TYPE : '-') : '-';
    const startAt = stNum === 1 && s.DOWN_STARTDAY ? fmtDT(s.DOWN_STARTDAY) : '-';

    const facTypeName = f.FAC_TYPE ? fcMap.get(String(f.FAC_TYPE)) || f.FAC_TYPE : f.FAC_TYPE_NM || '-';

    return {
      공정코드: f.PR_ID || '',
      설비코드: s.FAC_ID,
      설비명: s.FAC_NAME || f.FAC_NAME || '',
      설비유형: facTypeName,
      설비상태: stTxt,
      비가동사유: showReason,
      고장유형: rrName,
      비가동시작시간: startAt,

      _fsId: s.FS_ID || null,
      _fsStatus: stNum,
      _downEnd: s.DOWN_ENDDAY || null,
      _fsType: s.FS_TYPE || null
    };
  });
};

const composeRowsFromFacilities = (facilities) =>
  (facilities || []).map((f) => ({
    공정코드: f.PR_ID || '',
    설비코드: f.FAC_ID,
    설비명: f.FAC_NAME || '',
    설비유형: f.FAC_TYPE ? fcMap.get(String(f.FAC_TYPE)) || f.FAC_TYPE : '-',
    설비상태: '가동',
    비가동사유: '-',
    고장유형: '-',
    비가동시작시간: '-',
    담당자: f.MANAGER || '-',
    _fsId: null,
    _fsStatus: 0,
    _downEnd: null,
    _fsType: null
  }));

const init = async () => {
  await preloadCodeMaps();
  const [facilities, statusRows] = await Promise.all([fetchFacilities(), fetchStatusList()]);
  rows.value = statusRows.length > 0 ? composeRows(statusRows, facilities) : composeRowsFromFacilities(facilities);
  if (processCode.value) applyProcessFilter(processCode.value);
};

const detail = reactive({
  code: '',
  name: '',
  type: '',
  targetStatus: '비가동',
  downReason: '',
  errType: '',
  downStart: '',
  downEnd: '',
  manager: '-',

  _fsId: null,
  _downEnd: null,
  _fsStatus: 0,
  _fsType: null
});

// 행 선택
const onPick = (e) => {
  const d = e.data;
  const isUp = d.설비상태 === '가동';

  detail.code = d.설비코드;
  detail.name = d.설비명;
  detail.type = d.설비유형;
  detail.targetStatus = isUp ? '비가동' : '가동';

  detail.downReason = isUp ? '' : d.비가동사유 !== '-' ? d.비가동사유 : '';
  detail.errType = isUp ? '' : e.data._fsType || '';
  detail.downStart = isUp ? '' : d.비가동시작시간 !== '-' ? d.비가동시작시간 : '';
  detail.downEnd = '';

  detail._fsId = e.data._fsId || null;
  detail._fsStatus = e.data._fsStatus || 0;
};

// 상태 변경 → 비가동
const setDown = async () => {
  if (detail.targetStatus !== '비가동') return;
  if (!detail.code) return;

  if (!detail.downReason) return alert('비가동 사유를 선택하세요.');
  if (detail.downReason === '고장' && !detail.errType) return alert('고장 유형을 선택하세요.');
  if (!confirm('비가동으로 변경할까요?')) return;

  const nowStr = now();

  try {
    if (detail._fsId) {
      await axios.patch(`${apiBase}/facility/status/down`, {
        FS_ID: detail._fsId,
        FS_STATUS: 1,
        FS_REASON: detail.downReason,
        FS_TYPE: detail.downReason === '고장' ? detail.errType : null,
        DOWN_STARTDAY: nowStr,
        FS_CHECKDAY: nowStr,
        FS_NEXTDAY: null,
        MANAGER: detail.manager || '-'
      });
    } else {
      await axios.post(`${apiBase}/facility/status`, {
        FAC_ID: detail.code,
        FS_STATUS: 1,
        FS_REASON: detail.downReason,
        FS_TYPE: detail.downReason === '고장' ? detail.errType : null,
        DOWN_STARTDAY: nowStr,
        FS_CHECKDAY: nowStr,
        FS_NEXTDAY: null,
        MANAGER: detail.manager || '-'
      });
    }

    detail.downStart = nowStr;
    detail.downEnd = '';
    await init();
    alert('비가동 처리되었습니다.');
  } catch (e) {
    console.error(e);
    alert('비가동 처리 중 오류가 발생했습니다.');
  }
};

// ===== 상태 변경 → 가동 =====
const setUp = async () => {
  if (detail.targetStatus !== '가동') return;
  if (!detail.code) return;

  const fsId = detail._fsId;
  const endStr = now();

  try {
    if (fsId) {
      await axios.patch(`${apiBase}/facility/status/end`, {
        FS_ID: fsId,
        endTime: endStr,
        restoreStatus: 0,
        checkTime: endStr
      });
    }
    detail.downEnd = endStr;
    await init();

    detail.downReason = '';
    detail.errType = '';
    detail.downStart = '';
    alert('가동으로 전환되었습니다.');
  } catch (e) {
    console.error(e);
    alert('가동 처리 중 오류가 발생했습니다.');
  }
};

// 현재 시간 포맷
function now() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// 공정 모달
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
  설비유형: r.FAC_TYPE ? fcMap.get(String(r.FAC_TYPE)) || r.FAC_TYPE : '-',
  등록일자: (typeof r.PRC_RDATE === 'string' ? r.PRC_RDATE.slice(0, 10) : '') || '',
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
  { title: '비가동 관리', disabled: false, href: '#' }
]);
</script>
