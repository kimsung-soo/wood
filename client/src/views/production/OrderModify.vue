<!-- src/views/production/OrderModify.vue -->
<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <div class="card-headline">
      <h5 class="title">작업지시 수정/삭제</h5>
      <div class="head-actions">
        <v-btn class="ml-4" color="error" variant="elevated" @click="bulkDelete">삭제</v-btn>
      </div>
    </div>

    <!-- 검색 -->
    <v-row class="mb-4" dense>
      <v-col cols="3"
        ><v-text-field label="지시번호" v-model.trim="search.issueNumber" dense outlined hide-details @keyup.enter="applySearch"
      /></v-col>
      <v-col cols="3"
        ><v-text-field label="지시명" v-model.trim="search.orderName" dense outlined hide-details @keyup.enter="applySearch"
      /></v-col>
      <v-col cols="3"
        ><v-text-field label="제품코드" v-model.trim="search.productCode" dense outlined hide-details @keyup.enter="applySearch"
      /></v-col>
      <v-col cols="3"
        ><v-text-field label="작성자" v-model.trim="search.contact" dense outlined hide-details @keyup.enter="applySearch"
      /></v-col>
    </v-row>

    <v-row justify="center" class="mt-2 mb-4">
      <v-col cols="auto">
        <v-btn variant="flat" color="error" class="mx-2" @click="resetFilters">초기화</v-btn>
        <v-btn variant="flat" color="darkText" class="mx-2" @click="applySearch">검색</v-btn>
      </v-col>
    </v-row>

    <div class="grid-wrap">
      <ag-grid-vue
        class="ag-theme-quartz ag-no-wrap"
        :rowData="pagedOrders"
        :columnDefs="colDefs"
        :pagination="true"
        :paginationPageSize="PAGE_SIZE"
        rowSelection="multiple"
        :rowMultiSelectWithClick="true"
        :suppressRowClickSelection="true"
        :immutableData="true"
        :getRowId="getRowId"
        :rowBuffer="3"
        @grid-ready="onGridReady"
        @row-double-clicked="openEdit"
      />
    </div>

    <!-- 편집 모달 -->
    <v-dialog v-model="edit.open" max-width="760" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>작업지시 수정</span>
          <v-chip size="small" v-if="edit.dirty" color="warning" variant="tonal">변경됨</v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="6" md="4">
              <v-text-field label="지시번호" v-model="edit.form.issueNumber" readonly density="compact" variant="outlined" />
            </v-col>
            <v-col cols="6" md="8">
              <v-text-field
                label="지시명"
                v-model.lazy="edit.form.orderName"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-text-field
                label="지시일자"
                v-model.lazy="edit.form.orderDate"
                type="date"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>
            <v-col cols="6" md="4">
              <v-text-field
                label="작성자"
                v-model.lazy="edit.form.contact"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-text-field
                label="제품코드"
                v-model.lazy="edit.form.productCode"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>
            <v-col cols="6" md="8">
              <v-text-field
                label="제품명칭"
                v-model.lazy="edit.form.productName"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-text-field
                label="납기일자"
                v-model.lazy="edit.form.dueDate"
                type="date"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>
            <v-col cols="6" md="4">
              <v-text-field
                label="목표수량"
                v-model.number.lazy="edit.form.targetQty"
                type="number"
                min="1"
                step="1"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                label="비고"
                v-model.lazy="edit.form.memo"
                placeholder="메모"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="flat" color="darkText" @click="closeEdit">닫기</v-btn>
          <v-btn variant="flat" color="success" @click="saveEdit">수정</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.open" :color="snack.color" :timeout="2000">
      {{ snack.msg }}
    </v-snackbar>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, markRaw, watch, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';

const API = 'http://localhost:3000';

const page = ref({ title: '작업지시 수정/삭제' });
const breadcrumbs = shallowRef([
  { title: '생산', disabled: true, href: '#' },
  { title: '작업지시 수정/삭제', disabled: false, href: '#' }
]);

const snack = ref({ open: false, msg: '', color: 'primary' });
const toast = (msg, color = 'primary') => (snack.value = { open: true, msg, color });

/* 검색 폼 */
const search = ref({ issueNumber: '', orderName: '', productCode: '', contact: '' });
const orders = shallowRef([]);
const PAGE_SIZE = 10;

async function fetchOrders() {
  const kw = (search.value.issueNumber || search.value.orderName || search.value.productCode || search.value.contact || '').trim();
  try {
    const { data } = await axios.get(`${API}/workorders`, { params: { kw, page: 1, size: 500 } });
    if (data?.ok) {
      orders.value = (data.rows || []).map((r) => ({
        id: r.id,
        issueNumber: r.issueNumber,
        orderName: r.orderName || '',
        orderDate: r.orderDate,
        contact: r.contact,
        productCode: r.productCode,
        productName: r.productName,
        dueDate: r.dueDate,
        targetQty: r.targetQty,
        memo: r.memo || '',
        status: r.status || 'OPEN',
        _hay: (r.issueNumber + (r.orderName || '') + r.productCode + r.productName + r.contact).toLowerCase()
      }));
      toast('조회 완료');
    } else toast('조회 실패', 'error');
  } catch (e) {
    console.error(e);
    toast('조회 오류', 'error');
  }
}
onMounted(fetchOrders);

const filteredOrders = computed(() => {
  const f = search.value;
  return orders.value.filter(
    (o) =>
      (!f.issueNumber || o.issueNumber.includes(f.issueNumber)) &&
      (!f.orderName || o.orderName.includes(f.orderName)) &&
      (!f.productCode || o.productCode.includes(f.productCode)) &&
      (!f.contact || o.contact.includes(f.contact))
  );
});
const pagedOrders = computed(() => filteredOrders.value);

function applySearch() {
  fetchOrders().then(() => gridApi?.ensureIndexVisible(0));
}
function resetFilters() {
  search.value = { issueNumber: '', orderName: '', productCode: '', contact: '' };
  fetchOrders().then(() => gridApi?.ensureIndexVisible(0));
}

/* 컬럼 */
const colDefs = markRaw([
  { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 70 },
  { headerName: '지시번호', field: 'issueNumber', flex: 1.1, minWidth: 140, cellClass: 'cell-ellipsis' },
  { headerName: '지시명', field: 'orderName', flex: 1.3, minWidth: 160, cellClass: 'cell-ellipsis' },
  { headerName: '지시일자', field: 'orderDate', flex: 0.9, minWidth: 120, cellClass: 'cell-ellipsis' },
  { headerName: '작성자', field: 'contact', flex: 0.8, minWidth: 90, cellClass: 'cell-ellipsis' },
  { headerName: '제품코드', field: 'productCode', flex: 0.9, minWidth: 110, cellClass: 'cell-ellipsis' },
  { headerName: '제품명칭', field: 'productName', flex: 1.2, minWidth: 150, cellClass: 'cell-ellipsis' },
  { headerName: '납기일자', field: 'dueDate', flex: 0.9, minWidth: 120, cellClass: 'cell-ellipsis' },
  { headerName: '목표수량', field: 'targetQty', flex: 0.7, minWidth: 90, cellClass: 'ag-right-aligned-cell cell-ellipsis' },
  { headerName: '비고', field: 'memo', flex: 1.2, minWidth: 140, cellClass: 'cell-ellipsis' }
]);

/* ag-Grid */
let gridApi = null;
function onGridReady(e) {
  gridApi = e.api;
  gridApi.sizeColumnsToFit();
}
function getRowId(params) {
  return String(params.data.id);
}

/* 편집 모달 */
const edit = reactive({
  open: false,
  dirty: false,
  form: {
    id: null,
    issueNumber: '',
    orderName: '',
    orderDate: '',
    contact: '',
    productCode: '',
    productName: '',
    dueDate: '',
    targetQty: 0,
    memo: ''
  },
  original: null
});
function markDirty() {
  edit.dirty = true;
}
function openEdit(ev) {
  const r = ev?.data;
  if (!r) return;
  edit.form = {
    id: r.id,
    issueNumber: r.issueNumber,
    orderName: r.orderName,
    orderDate: r.orderDate,
    contact: r.contact,
    productCode: r.productCode,
    productName: r.productName,
    dueDate: r.dueDate,
    targetQty: r.targetQty,
    memo: r.memo
  };
  edit.original = { ...r };
  edit.dirty = false;
  edit.open = true;
}
function closeEdit() {
  if (edit.dirty && !confirm('저장하지 않은 변경 사항이 있습니다. 닫을까요?')) return;
  edit.open = false;
}
function validateForm() {
  const f = edit.form;
  if (!f.orderDate || !f.contact?.trim() || !f.productCode?.trim() || !f.productName?.trim() || !f.dueDate) {
    alert('지시일자, 작성자, 제품코드, 제품명칭, 납기일자는 필수입니다.');
    return false;
  }
  if (!f.targetQty || f.targetQty <= 0) {
    alert('목표수량은 1 이상이어야 합니다.');
    return false;
  }
  return true;
}
async function saveEdit() {
  if (!validateForm()) return;
  try {
    const payload = {
      orderName: edit.form.orderName || null, // ✅ 지시명 포함
      orderDate: edit.form.orderDate,
      contact: edit.form.contact,
      productCode: edit.form.productCode,
      productName: edit.form.productName,
      dueDate: edit.form.dueDate,
      targetQty: Number(edit.form.targetQty || 0),
      memo: edit.form.memo || ''
    };
    const { data } = await axios.put(`${API}/workorders/${edit.form.id}`, payload);
    if (data?.ok) {
      const updated = { ...edit.original, ...edit.form };
      gridApi?.applyTransactionAsync({ update: [updated] });
      const arr = orders.value.slice();
      const i = arr.findIndex((r) => r.id === updated.id);
      if (i > -1) arr[i] = updated;
      orders.value = arr;
      edit.open = false;
      edit.dirty = false;
      toast('수정되었습니다.', 'success');
    } else toast('수정 실패', 'error');
  } catch (e) {
    console.error(e);
    toast('수정 오류', 'error');
  }
}

/* 삭제 */
async function bulkDelete() {
  if (!gridApi) return;
  const selected = gridApi.getSelectedRows();
  if (!selected.length) return alert('삭제할 행을 선택하세요.');
  if (!confirm(`${selected.length}건을 삭제하시겠습니까?`)) return;

  try {
    const ids = selected.map((r) => r.id);
    const { data } = await axios.delete(`${API}/workorders`, { data: { ids } });
    if (data?.ok) {
      gridApi.applyTransactionAsync({ remove: selected });
      const set = new Set(ids);
      orders.value = orders.value.filter((r) => !set.has(r.id));
      if (edit.open && edit.form.id && set.has(edit.form.id)) edit.open = false;
      toast('삭제되었습니다.', 'success');
    } else toast('삭제 실패', 'error');
  } catch (e) {
    console.error(e);
    toast('삭제 오류', 'error');
  }
}

/* 검색 변경 시 첫 행 보이기 */
watch(
  search,
  () => {
    gridApi?.ensureIndexVisible(0);
  },
  { deep: true }
);
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
.head-actions {
  display: flex;
  align-items: center;
}
.grid-wrap {
  height: 520px;
}
.ag-theme-quartz {
  height: 100%;
  --ag-font-size: 12px;
  --ag-grid-size: 4px;
}
.cell-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
