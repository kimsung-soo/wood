<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <!-- 1. 선택한 행의 검사성적서 -->
  <section class="section">
    <!-- 우측 상단 PDF 버튼 -->
    <div class="top-actions">
      <button class="btn-pdf" @click="onPrint">PDF출력</button>
    </div>
    <table class="kv-table">
      <thead>
        <tr>
          <th>검사번호</th>
          <th>제품코드</th>
          <th>제품명</th>
          <th>검사완료일자</th>
          <th>총수량</th>
          <th>제품유형</th>
          <th>작성자</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="selected">
          <td>{{ selected.certId }}</td>
          <td>{{ selected.prdCode }}</td>
          <td>{{ selected.prdName }}</td>
          <td>{{ selected.chkedDate }}</td>
          <td>{{ selected.totalQty }}</td>
          <td>{{ selected.prdType }}</td>
          <td>{{ selected.writer }}</td>
        </tr>
        <tr v-else>
          <td colspan="7" class="empty">행을 선택하세요.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- 2. 합격품 성적서 -->
  <section class="section">
    <div class="section-title">
      <span>합격품 성적서</span>
    </div>

    <table class="spec-table">
      <thead>
        <tr>
          <th>검사기준</th>
          <th>허용수치</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>함수율</td>
          <td>수분 함량이 12 ~ 13% 이하</td>
        </tr>
        <tr>
          <td>외관결함</td>
          <td>입고자재에서 ± 2mm 이내</td>
        </tr>
        <tr>
          <td>치수정밀도</td>
          <td>횡강도 35MPa 이상</td>
        </tr>
        <tr>
          <td>강도</td>
          <td>전도 없음, 전기부 안전, 모서리 둥글림 위험요소 없음</td>
        </tr>
        <tr>
          <td>외관/표면 결함</td>
          <td>옹이, 훼절, 균열 유약확인 시 결함이 없을 시</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- 3. 불량품 목록 -->
  <section class="section">
    <div class="section-title">
      <span>불량품 목록</span>
    </div>

    <div class="grid-wrap">
      <ag-grid-vue
        :theme="quartz"
        style="height: 320px; width: 100%"
        :columnDefs="colDefs"
        :rowData="rowData"
        rowSelection="single"
        :gridOptions="gridOptions"
        @grid-ready="onGridReady"
        @selection-changed="onSelectionChanged"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, computed, shallowRef } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';

// ag-Grid 커뮤니티 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

// ag-Grid 테마
const quartz = themeQuartz;

// ----- 기존 breadcrumb -----
const page = ref({ title: '선택한 행의 검사성적서' });
const breadcrumbs = shallowRef([
  { title: '품질', disabled: true, href: '#' },
  { title: '원자재검수조회', disabled: false, href: '#' }
]);

// 불량품 목록(샘플 데이터)
const rowData = ref([
  {
    certId: 'MTRTST-A01',
    prdCode: 'COMPA001',
    prdName: '흰색학생책상',
    chkedDate: '2025-07-30',
    defectReason: '함수율 18',
    totalQty: 40,
    prdType: '완제품',
    writer: '사원1'
  },
  // 필요시 더미 데이터 추가
  {
    certId: 'MTRTST-A02',
    prdCode: 'COMPA002',
    prdName: '검은색학생책상',
    chkedDate: '2025-07-29',
    defectReason: '외관 긁힘',
    totalQty: 20,
    prdType: '반제품',
    writer: '사원2'
  }
]);

// 선택행 정보
const selectedRow = ref(null);
const selected = computed(() => selectedRow.value ?? rowData.value[0] ?? null);

// 그리드 컬럼
const colDefs = ref([
  { headerName: '검사번호', field: 'certId', flex: 1, pinned: false },
  { headerName: '제품코드', field: 'prdCode', flex: 1 },
  { headerName: '제품명', field: 'prdName', flex: 1.2 },
  { headerName: '검사완료일자', field: 'chkedDate', flex: 1 },
  { headerName: '불량품사유', field: 'defectReason', flex: 1.2 }
]);

// 그리드 옵션
const gridOptions = ref({
  defaultColDef: { resizable: true, sortable: true },
  pagination: true,
  paginationAutoPageSize: true
});

// ag-Grid API 보관
let gridApi = null;

const onGridReady = (e) => {
  gridApi = e.api;
  // 첫 행 자동 선택 → 상단 성적서에 바인딩
  setTimeout(() => {
    if (gridApi) {
      gridApi.ensureIndexVisible(0);
      gridApi.selectIndex(0);
    }
  });
};

const onSelectionChanged = () => {
  if (!gridApi) return;
  const sel = gridApi.getSelectedRows?.() ?? [];
  selectedRow.value = sel[0] || null;
};

// PDF(인쇄) 출력
const onPrint = () => {
  window.print();
};
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
.badge {
  background: #cf3f2f;
  color: #fff;
  border-radius: 6px;
  padding: 4px 8px;
  display: inline-block;
  min-width: 24px;
  text-align: center;
}

/* 상단 단건 정보 테이블 */
.kv-table,
.spec-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.kv-table thead th,
.kv-table tbody td,
.spec-table thead th,
.spec-table tbody td {
  border: 1px solid #ddd;
  padding: 10px;
  font-size: 14px;
}
.kv-table thead th {
  background: #f5f5f7;
}
.spec-table thead th {
  background: #f5f5f7;
}
.kv-table .empty {
  text-align: center;
  color: #888;
}

/* 그리드 래퍼 */
.grid-wrap {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
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
