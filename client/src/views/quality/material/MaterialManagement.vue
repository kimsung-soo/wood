<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <!-- 상단 버튼 -->
    <v-row justify="end" class="mb-2">
      <v-col>
        <v-btn color="error" class="top_btn_ser" variant="elevated" @click="resetForm">초기화</v-btn>
        <v-btn color="primary" class="top_btn_ser" @click="saveForm">등록</v-btn>
      </v-col>
    </v-row>

    <!-- 1) 검사기준 그리드 (체크박스=합격) -->
    <ag-grid-vue
      :rowData="criteriaRows"
      :columnDefs="criteriaCols"
      :defaultColDef="defaultColDef"
      :rowSelection="rowSelection"
      :selectionColumnDef="selectionColumnDef"
      :gridOptions="criteriaGridOptions"
      :theme="quartz"
      style="height: 280px; width: 100%"
      @grid-ready="onCriteriaReady"
      @first-data-rendered="selectAllCriteria"
      @selection-changed="recalcCriteria"
    />

    <!-- 최종처리 -->
    <v-row class="my-4">
      <v-col cols="12" class="py-1">
        <div class="d-flex align-center">
          <h5 class="mr-4">최종처리</h5>
          <v-chip :color="finalStatus == '합격' ? 'primary' : 'error'">{{ finalStatus }}</v-chip>
          <span class="ml-auto text-caption">선택 {{ selectedCount }}/{{ totalCount }}</span>
        </div>
      </v-col>
    </v-row>

    <!-- 불합격 사유 입력 섹션 -->
    <v-card v-show="finalStatus === '불합격'" class="mb-4" elevation="2">
      <v-card-title class="bg-red-lighten-5 text-red-darken-2"> </v-card-title>
      <v-card-text>
        <v-textarea
          v-model="defectReason.description"
          label="불합격 사유"
          variant="outlined"
          rows="3"
          counter="500"
          maxlength="500"
          :rules="[(v) => finalStatus === '합격' || (v && v.length > 0) || '불합격 시 사유는 필수입니다.']"
        />
      </v-card-text>
    </v-card>

    <!-- 2) 하단 입력 그리드(1행) -->
    <ag-grid-vue
      :rowData="detailRows"
      :columnDefs="detailCols"
      :gridOptions="detailGridOptions"
      :theme="quartz"
      style="height: 160px; width: 100%"
    />
  </UiParentCard>
</template>

<script setup>
/*

기능 필요한거
1. 뒤로가기 버튼 하나 만들어주세요
2. 원자재검사 등록 후에 알람창 하나 만들어주세요.

*/
import axios from 'axios';
import { ref, shallowRef, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, themeQuartz, ClientSideRowModelModule, RowSelectionModule, ValidationModule } from 'ag-grid-community';

// 모듈 등록
ModuleRegistry.registerModules([ClientSideRowModelModule, RowSelectionModule, ...(import.meta.env.PROD ? [] : [ValidationModule])]);

const quartz = themeQuartz;
const route = useRoute();

/* breadcrumb */
const page = ref({ title: '원자재 검수관리 등록' });
const breadcrumbs = ref([
  { title: '품질', disabled: true, href: '#' },
  { title: '원자재 검수관리 등록', disabled: false, href: '#' }
]);

/* ------------ 불합격 사유 관련 데이터 ------------ */
const defectReason = ref({
  description: ''
});

// 원자재 품질기준 조회
// DB에서 데이터 가져오기
// const getQStandardList = async () => {
//   try {
//     const url = 'http://localhost:3000/qstdlist';

//     const result = await axios.get(url);

//     if (result.data && result.data.length > 0) {
//       qcStdRowData.value = result.data.map((item) => ({
//         stdName: item.STD_NAME,
//         stdContent: item.STD_CONTENT,
//         allowedValue: item.ALLOWED_VALUE
//       }));
//     } else {
//       qcStdRowData.value = [];
//     }
//   } catch (err) {
//     console.error('데이터 조회 중 오류:', err);
//     qcStdRowData.value = [];
//   }
// };

/* ------------ 1) 검사기준 그리드 (선택=합격) ------------ */
// 행 데이터 (rowId로 쓸 고유 키 _id 포함)
const criteriaRows = ref([
  { _id: 'moisture', label: '함수율', allow: '수분 함량 12~15% (KS범위)' },
  { _id: 'appearance', label: '외관결점', allow: '옹이≤150mm, 활결≤50%, 전체길이 1% 이내' },
  { _id: 'thickness', label: '치수정밀도', allow: '입고자재 ±2mm 이내' },
  { _id: 'strength', label: '강도', allow: 'KS F 2207, 횡강도 ≥ 35MPa' },
  { _id: 'surface', label: '외관/표면 결함', allow: '육안확인 시 결점 없음' }
]);

const criteriaApi = shallowRef(null);

const defaultColDef = ref({ resizable: true, minWidth: 120, sortable: false });

const rowSelection = ref({ mode: 'multiRow' });

const selectionColumnDef = ref({
  headerName: '판정',
  pinned: 'right',
  width: 90,
  headerCheckboxSelection: true,
  headerCheckboxSelectionCurrentPageOnly: false,
  checkboxSelection: true,
  suppressHeaderMenuButton: true
});

const criteriaCols = ref([
  { headerName: '검사기준', field: 'label', minWidth: 160, flex: 1 },
  { headerName: '허용수치', field: 'allow', minWidth: 360, flex: 2 },
  {
    headerName: '판정',
    colId: 'result',
    minWidth: 120,
    maxWidth: 140,
    valueGetter: (p) => (p.node?.isSelected() ? '합격' : '불합격'),
    cellClass: (p) => (p.value === '합격' ? 'ag-cell-success' : 'ag-cell-error'),
    sortable: false
  }
]);

const criteriaGridOptions = ref({
  defaultColDef: defaultColDef.value,
  getRowId: (p) => p.data._id // 선택 안정화
});

// 합격/불합격 계산
const totalCount = ref(0);
const selectedCount = ref(0);
const finalStatus = computed(() => (selectedCount.value === totalCount.value ? '합격' : '불합격'));

function onCriteriaReady(e) {
  criteriaApi.value = e.api;
}

function selectAllCriteria(e) {
  // 기본값: 전부 합격(전체 선택)
  const nodes = [];
  e.api.forEachNode((n) => nodes.push(n));
  e.api.setNodesSelected({ nodes, newValue: true });
  recalcCriteria();
}

function recalcCriteria() {
  const api = criteriaApi.value;
  if (!api) return;
  totalCount.value = api.getDisplayedRowCount();
  selectedCount.value = api.getSelectedNodes().length;
  api.refreshCells({ columns: ['result'], force: true });

  // 모든 항목이 합격이 되면 불합격 사유 초기화
  if (selectedCount.value === totalCount.value) {
    defectReason.value = {
      category: '',
      severity: '',
      description: ''
    };
  }
}

/* ------------ 2) 하단 입력 그리드(1행) ------------ */
const detailRows = ref([
  {
    id: '(자동생성)',
    inNo: '(자동입력)',
    materialCode: '(자동입력)',
    totalQty: '(자동입력)',
    user: '(세션사용자)',
    inDate: '(자동입력)',
    doneDate: '(현재 yyyyMMdd)'
  }
]);

function numParser(p) {
  const v = Number(String(p.newValue).replace(/,/g, '').trim());
  return Number.isFinite(v) ? v : p.oldValue;
}

const detailCols = ref([
  { headerName: '원자재검사번호', field: 'id', width: 170, editable: false },
  { headerName: '입고번호', field: 'inNo', width: 140, editable: false },
  { headerName: '원자재코드', field: 'materialCode', width: 150, editable: false },
  { headerName: '총수량', field: 'totalQty', width: 110, editable: true, valueParser: numParser },
  { headerName: '작성자', field: 'user', width: 120, editable: true },
  { headerName: '입고일자', field: 'inDate', width: 140, editable: true },
  { headerName: '검사완료일자', field: 'doneDate', width: 140, editable: true }
]);

const detailGridOptions = ref({
  defaultColDef: { resizable: true, minWidth: 110 },
  autoSizeStrategy: { type: 'fitGridWidth' }
});

// 클릭한 행의 내용가져오기
onMounted(() => {
  const r = detailRows.value[0];

  // 쿼리에서 값 채우기
  r.inNo = String(route.query.receiptNo || '');
  r.materialCode = String(route.query.matCode || '');
  r.materialName = String(route.query.materialName || '');
  r.totalQty = Number(route.query.totalQty || 0);
  r.inDate = String(route.query.inDate || '');
  r.user = String(route.query.createdBy || ''); // 세션값 받아오면 반영(스토어)
  const today = new Date();
  r.doneDate = today.toISOString().slice(0, 10);
});

/* ------------ 버튼 로직 ------------ */
function resetForm() {
  // 검사기준: 전부 불합격(선택 해제)
  const api = criteriaApi.value;
  if (api) {
    const nodes = [];
    api.forEachNode((n) => nodes.push(n));
    api.setNodesSelected({ nodes, newValue: false });
    recalcCriteria();
  }
  // 하단 디테일 초기화
  const r = detailRows.value[0];
  r.totalQty = 0;
  r.passQty = 0;
  r.user = '';
  r.inDate = '';
  r.doneDate = '';

  // 불합격 사유 초기화
  defectReason.value = {
    category: '',
    severity: '',
    description: ''
  };
}

// 저장버튼
async function saveForm() {
  const d = detailRows.value[0];
  const isPass = finalStatus.value === '합격';

  if (!isPass && !defectReason.value.description.trim()) {
    alert('불합격 사유를 입력해주세요.');
    return;
  }

  const passData = {
    RECEIPT_NO: d.inNo.trim(),
    MAT_CODE: d.materialCode.trim(),
    Q_CHECKED_DATE: d.doneDate,
    TOTAL_QTY: Number(d.totalQty) || 0,
    CREATED_BY: d.user?.trim() || null // ← 핵심
  };

  const rjtData = {
    RECEIPT_NO: d.inNo,
    MAT_CODE: d.materialCode,
    RJT_REASON: defectReason.value.description.trim().slice(0, 100),
    Q_CHECKED_DATE: d.doneDate,
    TOTAL_QTY: Number(d.totalQty),
    CREATED_BY: d.user
  };

  if (isPass) {
    await axios.post('http://localhost:3000/passmat', passData);
    alert('합격등록이 완료되었습니다.');
  } else {
    await axios.post('http://localhost:3000/rjtmat', rjtData);
    alert('불합격등록이 완료되었습니다.');
  }
}
</script>

<style scoped>
.top_btn_ser {
  margin-left: 8px;
}
.fw-600 {
  font-weight: 600;
}
.mr-4 {
  margin-right: 16px;
}
.ml-auto {
  margin-left: auto;
}
.ag-cell-success {
  font-weight: 600;
}
.ag-cell-error {
  color: #d32f2f;
  font-weight: 600;
}
</style>
