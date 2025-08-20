<!-- src/views/production/WorkOrder.vue -->
<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <div class="card-headline">
      <h5 class="title">작업지시 등록</h5>
      <v-btn color="warning" @click="openPlanDialog">계획서 조회</v-btn>
    </div>

    <!-- 상단 기본정보 -->
    <v-row class="mb-2">
      <v-col cols="4">
        <v-text-field label="지시번호" v-model="form.issueNumber" readonly dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="지시일자" v-model="form.orderDate" type="date" dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="작성자" v-model="form.contact" dense outlined />
      </v-col>

      <v-col cols="4">
        <v-text-field label="제품코드" v-model="form.productCode" readonly dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="납기일자" v-model="form.dueDate" type="date" dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="목표수량" v-model.number="form.targetQty" type="number" min="1" step="1" dense outlined />
      </v-col>

      <v-col cols="4">
        <v-text-field label="제품명칭" v-model="form.productName" readonly dense outlined />
      </v-col>
      <v-col cols="8">
        <v-text-field label="지시명(계획명)" v-model.trim="form.orderName" dense outlined />
      </v-col>

      <v-col cols="12">
        <v-textarea label="비고" v-model.trim="form.memo" rows="2" auto-grow dense variant="outlined" class="text-right" />
      </v-col>
    </v-row>

    <div class="center-actions-under-form">
      <v-btn variant="flat" color="error" @click="resetForm">초기화</v-btn>
      <v-btn color="primary" @click="submitForm">작업지시 등록</v-btn>
    </div>

    <div class="main-2col">
      <!-- 좌: 제품목록 -->
      <section class="pane">
        <div class="pane-head">
          <h5 class="pane-title">제품목록</h5>
          <div class="pane-action">
            <v-text-field
              v-model.trim="productKeyword"
              placeholder="제품코드/명 검색"
              hide-details
              density="compact"
              variant="outlined"
              style="max-width: 420px; min-width: 360px; width: 100%"
              @keyup.enter="doProductSearch"
            />
          </div>
        </div>

        <ag-grid-vue
          class="ag-theme-quartz ag-no-wrap"
          :rowData="pagedProducts"
          :columnDefs="productColDefs"
          :pagination="true"
          :paginationPageSize="PROD_PAGE_SIZE"
          :suppressPaginationPanel="false"
          :domLayout="'autoHeight'"
          :rowSelection="'single'"
          @grid-ready="onProductGridReady"
          @first-data-rendered="sizeFitProduct"
          @grid-size-changed="sizeFitProduct"
          @row-selected="onProductSelected"
        />
      </section>

      <!-- 우: 자재현황/BOM (조회 전용) -->
      <section class="pane right-pane">
        <div class="pane-head">
          <h5 class="pane-title">자재현황</h5>
        </div>
        <ag-grid-vue
          class="ag-theme-quartz ag-no-wrap"
          :rowData="pagedWip"
          :columnDefs="wipColDefs"
          :pagination="true"
          :paginationPageSize="SUB_PAGE_SIZE"
          :suppressPaginationPanel="false"
          :domLayout="'autoHeight'"
          @grid-ready="onWipGridReady"
          @first-data-rendered="sizeFitWip"
          @grid-size-changed="sizeFitWip"
        />

        <div class="pane-head mt-6">
          <h5 class="pane-title">BOM목록</h5>
        </div>
        <ag-grid-vue
          class="ag-theme-quartz ag-no-wrap bom-grid"
          :rowData="pagedBom"
          :columnDefs="bomColDefs"
          :pagination="true"
          :paginationPageSize="SUB_PAGE_SIZE"
          :suppressPaginationPanel="false"
          :domLayout="'autoHeight'"
          @grid-ready="onBomGridReady"
          @first-data-rendered="sizeFitBom"
          @grid-size-changed="sizeFitBom"
        />
      </section>
    </div>
  </UiParentCard>

  <!-- 계획서 모달 -->
  <v-dialog v-model="planDialog" width="90vw">
    <v-card class="plan-card">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>계획서 목록</span>
        <v-text-field
          v-model.trim="planKeyword"
          placeholder="계획번호/제품코드/제품명 검색"
          hide-details
          density="compact"
          variant="outlined"
          style="width: 320px"
          @keyup.enter="doPlanSearch"
        />
      </v-card-title>
      <v-card-text class="dialog-body">
        <ag-grid-vue
          class="ag-theme-quartz ag-no-wrap"
          :rowData="pagedPlans"
          :columnDefs="planColDefs"
          :pagination="true"
          :paginationPageSize="PLAN_PAGE_SIZE"
          :rowSelection="'multiple'"
          :rowMultiSelectWithClick="true"
          :suppressRowClickSelection="true"
          :domLayout="'autoHeight'"
          @grid-ready="onPlanGridReady"
          @first-data-rendered="sizeFitPlan"
          @grid-size-changed="sizeFitPlan"
          @selection-changed="onPlanSelectionChanged"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="flat" color="darkText" @click="planDialog = false">닫기</v-btn>
        <v-btn variant="flat" color="success" @click="applyPlans">등록</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snack.open" :color="snack.color" :timeout="2000">
    {{ snack.msg }}
  </v-snackbar>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';

const API = 'http://localhost:3000';

/* 페이지 타이틀/브레드크럼 */
const page = ref({ title: '작업지시 관리' });
const breadcrumbs = shallowRef([
  { title: '생산', disabled: true, href: '#' },
  { title: '작업지시 관리', disabled: false, href: '#' }
]);

/* 토스트 */
const snack = ref({ open: false, msg: '', color: 'primary' });
const toast = (msg, color = 'primary') => (snack.value = { open: true, msg, color });

/* 폼 */
const form = reactive({
  issueNumber: '',
  orderDate: '',
  contact: '',
  productCode: '',
  productName: '',
  dueDate: '',
  targetQty: 10,
  orderName: '',
  memo: ''
});
function genIssueNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `WO-${y}${m}${day}-${rnd}`;
}
onMounted(() => {
  if (!form.issueNumber) form.issueNumber = genIssueNo();
  if (!form.orderDate) form.orderDate = new Date().toISOString().slice(0, 10);
  fetchProducts();
});

/* ───────── 제품 목록 (PRODUCT) ───────── */
const products = ref([]);
const productKeyword = ref('');
const PROD_PAGE_SIZE = 10;

async function fetchProducts() {
  try {
    const { data } = await axios.get(`${API}/products`, { params: { kw: productKeyword.value, page: 1, size: 100 } });
    if (data?.ok) products.value = data.rows || [];
  } catch (e) {
    console.error(e);
    toast('제품 조회 오류', 'error');
  }
}
const filteredProducts = computed(() => {
  const kw = productKeyword.value.trim().toLowerCase();
  if (!kw) return products.value;
  return products.value.filter((p) => p.code.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw));
});
const pagedProducts = computed(() => filteredProducts.value);
function doProductSearch() {
  fetchProducts();
}

/* ───────── BOM / WIP ───────── */
const wipRows = ref([]); // 재공(WIP) 향후 연동용
const SUB_PAGE_SIZE = 3;
const pagedWip = computed(() => wipRows.value);

const bomHeader = ref(null);
const bomRows = ref([]);
const pagedBom = computed(() => bomRows.value);

async function fetchBom(productCode) {
  bomHeader.value = null;
  bomRows.value = [];
  if (!productCode) return;
  try {
    const { data } = await axios.get(`${API}/boms`, { params: { productCode } });
    if (data?.ok) {
      bomHeader.value = data.header || null;
      bomRows.value = (data.items || []).map((r) => ({
        seq: r.seq,
        matCode: r.matCode,
        matName: r.matName,
        matType: r.matType,
        qty: r.qty,
        unit: r.unit
      }));
    }
  } catch (e) {
    console.error(e);
    toast('BOM 조회 오류', 'error');
  }
}

/* ───────── 계획서 모달 ───────── */
const planDialog = ref(false);
const planKeyword = ref('');
const PLAN_PAGE_SIZE = 10;
const plans = ref([]);

async function fetchPlans() {
  try {
    const kw = planKeyword.value.trim();
    const { data } = await axios.get(`${API}/plans`, { params: { kw, page: 1, size: 200 } });
    if (data?.ok) plans.value = data.rows || [];
    else toast('계획서 조회 실패', 'error');
  } catch (e) {
    console.error(e);
    toast('계획서 조회 오류', 'error');
  }
}
function doPlanSearch() {
  fetchPlans();
}
function openPlanDialog() {
  planKeyword.value = '';
  planDialog.value = true;
  fetchPlans();
}
const filteredPlans = computed(() => {
  const kw = planKeyword.value.trim().toLowerCase();
  if (!kw) return plans.value;
  return plans.value.filter(
    (r) => r.planNo.toLowerCase().includes(kw) || r.productCode.toLowerCase().includes(kw) || r.productName.toLowerCase().includes(kw)
  );
});
const pagedPlans = computed(() => filteredPlans.value);
const checkedPlanIds = ref([]);

function onPlanSelectionChanged(e) {
  const selected = e.api.getSelectedRows();
  if (selected.length === 0) {
    checkedPlanIds.value = [];
    return;
  }
  const first = selected[0];
  const invalid = selected.filter((r) => r.productCode !== first.productCode || r.productType !== first.productType);
  if (invalid.length) {
    e.api.forEachNode((node) => {
      if (node.isSelected() && (node.data.productCode !== first.productCode || node.data.productType !== first.productType)) {
        node.setSelected(false);
      }
    });
    toast('같은 제품/유형만 복수 선택 가능합니다.', 'error');
  }
  checkedPlanIds.value = e.api.getSelectedRows().map((r) => r.id);
}
function applyPlans() {
  if (!checkedPlanIds.value.length) {
    toast('계획서를 선택하세요.', 'error');
    return;
  }
  const rows = plans.value.filter((r) => checkedPlanIds.value.includes(r.id));
  const p = rows[0];
  form.productCode = p.productCode;
  form.productName = p.productName;
  form.dueDate = rows.map((r) => r.dueDate).sort()[0];
  form.targetQty = rows.reduce((s, r) => s + Number(r.totalQty || 0), 0);
  const names = rows.map((r) => r.planName).filter(Boolean);
  form.orderName = names.join(', ').slice(0, 200);
  planDialog.value = false;

  // 제품 확정 시 BOM 즉시 로드
  fetchBom(form.productCode);
}

/* ───────── 제품 선택 바인딩 ───────── */
function onProductSelected(e) {
  const row = (e.api.getSelectedRows?.() ?? [])[0];
  if (!row?.code) return;
  form.productCode = row.code;
  form.productName = row.name;
  fetchBom(form.productCode); // BOM 로딩
}

/* ───────── 저장 ───────── */
async function submitForm() {
  if (!form.issueNumber) form.issueNumber = genIssueNo();
  if (!form.orderDate || !form.productCode || !form.productName || !form.dueDate || !form.contact?.trim()) {
    toast('필수 항목이 비어있습니다. (지시일자, 제품, 납기일자, 작성자)', 'error');
    return;
  }
  if (!form.targetQty || form.targetQty <= 0) {
    toast('목표수량을 1 이상으로 입력하세요.', 'error');
    return;
  }

  try {
    const payload = {
      form: {
        issueNumber: form.issueNumber,
        orderDate: form.orderDate,
        writer: form.contact,
        contact: form.contact,
        productCode: form.productCode,
        productName: form.productName,
        dueDate: form.dueDate,
        targetQty: Number(form.targetQty || 0),
        orderName: form.orderName || null,
        memo: form.memo || ''
      },
      selectedPlanIds: checkedPlanIds.value
    };
    const { data } = await axios.post(`${API}/workorders`, payload);
    if (data?.ok) {
      toast(`작업지시 저장 완료 (ID: ${data.woId}, NO: ${data.woNo})`, 'success');
      resetForm();
    } else {
      toast('저장 실패', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('저장 중 오류', 'error');
  }
}
function resetForm() {
  form.issueNumber = genIssueNo();
  form.orderDate = new Date().toISOString().slice(0, 10);
  form.contact = '';
  form.productCode = '';
  form.productName = '';
  form.dueDate = '';
  form.targetQty = 10;
  form.orderName = '';
  form.memo = '';
  checkedPlanIds.value = [];
  bomHeader.value = null;
  bomRows.value = [];
}

/* ───────── 공통 그리드 설정 ───────── */
const textCell = {
  cellStyle: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tooltipValueGetter: (p) => p.value
};
const numRight = { ...textCell, cellClass: 'ag-right-aligned-cell', valueFormatter: (p) => (p.value == null ? '' : String(p.value)) };

const productColDefs = [
  { headerName: '제품코드', field: 'code', flex: 1.2, minWidth: 120, ...textCell },
  { headerName: '제품명', field: 'name', flex: 1.8, minWidth: 160, ...textCell },
  { headerName: '유형', field: 'type', flex: 0.8, minWidth: 90, ...textCell },
  { headerName: '단위', field: 'uom', flex: 0.6, minWidth: 70, ...textCell },
  { headerName: '규격', field: 'spec', flex: 1.2, minWidth: 120, ...textCell }
];

const wipColDefs = [
  { headerName: '원자재유형', field: 'type', flex: 1.2, minWidth: 120, ...textCell },
  { headerName: '수량', field: 'qty', flex: 0.6, minWidth: 80, ...numRight },
  { headerName: '규격', field: 'spec', flex: 1.2, minWidth: 120, ...textCell }
];

/* ✅ BOM 컬럼: 자재코드/자재명/자재유형/소요수량/단위 */
const bomColDefs = [
  { headerName: '자재코드', field: 'matCode', flex: 1.1, minWidth: 110, ...textCell },
  { headerName: '자재명', field: 'matName', flex: 1.2, minWidth: 110, ...textCell },
  { headerName: '자재유형', field: 'matType', flex: 0.9, minWidth: 90, ...textCell },
  { headerName: '소요수량', field: 'qty', flex: 0.8, minWidth: 90, ...numRight },
  { headerName: '단위', field: 'unit', flex: 0.7, minWidth: 80, ...textCell }
];

const planColDefs = [
  { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 70 },
  { headerName: '순번', valueGetter: 'node.rowIndex + 1', width: 80, ...numRight },
  { headerName: '계획번호', field: 'planNo', minWidth: 140, flex: 1, ...textCell },
  { headerName: '계획명', field: 'planName', minWidth: 140, flex: 1, ...textCell },
  { headerName: '주문코드', field: 'orderNo', minWidth: 120, ...textCell },
  { headerName: '제품코드', field: 'productCode', minWidth: 120, ...textCell },
  { headerName: '제품명', field: 'productName', minWidth: 140, flex: 1, ...textCell },
  { headerName: '유형', field: 'productType', width: 100, ...textCell },
  { headerName: '작성일자', field: 'createdDate', minWidth: 120, ...textCell },
  { headerName: '작성자', field: 'writer', width: 100, ...textCell },
  { headerName: '총수량', field: 'totalQty', width: 110, ...numRight },
  { headerName: '납기일자', field: 'dueDate', minWidth: 120, ...textCell }
];

/* sizeToFit */
let productApi, wipApi, bomApi, planApi;
function sizeFit(api) {
  if (api) api.sizeColumnsToFit();
}
function onProductGridReady(e) {
  productApi = e.api;
  sizeFitProduct();
}
function onWipGridReady(e) {
  wipApi = e.api;
  sizeFitWip();
}
function onBomGridReady(e) {
  bomApi = e.api;
  sizeFitBom();
}
function onPlanGridReady(e) {
  planApi = e.api;
  sizeFitPlan();
}
function sizeFitProduct() {
  sizeFit(productApi);
}
function sizeFitWip() {
  sizeFit(wipApi);
}
function sizeFitBom() {
  sizeFit(bomApi);
}
function sizeFitPlan() {
  sizeFit(planApi);
}
</script>

<style scoped>
.card-headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.card-headline .title {
  margin: 0;
  font-weight: 600;
}
.center-actions-under-form {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 6px 0 14px;
}
.main-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.pane {
  width: 100%;
}
.right-pane {
  justify-self: end;
}
.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.pane-title {
  margin: 0;
}
.mt-6 {
  margin-top: 1.5rem;
}
.ag-no-wrap .ag-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ag-theme-quartz {
  --ag-font-size: 12px;
  --ag-grid-size: 4px;
}
.plan-card .dialog-body {
  max-height: 80vh;
  overflow: auto;
}
</style>
