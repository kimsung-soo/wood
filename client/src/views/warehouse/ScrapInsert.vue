<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="불량품 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="검사 일자" type="date" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 180px"></v-text-field>
      <v-text-field label="검사 일자" type="date" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 180px"></v-text-field>
      <v-btn color="darkText" @click="searchData">검색</v-btn>
    </div>
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 500px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          @rowClicked="onRowClicked"
          :pagination="true"
          pagination-page-size="20"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="창고번호" v-model="form.wrNo" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="구역번호" v-model="form.areaNo" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="섹션 코드" v-model="form.secCode" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="수량" v-model="form.qty" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="폐기 업체" v-model="form.company" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="차량 번호" v-model="form.carNo" dense outlined />
            </v-col>
            <v-row justify="center">
              <v-btn color="error" class="mr-3" @click="resetForm">초기화</v-btn>
              <v-btn color="primary" class="mr-6" @click="submitForm">등록</v-btn>
            </v-row>
          </v-row>
        </div>
        <br />
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

const form = ref(
  { prcCode: '' }, //
  { prcName: '' },
  { writer: '' },
  { date: '' },
  { type: '' }
);

// 제품 리스트
const rowData1 = ref([{ 불량품코드: 1, 제품명: '절단기', 수량: 1, 검사일자: '2025-08-19', 폐기기한: '2025-08-29' }]);

// 폐기 기한은 검사일 + 180일로 설정해야됨.
const colDefs1 = ref([
  { field: '불량품코드', editable: true, flex: 1 },
  { field: '제품명', flex: 1, editable: true },
  { field: '수량', flex: 1, editable: true },
  { field: '검사일자', flex: 1, editable: true },
  { field: '폐기기한', flex: 1, editable: true }
]);

const page = ref({ title: '폐기 처리' });
const breadcrumbs = shallowRef([
  {
    title: '물류',
    disabled: true,
    href: '#'
  },
  {
    title: '폐기 일정 등록',
    disabled: false,
    href: '#'
  }
]);

//cell 단위 수정
const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};

// rowData1 배열에 새로운 행 추가
const submitForm = () => {
  const newRow = {
    제품코드: 'DK-112', // 필요에 따라 기본값 설정
    공정흐름도: form.value.diagram, // 필요에 따라 기본값 설정
    사원명: form.value.empName,
    등록일: form.value.addDate
  };
  rowData1.value.push(newRow);

  // 폼 데이터를 초기화합니다.
  resetForm();
};

// 폼 데이터를 초기화하는 함수
const resetForm = () => {
  form.value = {
    empName: '',
    addDate: '',
    empNo: '',
    diagram: ''
  };
};

// 행선택시 등록 폼으로
const onRowClicked = (event) => {
  form.value.carNo = event.data.차량번호;
  form.value.qty = event.data.등록일;
  form.value.company = event.data.설비유형;
  form.value.wrNo = '';
  form.value.areaNo = '';
  form.value.secCode = '';
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
