<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <!-- 상단 버튼 -->
    <v-row justify="end" class="mb-2">
      <v-btn color="error" class="top_btn_ser" variant="elevated" @click="resetForm">초기화</v-btn>
      <v-btn color="primary" class="top_btn_ser" @click="saveForm">등록</v-btn>
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
          <v-chip :color="finalStatus === '합격' ? 'primary' : 'error'">{{ finalStatus }}</v-chip>
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
import axios from 'axios';
import { ref, shallowRef, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

import { useRoute } from 'vue-router';
import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, themeQuartz, ClientSideRowModelModule, RowSelectionModule, ValidationModule } from 'ag-grid-community';

// 모듈 등록 (개발 모드에서만 Validation)
ModuleRegistry.registerModules([ClientSideRowModelModule, RowSelectionModule, ...(import.meta.env.PROD ? [] : [ValidationModule])]);

const quartz = themeQuartz;
const route = useRoute();
/* breadcrumb */
const page = ref({ title: '제품 검수관리 등록' });
const breadcrumbs = ref([
  { title: '품질', disabled: true, href: '#' },
  { title: '제품 검수관리 등록', disabled: false, href: '#' }
]);

/* ------------ 1) 검사기준 그리드 (선택=합격) ------------ */
// 행 데이터 (rowId로 쓸 고유 키 _id 포함)
const criteriaRows = ref([
  { _id: 'moisture', label: '함수율', allow: '수분 함량 12~15% (KS범위)', value: '' },
  { _id: 'moisture', label: '치수정밀도', allow: '입고자재 ±2mm 이내', value: '' },
  { _id: 'moisture', label: '강도/내구성', allow: '횡강도 35MPa 이상', value: '' },
  { _id: 'appearance', label: '안정성', allow: '전도 없음, 전기부 안전, 모서리 등금 위험요소 없음', value: '' },
  { _id: 'thickness', label: '왼관 결점', allow: '옹이, 할렬, 긁힘 육안확인 시 결점이 없을 시', value: '' },
  { _id: 'strength', label: '포름알데히드 방출률', allow: '친환경 E0 등급(0.3mg/L)이하', value: '' },
  { _id: 'surface', label: '표면 마감/도장', allow: '도맏 들뜸 박리 없음, 균일한 색상 광택 유지', value: '' }
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
  { headerName: '측정값', field: 'value', minWidth: 360, flex: 2, editable: true },
  {
    headerName: '판정',
    colId: 'result',
    minWidth: 120,
    maxWidth: 140,
    valueGetter: (p) => (p.node?.isSelected() ? '합격' : '불합격'),
    cellClass: (p) => (p.value == '합격' ? 'ag-cell-success' : 'ag-cell-error'),
    sortable: false
  }
]);

const criteriaGridOptions = ref({
  defaultColDef: defaultColDef.value
});

// 합격/불합격 계산
const totalCount = ref(0);
const selectedCount = ref(0);
const finalStatus = computed(() => (selectedCount.value == totalCount.value ? '합격' : '불합격'));

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
}

/* ------------ 2) 하단 입력 그리드(1행) ------------ */
const detailRows = ref([
  {
    certid: '(함수실행)',
    prdCode: '(자동입력)',
    prdName: '(자동입력)',
    prdType: '(자동입력)',
    totalQty: '(자동입력)',
    writer: '(세션id)',
    finished_at: '(자동입력)',
    certDate: '(오늘날짜)'
    /*

    */
  }
]);
/*
    query: {
      product_code: String(row.product_code || ''), // 제품코드
      product_name: String(row.product_name || ''), // 제품명
      product_type: String(row.product_type || ''), // 제품유형
      qty: String(row.qty || 0), // 총수량
      writer: String(row.writer || ''), // 작업자
      finished_at: String(row.finished_at || '') // 생산완료일
    }
      */
const detailCols = ref([
  { headerName: '제품검사번호', field: 'certid', width: 170, editable: false },
  { headerName: '제품코드', field: 'prdCode', width: 140, editable: false },
  { headerName: '제품명', field: 'prdName', width: 150, editable: false },
  { headerName: '제품유형', field: 'prdType', width: 150, editable: false },
  { headerName: '총수량', field: 'totalQty', width: 110, editable: false, valueParser: numParser },
  { headerName: '작업자', field: 'writer', width: 120, editable: false },
  { headerName: '생산완료일자', field: 'finished_at', width: 140, editable: false },
  { headerName: '검사완료일자', field: 'certDate', width: 140, editable: false }
]);

function numParser(p) {
  const v = Number(String(p.newValue).replace(/,/g, '').trim());
  return Number.isFinite(v) ? v : p.oldValue;
}

const detailGridOptions = ref({
  defaultColDef: { resizable: true, minWidth: 110 },
  autoSizeStrategy: { type: 'fitGridWidth' }
});

// 각종버튼
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
}

async function saveForm() {
  const d = detailRows.value[0];
  const isPass = finalStatus.value === '합격';

  if (!isPass && !defectReason.value.description.trim()) {
    alert('불합격 사유를 입력해주세요.');
    return;
  }

  // 1) 화면의 행들 → 결과배열로 변환
  const api = criteriaApi.value;
  const results = [];
  api.forEachNode((node) => {
    const r = node.data; // {label, allow, value}
    results.push({
      stdName: r.label, // QUALITY_STANDARD.STD_NAME에 매칭할 값
      allowedItem: r.label, // 결과 표시용(원하면 allow 사용)
      measuredValue: String(r.value ?? ''),
      status: node.isSelected() ? '합격' : '불합격'
    });
  });

  // 2) 헤더 + 결과 같이 전송
  await axios.post('http://localhost:3000/passprd', {
    TP_ID: d.tpId || Number(route.query.wo_no || 0),
    PRD_CODE: d.prdCode,
    PRD_NAME: d.prdName,
    PRD_TYPE: d.prdType,
    TOTAL_QTY: Number(d.totalQty) || 0,
    Q_CHECKED_DATE: d.certDate,
    CREATED_BY: d.writer
    // PRD_STATUS 보내지 않음 (SQL에서 '합격')
    // Q_STD_ID 모르면 안 보냄 (SQL에서 NULL)
  });

  alert('등록되었습니다!');
}

// 불합격 사유 관련 데이터
const defectReason = ref({
  description: ''
});

// 클릭한 행의 내용가져오기
onMounted(() => {
  const r = detailRows.value[0];
  r.tpId = Number(route.query.wo_no || 0); // 지시번호 저장하고
  r.prdCode = String(route.query.product_code || '');
  r.prdName = String(route.query.product_name || '');
  r.prdType = String(route.query.product_type || '');
  r.totalQty = Number(route.query.qty || 0);
  r.writer = String(route.query.writer || '');
  r.finished_at = String(route.query.finished_at || '');
  r.certDate = new Date().toISOString().slice(0, 10);
});
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
