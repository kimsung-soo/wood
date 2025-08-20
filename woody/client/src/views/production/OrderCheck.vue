<!-- src/views/production/OrderCheck.vue -->
<!-- commit -->
<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <!-- 검색 -->
    <v-row class="mb-4" dense>
      <v-col cols="3"><v-text-field label="지시번호" v-model.trim="search.issueNumber" dense outlined hide-details /></v-col>
      <v-col cols="3"><v-text-field label="지시명" v-model.trim="search.orderName" dense outlined hide-details /></v-col>
      <v-col cols="3"><v-text-field label="제품코드" v-model.trim="search.productCode" dense outlined hide-details /></v-col>
      <v-col cols="3"><v-text-field label="작성자" v-model.trim="search.contact" dense outlined hide-details /></v-col>
    </v-row>

    <v-row justify="center" class="mt-2 mb-4">
      <v-col cols="auto">
        <v-btn variant="flat" color="error" class="mx-2" @click="resetFilters">초기화</v-btn>
        <v-btn variant="flat" color="darkText" class="mx-2" @click="applySearch">검색</v-btn>
      </v-col>
    </v-row>

    <ag-grid-vue
      class="ag-theme-quartz ag-no-wrap"
      :rowData="pagedOrders"
      :columnDefs="colDefs"
      :pagination="true"
      :paginationPageSize="PAGE_SIZE"
      :suppressPaginationPanel="false"
      :domLayout="'autoHeight'"
      rowSelection="single"
      @grid-ready="onGridReady"
      @first-data-rendered="sizeFit"
      @grid-size-changed="sizeFit"
      @row-double-clicked="goDetail"
    />
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';

const API = 'http://localhost:3000';
const router = useRouter();

const page = ref({ title: '작업지시 조회' });
const breadcrumbs = shallowRef([
  { title: '생산', disabled: true, href: '#' },
  { title: '작업지시 조회', disabled: false, href: '#' }
]);

const search = ref({ issueNumber: '', orderName: '', productCode: '', contact: '' });

const orders = ref([]);
const PAGE_SIZE = 10;

/* 서버 조회 */
async function fetchOrders() {
  const kw = (search.value.issueNumber || search.value.orderName || search.value.productCode || search.value.contact || '').trim();
  try {
    const { data } = await axios.get(`${API}/workorders`, { params: { kw, page: 1, size: 300 } });
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
        status: r.status || 'OPEN',
        memo: r.memo || ''
      }));
    }
  } catch (e) {
    console.error(e);
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

/* ag-grid */
const textCell = { cellStyle: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, tooltipValueGetter: (p) => p.value };
const numRight = { ...textCell, cellClass: 'ag-right-aligned-cell' };

const colDefs = [
  { headerName: '지시번호', field: 'issueNumber', flex: 1.2, minWidth: 150, ...textCell },
  { headerName: '지시명', field: 'orderName', flex: 1.4, minWidth: 160, ...textCell },
  { headerName: '지시일자', field: 'orderDate', flex: 0.9, minWidth: 120, ...textCell },
  { headerName: '작성자', field: 'contact', flex: 0.8, minWidth: 90, ...textCell },
  { headerName: '제품코드', field: 'productCode', flex: 0.9, minWidth: 110, ...textCell },
  { headerName: '제품명칭', field: 'productName', flex: 1.2, minWidth: 150, ...textCell },
  { headerName: '납기일자', field: 'dueDate', flex: 0.9, minWidth: 120, ...textCell },
  { headerName: '목표수량', field: 'targetQty', flex: 0.7, minWidth: 90, ...numRight }
];

let gridApi;
function onGridReady(e) {
  gridApi = e.api;
  sizeFit();
}
function sizeFit() {
  gridApi?.sizeColumnsToFit();
}
function applySearch() {
  fetchOrders().then(() => sizeFit());
}
function resetFilters() {
  search.value = { issueNumber: '', orderName: '', productCode: '', contact: '' };
  fetchOrders().then(sizeFit);
}
function goDetail(ev) {
  const row = ev?.data;
  if (!row) return;
  router.push({ name: 'OrderModify', query: { issue: row.issueNumber, id: row.id } });
}
</script>

<style scoped>
.ag-no-wrap .ag-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ag-theme-quartz {
  --ag-font-size: 12px;
  --ag-grid-size: 4px;
}
</style>
