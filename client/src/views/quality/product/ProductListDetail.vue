<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <UiParentCard>
    <!-- 1. 선택한 행의 검사성적서 -->
    <v-row cols="auto">
      <v-col>
        <v-btn color="warning" class="btn-pdf" @click="onPrint">PDF출력</v-btn>
      </v-col>
    </v-row>
    <br />
    <!-- 상단 요약(기존 그대로) -->
    <ag-grid-vue
      :rowData="detailRows"
      :columnDefs="detailCols"
      :gridOptions="gridOptions"
      :theme="quartz"
      style="height: 160px; width: 100%"
    />
    <br />
    <!-- 2. 합격품 성적서 -> ag-Grid로 변경 (검사명 / 허용수치 / 수치값) -->
    <div class="section-title">
      <h3>합격품 성적서</h3>
    </div>

    <ag-grid-vue
      :rowData="specRows"
      :columnDefs="qcStdColDef"
      :gridOptions="gridOptions"
      :theme="quartz"
      style="height: 260px; width: 100%"
    />
  </UiParentCard>
</template>

<script setup>
import axios from 'axios';
import { useRoute } from 'vue-router';
import { ref, shallowRef, onMounted } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;
const route = useRoute();

// 페이지 타이틀
const page = ref({ title: '선택한 행의 검사성적서' });
const breadcrumbs = shallowRef([
  { title: '품질', disabled: true, href: '#' },
  { title: '원자재검수조회', disabled: false, href: '#' }
]);

/* 상단 단건 표시용 데이터
   - 3번 그리드를 없앴으므로, 헤더용으로 한 건만 유지
   - 실제로는 API 응답으로 바꿔 끼우면 됨 */
const rowData = ref([
  {
    certId: '',
    prdCode: '',
    prdName: '',
    chkedDate: '',
    totalQty: 0,
    prdType: '',
    writer: ''
  }
]);

const detailCols = ref([
  { headerName: '검사번호', field: 'certId', flex: 1, resizable: true, suppressSizeToFit: true, editable: false },
  { headerName: '제품코드', field: 'prdCode', flex: 1, resizable: true, suppressSizeToFit: true, editable: false },
  { headerName: '제품명', field: 'prdName', flex: 1, resizable: true, suppressSizeToFit: true, editable: false },
  { headerName: '제품유형', field: 'prdType', flex: 1, resizable: true, suppressSizeToFit: true, editable: true },
  { headerName: '총수량', field: 'totalQty', flex: 1, resizable: true, suppressSizeToFit: true, editable: true, valueParser: numParser },
  { headerName: '작성자', field: 'writer', flex: 1, resizable: true, suppressSizeToFit: true, editable: true },
  { headerName: '검사완료일자', field: 'finished_at', flex: 1, resizable: true, suppressSizeToFit: true, editable: true }
]);

const detailRows = ref([
  {
    certId: '(자동생성)',
    prdCode: '(자동입력)',
    prdName: '(자동입력)',
    prdType: '(자동입력)',
    totalQty: '(세션사용자)',
    writer: '(자동입력)',
    finished_at: '(현재 yyyyMMdd)'
  }
]);

/* ---- [섹션 1] 상단 ag-Grid (기존 컬럼 유지) ---- */
function numParser(params) {
  const v = params.newValue;
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : params.oldValue;
}

/* ---- [섹션 2] 성적서 그리드 (신규) ----
   요구 컬럼: 검사명(=검사기준), 허용수치, 수치값(실측) */
const qcStdColDef = ref([
  { headerName: '검사명', field: 'name', flex: 1.2, cellClass: 'font-semibold' },
  { headerName: '허용수치', field: 'allowed', flex: 1.4, wrapText: true, autoHeight: true },
  { headerName: '수치값', field: 'value', flex: 1 }
]);

const qcStdRowData = ref([]);

// 품질기준 데이터 가져오기
const getQStandardList = async () => {
  try {
    const url = 'http://localhost:3000/qstdlist';
    const result = await axios.get(url);

    if (result.data && result.data.length > 0) {
      qcStdRowData.value = result.data.map((item) => ({
        stdName: item.STD_NAME,
        allowedValue: item.ALLOWED_VALUE,
        val1: item.MEASURED_VALUE
      }));
    } else {
      qcStdRowData.value = [];
    }
  } catch (err) {
    console.error('데이터 조회 중 오류:', err);
    qcStdRowData.value = [];
  }
};
// 표시용 행
const specRows = ref([]);

onMounted(() => {
  getQStandardList();
});

const gridOptions = ref({
  defaultColDef: { resizable: true, sortable: true },
  pagination: true,
  paginationAutoPageSize: true
});

/* PDF 출력(기존) */
const onPrint = () => window.print();

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
</script>

<style scoped>
.report-page {
  padding: 16px;
  color: #333;
  background: #fafafa;
}

/* 상단 PDF 버튼 */
.top-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.btn-pdf {
  background: #f05945;
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
}
.btn-pdf:hover {
  opacity: 0.92;
}

/* 섹션 공통 */
.section {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.section-title {
  display: flex;
  align-items: center;
  font-weight: 700;
  margin-bottom: 10px;
  gap: 10px;
}

/* 상단 단건 정보 테이블 */
.kv-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.kv-table thead th,
.kv-table tbody td {
  border: 1px solid #ddd;
  padding: 10px;
  font-size: 14px;
}
.kv-table thead th {
  background: #f5f5f7;
}
.kv-table .empty {
  text-align: center;
  color: #888;
}

/* 인쇄 최적화 */
@media print {
  .top-actions {
    display: none;
  }
  .section {
    box-shadow: none;
    border: 1px solid #bbb;
  }
  .btn-pdf {
    display: none;
  }
  .report-page {
    background: #fff;
    padding: 0;
  }
}
</style>
