<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="창고 조회">
    <div>
      <v-row justify="start">
        <v-btn color="warning" class="ml-4" @click="openModal('창고 목록', materialRowData, materialColDefs)" style="margin-bottom: 2rem"
          >창고 등록 및 조회
        </v-btn>
        <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
      </v-row>
    </div>
    <div class="d-flex align-center mb-4">
      <v-text-field label="창고 번호" v-model="form.wrNo" hide-details class="mr-2" style="max-width: 300px"></v-text-field>
      <v-text-field label="창고 이름" v-model="form.wrName" hide-details class="mr-2" style="max-width: 300px"></v-text-field>
      <v-text-field label="창고 주소" v-model="form.wrAddr" hide-details class="mr-2" style="max-width: 600px"></v-text-field>
      <v-row justify="end" class="mr-3">
        <v-btn color="darkText" class="mr-1" @click="addRow">추가</v-btn>
        <v-btn color="primary" class="mr-1" @click="update">저장</v-btn>
        <v-btn color="error" class="mr-1" @click="delRow">삭제</v-btn>
      </v-row>
    </div>

    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 510px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          rowSelection="multiple"
          :rowMultiSelectWithClick="true"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReady"
          :pagination="true"
          :pagination-page-size="20"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
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
import MoDal from './WrModal.vue'; // 창고모달
import axios from 'axios';
const quartz = themeQuartz;

onMounted(() => {
  modalList();
});

const form = ref({ wrNo: '' }, { wrName: '' }, { wrAddr: '' });
// 창고 정보 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  {
    headerCheckboxSelection: true, // 헤더에서 전체 선택 가능
    checkboxSelection: true, // 각 행에서 선택 가능
    width: 50
  },
  { field: '구역번호', flex: 1, editable: true },
  { field: '섹션코드', flex: 1, editable: true },
  { field: '품목코드', flex: 1, editable: true },
  { field: '품목유형', flex: 1, editable: true }
]);

const page = ref({ title: '창고 관리' });
const breadcrumbs = shallowRef([
  {
    title: '물류',
    disabled: true,
    href: '#'
  },
  {
    title: '창고 관리',
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

// 행 추가 버튼
// rowData1 배열에 새로운 빈행 추가
const addRow = () => {
  const newRow = {};
  rowData1.value.push(newRow);
};

//모달 value들
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
// 모달 열 정의.
const materialColDefs = [
  {
    headerCheckboxSelection: true,
    checkboxSelection: true,
    flex: 0.5
  },
  { field: '창고번호', headerName: '창고번호', flex: 1, editable: true },
  { field: '창고명', headerName: '창고명', flex: 1, editable: true },
  { field: '창고주소', headerName: '창고주소', flex: 3, editable: true }
];

// 모달행에 들어갈 값.
const materialRowData = ref([]);
// 모달 조회
const modalList = async () => {
  const res = await axios.get('http://localhost:3000/wrModalSelect');
  materialRowData.value = res.data.map((prd) => ({
    창고번호: prd.WR_NO,
    창고명: prd.WR_NAME,
    창고주소: prd.WR_ADDR
  }));
};

const openModal = (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// 모달에서 확인시 행추가
const modalConfirm = async (selectedRow) => {
  console.log(selectedRow);
  form.value.wrNo = selectedRow.창고번호;
  form.value.wrName = selectedRow.창고명;
  form.value.wrAddr = selectedRow.창고주소;
  // 조회
  const condition = { WR_NO: form.value.wrNo };
  const res = await axios.post('http://localhost:3000/wrSelect', condition);
  rowData1.value = res.data.map((prd) => ({
    구역번호: prd.WR_AREANO,
    섹션코드: prd.WR_SECTION,
    품목코드: prd.WR_PRD_ID,
    품목유형: prd.WR_TYPE
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
