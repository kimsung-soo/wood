<!-- src/views/production/ProductionPlan.vue -->
<template>
  <BaseBreadcrumb :title="pageMeta.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <div class="card-headline only-right">
      <h5 class="title">생산계획 등록</h5>
      <div class="right-actions">
        <v-btn color="warning" @click="openOrderDialog">주문서 조회</v-btn>
      </div>
    </div>

    <!-- 기본 정보 -->
    <v-row class="mb-2">
      <v-col cols="4">
        <v-text-field label="계획번호" v-model="form.issueNumber" readonly dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="계획명" v-model="form.orderDate" dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="작성자" v-model="form.contact" dense outlined />
      </v-col>

      <v-col cols="4">
        <v-text-field label="주문번호" v-model="form.orderNo" readonly dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="작성일자" v-model="form.dueDate" type="date" dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="납기일자" v-model="form.dueDate2" type="date" dense outlined />
      </v-col>

      <v-col cols="4">
        <v-text-field label="총 수량" v-model.number="form.targetQty" type="number" dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="제품코드" v-model="form.productCode" readonly dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="제품명칭" v-model="form.productName" readonly dense outlined />
      </v-col>

      <v-col cols="12">
        <v-textarea label="비고" v-model.trim="form.memo" rows="2" auto-grow dense variant="outlined" class="text-right" />
      </v-col>
    </v-row>

    <div class="center-actions-under-note">
      <v-btn variant="flat" color="error" @click="resetPlan">초기화</v-btn>
      <v-btn color="primary" @click="savePlan">생산계획 등록</v-btn>
    </div>

    <!-- 제품목록 -->
    <section class="pane mt-4">
      <div class="pane-head">
        <h5 class="pane-title">제품목록</h5>
        <div class="pane-action">
          <v-text-field
            v-model.trim="productKeyword"
            placeholder="제품코드/명 검색"
            hide-details
            density="compact"
            variant="outlined"
            class="search-input-right"
            @keyup.enter="fetchProducts"
          />
          <v-btn color="primary" class="ml-2" @click="applySelectedProduct">제품 등록</v-btn>
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
        :rowMultiSelectWithClick="false"
        @grid-ready="onProductGridReady"
        @first-data-rendered="sizeFitProduct"
        @grid-size-changed="sizeFitProduct"
      />

      <div class="table-footline">
        <v-chip v-if="lockedType" size="small" color="primary" variant="tonal"> 선택 고정 유형: {{ lockedType }} </v-chip>
      </div>
    </section>

    <!-- 주문서 모달 -->
    <v-dialog v-model="orderDialog" width="90vw">
      <v-card class="plan-card">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>주문서 목록</span>
          <v-text-field
            v-model.trim="orderKeyword"
            placeholder="주문번호/업체/제품명 검색"
            hide-details
            density="compact"
            variant="outlined"
            style="width: 320px"
            @keyup.enter="fetchOrders"
          />
        </v-card-title>

        <v-card-text class="dialog-body">
          <ag-grid-vue
            class="ag-theme-quartz ag-no-wrap"
            :rowData="pagedOrders"
            :columnDefs="orderColDefs"
            :pagination="true"
            :paginationPageSize="ORDER_PAGE_SIZE"
            :rowSelection="'multiple'"
            :rowMultiSelectWithClick="true"
            :suppressRowClickSelection="true"
            :domLayout="'autoHeight'"
            @grid-ready="onOrderGridReady"
            @selection-changed="onOrderSelectionChanged"
          />
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="flat" color="darkText" @click="orderDialog = false">닫기</v-btn>
          <v-btn variant="flat" color="success" @click="applyOrders">적용</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.open" :color="snack.color" :timeout="2000">
      {{ snack.msg }}
    </v-snackbar>
  </UiParentCard>
</template>

<script setup>
import { ref, computed, shallowRef, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';

const API = 'http://localhost:3000';

/* 헤더 */
const pageMeta = ref({ title: '생산계획 관리' });
const breadcrumbs = shallowRef([
  { title: '생산', disabled: true, href: '#' },
  { title: '생산계획 관리', disabled: false, href: '#' }
]);

/* 폼 */
const form = ref({
  issueNumber: '',
  orderDate: '',
  contact: '',
  orderNo: '',
  productCode: '',
  dueDate: '',
  dueDate2: '',
  targetQty: 0,
  productName: '',
  memo: '',
  productType: ''
});

function genPlanNo() {
  const d = new Date();
  return `PL-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
}

onMounted(() => {
  form.value.issueNumber = genPlanNo();
  fetchProducts().catch(() => {});
});

/* ===== 제품 리스트(API) ===== */
const products = ref([]);
const productKeyword = ref('');
const PROD_PAGE_SIZE = 5;

async function fetchProducts() {
  try {
    const { data } = await axios.get(`${API}/products`, { params: { kw: productKeyword.value, page: 1, size: 50 } });
    products.value = Array.isArray(data?.rows) ? data.rows : [];
  } catch (e) {
    console.error(e);
    toast('제품 조회 오류', 'error');
  }
}

const lockedType = computed(() => form.value.productType || null);
const filteredProducts = computed(() => {
  const kw = productKeyword.value.trim().toLowerCase();
  return products.value
    .filter((p) => !lockedType.value || p.type === lockedType.value)
    .filter((p) => !kw || p.code.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw));
});
const pagedProducts = computed(() => filteredProducts.value);

/* ag-Grid 공통 셀 옵션 */
const textCell = {
  cellStyle: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tooltipValueGetter: (p) => p.value
};
const numRight = {
  ...textCell,
  cellClass: 'ag-right-aligned-cell',
  valueFormatter: (p) => (p.value == null ? '' : String(p.value))
};

/* 제품 컬럼 */
const productColDefs = [
  { headerName: '제품코드', field: 'code', flex: 1.1, minWidth: 120, ...textCell },
  { headerName: '제품명칭', field: 'name', flex: 1.6, minWidth: 140, ...textCell },
  { headerName: '유형', field: 'type', flex: 0.8, minWidth: 90, ...textCell },
  { headerName: '단위', field: 'uom', flex: 0.6, minWidth: 70, ...textCell },
  { headerName: '규격', field: 'spec', flex: 1.2, minWidth: 120, ...textCell },
  { headerName: '현재고', field: 'stock', flex: 0.7, minWidth: 80, ...numRight }
];

/* 제품 그리드 API */
let productApi;
function onProductGridReady(e) {
  productApi = e.api;
  sizeFitProduct();
}
function sizeFit(api) {
  if (api) api.sizeColumnsToFit();
}
function sizeFitProduct() {
  sizeFit(productApi);
}

/* 제품 등록 버튼 */
function applySelectedProduct() {
  if (!productApi) return toast('그리드 준비중입니다.', 'error');
  const rows = productApi.getSelectedRows?.() ?? [];
  if (!rows.length) return toast('등록할 제품을 선택하세요.', 'error');

  const p = rows[0];
  if (!form.value.productType) form.value.productType = p.type;
  if (form.value.productType !== p.type) {
    return toast(`선택 가능한 유형은 '${form.value.productType}' 입니다.`, 'error');
  }
  form.value.productCode = p.code;
  form.value.productName = p.name;
  toast('제품이 계획서에 등록되었습니다.');
}

/* ===== 주문서 모달(API) ===== */
const orderDialog = ref(false);
const orderKeyword = ref('');
const ORDER_PAGE_SIZE = 10;
const orders = ref([]);
const selectedOrderIds = ref([]); // ✅ 추가

async function fetchOrders() {
  try {
    const { data } = await axios.get(`${API}/reqSelect`);
    orders.value = Array.isArray(data) ? data.map((r) => ({ ...r, REQ_QTY: Number(r.REQ_QTY) })) : [];
  } catch (e) {
    console.error(e);
    toast('주문서 조회 오류', 'error');
  }
}

const filteredOrders = computed(() => {
  const kw = orderKeyword.value.trim().toLowerCase();
  if (!kw) return orders.value;
  return orders.value.filter(
    (r) =>
      String(r.REQ_ID).toLowerCase().includes(kw) ||
      String(r.CUS_NAME).toLowerCase().includes(kw) ||
      String(r.PRD_NAME).toLowerCase().includes(kw)
  );
});
const pagedOrders = computed(() => filteredOrders.value);

/* 주문서 컬럼: 제품유형 추가 + 주문수량 표기 */
const orderColDefs = [
  { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 70 },
  { headerName: '주문일자', field: 'REQ_DATE', minWidth: 120, ...textCell },
  { headerName: '주문번호', field: 'REQ_ID', minWidth: 120, ...textCell },
  { headerName: '업체명', field: 'CUS_NAME', minWidth: 120, flex: 1, ...textCell },
  { headerName: '제품코드', field: 'PRD_CODE', minWidth: 110, ...textCell },
  { headerName: '제품명', field: 'PRD_NAME', minWidth: 140, flex: 1, ...textCell },
  { headerName: '제품유형', field: 'PRODUCT_TYPE', width: 100, ...textCell },
  { headerName: '주문수량', field: 'REQ_QTY', width: 100, ...numRight },
  { headerName: '납기일자', field: 'REQ_DDAY', minWidth: 120, ...textCell },
  { headerName: '주문상태', field: 'REQ_STATUS', width: 100, ...textCell }
];

let orderApi;
function onOrderGridReady(e) {
  orderApi = e.api;
  orderApi.sizeColumnsToFit?.();
}

/* 같은 제품(+유형이 있을 경우 동일)만 다중 선택 허용 */
function onOrderSelectionChanged(e) {
  const sel = e.api.getSelectedRows();
  if (sel.length <= 1) return;
  const f = sel[0];
  for (const row of sel.slice(1)) {
    const sameCode = row.PRD_CODE === f.PRD_CODE;
    const sameType = (row.PRODUCT_TYPE ?? '') === (f.PRODUCT_TYPE ?? '');
    if (!sameCode || (f.PRODUCT_TYPE && !sameType)) {
      e.api.forEachNode((node) => {
        if (node.isSelected() && (node.data.PRD_CODE !== f.PRD_CODE || (f.PRODUCT_TYPE && node.data.PRODUCT_TYPE !== f.PRODUCT_TYPE))) {
          node.setSelected(false);
        }
      });
      toast('같은 제품(유형)만 복수 선택 가능합니다.', 'error');
      break;
    }
  }
}

function openOrderDialog() {
  orderKeyword.value = '';
  orderDialog.value = true;
  setTimeout(() => orderApi?.deselectAll?.(), 0);
  fetchOrders();
}

function applyOrders() {
  if (!orderApi) return toast('그리드 준비중입니다.', 'error');
  const selected = orderApi.getSelectedRows?.() ?? [];
  if (!selected.length) return toast('선택된 주문서가 없습니다.', 'error');

  const first = selected[0];
  form.value.orderNo = first.REQ_ID;
  form.value.productCode = first.PRD_CODE;
  form.value.productName = first.PRD_NAME;
  if (first.PRODUCT_TYPE) form.value.productType = first.PRODUCT_TYPE;

  form.value.targetQty = selected.reduce((s, r) => s + Number(r.REQ_QTY || 0), 0);
  form.value.dueDate2 = [...selected.map((r) => r.REQ_DDAY)].sort()[0];
  selectedOrderIds.value = selected.map((r) => String(r.REQ_ID)); // ✅ 선택 REQ_ID 모음
  orderDialog.value = false;
  toast('주문서가 적용되었습니다.');
}

/* 저장 */
async function savePlan() {
  if (!form.value.issueNumber || !form.value.orderDate) return toast('계획번호/계획명을 입력하세요.', 'error');
  if (!form.value.productCode) return toast('제품을 등록하세요.', 'error');
  try {
    const { data } = await axios.post(`${API}/plans`, {
      form: form.value,
      linkedOrderIds: selectedOrderIds.value // ✅ 함께 전송
    });
    if (data?.ok) {
      toast('저장되었습니다.');
      await fetchPlanList();
    } else {
      toast('저장 실패', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('저장 중 오류', 'error');
  }
}

async function fetchPlanList() {
  try {
    const { data } = await axios.get(`${API}/plans`, { params: { kw: '', page: 1, size: 20 } });
    if (data?.ok) console.log('생산계획 목록', data.rows);
  } catch (e) {
    console.error(e);
  }
}

/* 초기화 */
function resetPlan() {
  const keepNo = genPlanNo();
  form.value = {
    issueNumber: keepNo,
    orderDate: '',
    contact: '',
    orderNo: '',
    productCode: '',
    dueDate: '',
    dueDate2: '',
    targetQty: 0,
    productName: '',
    memo: '',
    productType: ''
  };
  productApi?.deselectAll?.();
  orderApi?.deselectAll?.();
  toast('초기화되었습니다.');
  selectedOrderIds.value = [];
}

const snack = ref({ open: false, msg: '', color: 'primary' });
const toast = (msg, color = 'primary') => (snack.value = { open: true, msg, color });
</script>

<style scoped>
.card-headline.only-right {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  margin-bottom: 8px;
}
.title {
  margin: 0;
  font-weight: 700;
}
.right-actions {
  justify-self: end;
}
.center-actions-under-note {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 6px 0 10px;
}
.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  margin-bottom: 0.5rem;
}
.pane-title {
  margin: 0;
}
.pane-action {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.search-input-right {
  width: 420px;
  max-width: 420px;
  min-width: 300px;
}
.table-footline {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
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
.text-right {
  text-align: right;
}
.ml-2 {
  margin-left: 8px;
}
.mt-4 {
  margin-top: 1rem;
}
</style>
