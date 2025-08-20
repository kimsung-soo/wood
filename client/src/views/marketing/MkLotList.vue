<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard>
    <h5>LOT 조회</h5>
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
  { 입고일자: '불러오기', 제품코드:'불러오기', 제품명:'불러오기', 입고수량:'불러오기', LOT번호:'불러오기', 남은수량:'계산등록' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },
  { 입고일자: '', 제품코드:'', 제품명:'', 입고수량:'', LOT번호:'', 남은수량:'' },

]);

const colDefs1 = ref([
  { field: '입고일자', flex: 1 },
  { field: '제품코드', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: '입고수량', flex: 1 },
  { field: 'LOT번호', flex: 1 },
  { field: '남은수량', flex: 1 }
]);


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
