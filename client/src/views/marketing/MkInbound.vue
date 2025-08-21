<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard>
    <h5>입고 및 LOT생성</h5>
    <div class="d-flex align-center mb-4">
      <v-text-field
        label="검사 일자"
        type="date"
        v-model="form.startDate"
        hide-details
        class="mr-2"
        style="max-width: 180px"
      ></v-text-field>
      <v-text-field label="검사 일자" type="date" v-model="form.endDate" hide-details class="mr-2" style="max-width: 180px"></v-text-field>
      <v-btn color="darkText" @click="searchData">검색</v-btn>
      <v-btn color="error" class="ml-3" @click="resetForm">초기화</v-btn>
    </div>
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 550px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          @grid-ready="onGridReadyMat"
          :rowSelection="'single'"
          :pagination="true"
          :pagination-page-size="20"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
        <br /><br />
        <v-row justify="end">
          <v-btn color="primary" class="mr-6" @click="submitForm">LOT번호등록</v-btn>
        </v-row>
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

// 모달 임포트

const gridApiMat = ref(null); // mat 그리드 API 저장용

const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};
const quartz = themeQuartz;
const today = new Date().toISOString().split('T')[0];
const form = ref({ startDate: today, endDate: '' });

// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  { headerCheckboxSelection: true, checkboxSelection: true, width: 50 },
  { field: '검사번호', flex: 1 },
  { field: '검사일자', flex: 1 },
  { field: '제품코드', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: '제품유형', flex: 1 },
  { field: '수량', flex: 0.7 }
]);

const page = ref({ title: '입고 및 LOT번호등록' });
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
    title: '입고 및 LOT번호등록',
    disabled: false,
    href: '#'
  }
]);
onMounted(() => {
  qualityList();
});
const qualityList = async () => {
  const res = await axios.get('http://localhost:3000/inboundList');
  console.log(res);
  rowData1.value = res.data.map((prd) => ({
    검사번호: prd.PRD_CERT_ID,
    제품코드: prd.PRD_CODE,
    제품명: prd.PRD_NAME,
    제품유형: prd.PRD_TYPE,
    검사일자:
      prd.Q_CHECKED_DATE instanceof Date ? prd.Q_CHECKED_DATE.toISOString().substring(0, 10) : prd.Q_CHECKED_DATE?.substring(0, 10) || '',
    수량: prd.TOTAL_QTY
  }));
};

// lot 번호 등록버튼
const submitForm = async () => {
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (selectedRows.length === 0) {
    alert('입고할 제품을 선택하세요');
    return;
  }
  console.log(selectedRows);
  const payload = selectedRows.map((r) => ({
    RECEIVED_QTY: r.수량,
    PRD_CERT_ID: r.검사번호,
    PRD_CODE: r.제품코드,
    PRD_NAME: r.제품명,
    PRD_TYPE: r.제품유형
  }));
  // 랏번호는 노드에서 진행
  const res = await axios.post('http://localhost:3000/inboundInsert', payload);
  console.log(res);
  alert('등록완료');
};
// 날짜 검색
const searchData = async () => {
  const condition = {
    startDate: form.value.startDate,
    endDate: form.value.endDate
  };
  if (!form.value.startDate) {
    alert('날짜를 올바르게 선택하세요.');
    return;
  }
  const res = await axios.post('http://localhost:3000/inboundSearch', condition);
  rowData1.value = res.data.map((prd) => ({
    검사번호: prd.PRD_CERT_ID,
    제품코드: prd.PRD_CODE,
    제품유형: prd.PRD_TYPE,
    제품명: prd.PRD_NAME,
    검사일자: prd.Q_CHECKED_DATE.substring(0, 10),
    수량: prd.TOTAL_QTY
  }));
};

const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};

// 폼 데이터를 초기화하는 함수
const resetForm = () => {
  form.value = {
    startDate: '',
    endDate: ''
  };
  qualityList();
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
  min-width: 500px;
}
</style>
