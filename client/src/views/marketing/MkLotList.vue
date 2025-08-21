<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="LOT 조회">
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 600px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          :pagination="true"
          :pagination-page-size="20"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
        <br /><br />
      </div>
    </div>
  </UiParentCard>
</template>

<script setup>
// 기존 스크립트 내용은 동일합니다.
import { ref, shallowRef, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axios from 'axios';
const quartz = themeQuartz;

// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  { field: '입고번호', flex: 1 },
  { field: '입고일자', flex: 1 },
  { field: '제품코드', flex: 1 },
  { field: '제품유형', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: 'LOT번호', flex: 1 },
  { field: '입고수량', flex: 1 },
  { field: '출하된수량', flex: 1 },
  { field: '재고수량', flex: 1 }
]);

onMounted(() => {
  LotList();
});
const LotList = async () => {
  const res = await axios.get('http://localhost:3000/lotSelect');
  console.log(res);
  rowData1.value = res.data.map((prd) => ({
    입고번호: prd.RECEIVED_NO,
    입고일자: prd.RECEIVED_DATE.substring(0, 10),
    제품코드: prd.PRD_CODE,
    제품명: prd.PRD_NAME,
    제품유형: prd.PRD_TYPE,
    입고수량: prd.RECEIVED_QTY,
    LOT번호: prd.PRD_LOT,
    출하된수량: prd.TOTAL_SHIPPED_QTY,
    재고수량: prd.REMAINING_QTY
  }));
};

const page = ref({ title: 'LOT 조회' });
const breadcrumbs = shallowRef([
  {
    title: '영업',
    disabled: true,
    href: '#'
  },
  {
    title: '제품 입출고',
    disabled: true,
    href: '#'
  },
  {
    title: 'LOT 조회',
    disabled: false,
    href: '#'
  }
]);

const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};
</script>

<style scoped>
.main-container {
  display: flex;
  gap: 20px; /* 두 컨테이너 사이의 간격 */
  padding: 0 10px;
}

.list-container {
  flex: 1 1 50%; /* flex-grow: 1, flex-shrink: 1, flex-basis: 50% */
  min-width: 300px;
}
</style>
