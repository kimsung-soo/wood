<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="출하 이력 조회">
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
import { onMounted, ref, shallowRef } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axios from 'axios';
const quartz = themeQuartz;

// 출하 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  { field: '출하번호', flex: 1 },
  { field: '주문번호', flex: 1 },
  { field: '거래처', flex: 1 },
  { field: '납기일자', flex: 1 },
  { field: 'LOT번호', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: '출하수량', flex: 1 },
  { field: '운송사', flex: 1 },
  { field: '차량번호', flex: 1 },
  { field: '출하일자', flex: 1 },
  { field: '출하상태', flex: 1 }
]);

const page = ref({ title: '출하 이력 조회' });
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
    title: '출하 이력 조회',
    disabled: false,
    href: '#'
  }
]);
onMounted(() => {
  shipList();
});

// 출하이력 리스트
const shipList = async () => {
  const res = await axios.get('http://localhost:3000/shipSelect');
  rowData1.value = res.data.map((emp) => ({
    출하번호: emp.SHIP_NO,
    주문번호: emp.REQ_ID,
    거래처: emp.CUS_ID,
    납기일자: emp.D_DAY.substring(0, 10),
    LOT번호: emp.PRD_LOT,
    제품명: emp.PRD_NAME,
    출하수량: emp.QTY,
    운송사: emp.DELIVERY,
    차량번호: emp.CAR_NO,
    출하일자: emp.SHIP_DATE ? emp.SHIP_DATE.substring(0, 10) : null,
    출하상태: emp.SHIP_STATUS
  }));
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
