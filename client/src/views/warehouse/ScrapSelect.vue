<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="폐기 처리 현황">
    <div class="d-flex align-center mb-4">
      <v-text-field label="폐기 일자" type="date" v-model="startDate" hide-details class="mr-2" style="max-width: 180px"></v-text-field>
      <v-text-field label="폐기 일자" type="date" v-model="endDate" hide-details class="mr-2" style="max-width: 180px"></v-text-field>
      <v-btn color="darkText" @click="searchData">검색</v-btn>
      <v-row justify="end" class="mr-3">
        <v-btn color="error" class="mr-1" @click="scrap">폐기</v-btn>
      </v-row>
    </div>
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 500px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          rowSelection="multiple"
          :rowMultiSelectWithClick="true"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReady"
          :pagination="true"
          pagination-page-size="20"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
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
const startDate = ref('');
const endDate = ref('');

// 제품 리스트
const rowData1 = ref([
  { 폐기번호: 1, 창고번호: '재단공정', 구역번호: '절단기', 섹션코드: '이동섭', 폐기일자: '2025-08-29', 폐기상태: '대기' },
  { 폐기번호: 2, 창고번호: '가공공정', 구역번호: '가공기', 섹션코드: '김태완', 폐기일자: '2025-07-29', 폐기상태: '대기' },
  { 폐기번호: 3, 창고번호: '연마공정', 구역번호: '연마기', 섹션코드: '김성수', 폐기일자: '2025-06-29', 폐기상태: '대기' },
  { 폐기번호: 4, 창고번호: '재단공정', 구역번호: '절단기', 섹션코드: '정경준', 폐기일자: '2025-05-29', 폐기상태: '폐기완료' },
  { 폐기번호: 5, 창고번호: '도장공정', 구역번호: '도장기', 섹션코드: '최은수', 폐기일자: '2025-04-29', 폐기상태: '폐기완료' },
  { 폐기번호: 6, 창고번호: '조립공정', 구역번호: '조립기', 섹션코드: '제갈은경', 폐기일자: '2025-03-29', 폐기상태: '폐기완료' }
]);

const colDefs1 = ref([
  {
    headerCheckboxSelection: true, // 헤더에서 전체 선택 가능
    checkboxSelection: true, // 각 행에서 선택 가능
    width: 50
  },
  { field: '폐기번호', editable: true, flex: 1 },
  { field: '창고번호', flex: 1 },
  { field: '구역번호', flex: 1 },
  { field: '섹션코드', flex: 1 },
  { field: '불량품코드', flex: 1 },
  { field: '폐기업체', flex: 1, editable: true },
  { field: '차량번호', flex: 1, editable: true },
  { field: '페기기한', flex: 1 },
  { field: '폐기일자', flex: 1 },
  {
    field: '폐기상태',
    flex: 1,
    editable: true,
    cellStyle: (params) => {
      if (params.value === '대기') {
        return { color: 'green', fontWeight: 'bold' };
      } else if (params.value === '폐기완료') {
        return { color: 'red', fontWeight: 'bold' };
      }
      return null;
    }
  }
]);

const page = ref({ title: '폐기 처리' });
const breadcrumbs = shallowRef([
  {
    title: '물류',
    disabled: true,
    href: '#'
  },
  {
    title: '폐기 처리 조회',
    disabled: false,
    href: '#'
  }
]);

//cell 단위 수정
const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};

// 그리드 api
const gridApi = ref(null);
const onGridReady = (params) => {
  gridApi.value = params.api; // API 저장
  console.log(gridApi.value);
};
const scrap = () => {
  const selectedRows = gridApi.value.getSelectedRows();
  selectedRows.forEach((row) => {
    row.폐기상태 = '폐기완료';
  });
  //화면 반영
  if (gridApi.value) {
    gridApi.value.refreshCells({ force: true });
  }
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
  min-width: 400px;
}

.form-wrapper {
  flex: 1 1 50%; /* list-container와 동일하게 공간을 차지 */
  min-width: 400px;
}
.radioDiv {
  margin-left: 1rem;
}
</style>
