<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="제품 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="제품 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
      <v-btn color="darkText" @click="searchData">검색</v-btn>
      <v-row justify="end" class="mr-3">
        <v-btn color="error" class="mr-1" @click="del">삭제</v-btn>
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
          :rowSelection="rowSelection"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReadyMat"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="제품코드" v-model="form.prdCode" readonly="true" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="제품명" v-model="form.prdName" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="form.writer" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="등록일자" v-model="form.date" type="date" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="규격" v-model="form.size" placeholder="규격" dense outlined readonly>
                <template #append-inner>
                  <i
                    class="fa-solid fa-magnifying-glass"
                    style="cursor: pointer; font-size: large; margin-right: 0.5rem"
                    @click="openModal('제품 규격 조회', materialRowData, materialColDefs)"
                  ></i>
                </template>
              </v-text-field>
              <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
            </v-col>
            <v-col cols="6">
              <v-text-field label="안전재고" v-model="form.safeQT" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="단위" v-model="form.unit" :items="unitOptions" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="제품유형" v-model="form.type" :items="typeOptions" dense outlined />
            </v-col>
            <v-col cols="12">
              <v-text-field label="비고" v-model="form.note" dense outlined />
            </v-col>
            <v-row justify="center">
              <v-btn color="error" class="mr-3" @click="resetForm">초기화</v-btn>
              <v-btn color="primary" class="mr-6" @click="submitForm">저장</v-btn>
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
import { onMounted, ref, shallowRef } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axios from 'axios';
import MoDal from '../common/NewModal.vue';
const quartz = themeQuartz;
const rowSelection = ref({
  mode: 'multiRow'
});
const today = new Date().toISOString().split('T')[0];
const form = ref({
  prdCode: '', //
  prdName: '',
  writer: '',
  date: today,
  size: '',
  safeQT: '',
  unit: '',
  type: '',
  note: ''
});

const page = ref({ title: '제품 관리' });
const breadcrumbs = shallowRef([
  {
    title: '기준정보',
    disabled: true,
    href: '#'
  },
  {
    title: '제품 관리',
    disabled: false,
    href: '#'
  }
]);

onMounted(() => {
  prdList();
  modalList();
  unitList();
  typeList();
});

// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  { field: '제품코드', editable: true, width: 140 },
  { field: '제품명', width: 140, editable: true },
  { field: '제품유형', width: 140, editable: true },
  { field: '규격', width: 140, editable: true },
  { field: '단위', width: 130, editable: true },
  { field: '안전재고', width: 110 },
  { field: '작성자', width: 110 },
  { field: '등록일자', width: 110 },
  { field: '비고', width: 110 }
]);

// 제품 리스트
const prdList = async () => {
  const res = await axios.get('http://localhost:3000/masterPrdSelect');
  console.log(res);
  rowData1.value = res.data.map((prd) => ({
    제품코드: prd.PRD_CODE,
    제품명: prd.PRD_NAME,
    제품유형: prd.PRD_TYPE,
    규격: prd.PRD_SIZE,
    단위: prd.PRD_UNIT,
    안전재고: prd.PRD_SAFEQT,
    작성자: prd.PRD_WRITER,
    등록일자: prd.PRD_DATE.substring(0, 10),
    비고: prd.PRD_NOTE
  }));
};

// 단위, 유형 드롭박스
const unitOptions = ref([]);
const typeOptions = ref([]);
const unitList = async () => {
  const unitRes = await axios.get('http://localhost:3000/masterPrdUnit');
  unitOptions.value = unitRes.data.map((prd) => prd.code_name);
};
const typeList = async () => {
  const typeRes = await axios.get('http://localhost:3000/masterPrdType');
  typeOptions.value = typeRes.data.map((prd) => prd.code_name);
};

// 저장버튼
const submitForm = async () => {
  console.log(!form.value.prdCode);
  // 수정
  if (form.value.prdCode) {
    const updateRow = {
      PRD_NAME: form.value.prdName,
      PRD_TYPE: form.value.type,
      PRD_UNIT: form.value.unit,
      PRD_SIZE: form.value.size,
      PRD_SAFEQT: form.value.safeQT,
      PRD_WRITER: form.value.writer,
      PRD_DATE: form.value.date,
      PRD_NOTE: form.value.note,
      PRD_CODE: form.value.prdCode
    };
    const result = await axios.post('http://localhost:3000/masterPrdUpdate', updateRow);
    console.log(result.config.data);
    prdList();
  } else {
    // db저장
    if (!form.value.safeQT || !form.value.type) {
      alert('값을 올바르게 기재하십시오.');
      return;
    }
    const newRow = {
      PRD_NAME: form.value.prdName,
      PRD_TYPE: form.value.type,
      PRD_UNIT: form.value.unit,
      PRD_SIZE: form.value.size,
      PRD_SAFEQT: form.value.safeQT,
      PRD_WRITER: form.value.writer,
      PRD_DATE: form.value.date,
      PRD_NOTE: form.value.note
    };
    const result = await axios.post('http://localhost:3000/masterPrdInsert', newRow);
    console.log(result.config.data);
    prdList();
  }
};

// 삭제 버튼
const gridApiMat = ref(null); // mat 그리드 API 저장용

const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};

const del = async () => {
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (selectedRows.length === 0) {
    alert('삭제할 제품을 선택하세요.');
    return;
  }
  confirm(`${form.value.prdName}을 삭제하시겠습니까?`);
  const prdCode = selectedRows.map((r) => r.제품코드);
  await axios.post('http://localhost:3000/masterPrdDelete', {
    prdCode
  });
  await prdList();
};

//  검색
const searchKeyword = ref('');
const searchData = async () => {
  const condition = { PRD_NAME: searchKeyword.value };
  const res = await axios.post('http://localhost:3000/masterPrdSearch', condition);
  rowData1.value = await res.data.map((prd) => ({
    제품코드: prd.PRD_CODE,
    제품명: prd.PRD_NAME,
    제품유형: prd.PRD_TYPE,
    규격: prd.PRD_SIZE,
    단위: prd.PRD_UNIT,
    안전재고: prd.PRD_SAFEQT,
    작성자: prd.PRD_WRITER,
    등록일자: prd.PRD_DATE.substring(0, 10),
    비고: prd.PRD_NOTE
  }));
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
  form.value.prdCode = event.data.제품코드;
  form.value.prdName = event.data.제품명;
  form.value.writer = event.data.작성자;
  form.value.date = event.data.등록일자;
  form.value.safeQT = event.data.안전재고;
  form.value.size = event.data.규격;
  form.value.unit = event.data.단위;
  form.value.type = event.data.제품유형;
  form.value.note = event.data.비고;
};

//모달 value들
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '그룹코드', headerName: '그룹코드', flex: 1 },
  { field: '규격', headerName: '규격', flex: 1 },
  { field: '사용유무', headerName: '사용유무', flex: 1 }
];
const materialRowData = ref([]);

// 모달 조회
const modalList = async () => {
  const res = await axios.get('http://localhost:3000/masterPrdModal');
  materialRowData.value = res.data.map((prd) => ({
    그룹코드: prd.group_code,
    규격: prd.code_name,
    사용유무: prd.use_yn
  }));
  console.log(res);
};

//모달 열때 데이터값 자식컴포넌트로
const openModal = async (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// 모달에서 확인시 행추가
const modalConfirm = async (selectedRow) => {
  form.value.size = selectedRow.규격;
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
