<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard>
    <h5>출하 이력 조회</h5>
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 700px; width: 100%"
          @cell-value-changed="onCellValueChanged"
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
import { ref, shallowRef } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const quartz = themeQuartz;

const form = ref({ writer: '' }, { addDate: '' });

// 제품 리스트
const rowData1 = ref([
  {
    출하번호: '불러오기',
    주문날짜: '자동입력',
    주문번호: '자동입력',
    업체명: '자동입력',
    LOT번호: '자동입력',
    제품코드: '자동입력',
    출하수량: '자동입력',
    운송사: '상태변경',
    차량번호: '상태변경',
    출하일자: '[대기중]'
  }
]);

const colDefs1 = ref([
  { field: '출하번호', flex: 1 },
  { field: '주문날짜', flex: 1 },
  { field: '주문번호', flex: 1 },
  { field: '업체명', flex: 1 },
  { field: 'LOT번호', flex: 1 },
  { field: '제품코드', flex: 1 },
  { field: '출하수량', flex: 1 },
  { field: '운송사', flex: 1 },
  { field: '차량번호', flex: 1 },
  { field: '출하일자', flex: 1 },
  { field: '차량번호', flex: 1 }
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
