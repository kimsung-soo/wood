<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="제품 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="제품명 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
      <v-btn color="darkText" @click="searchData">검색</v-btn>
    </div>
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="prdData"
          :columnDefs="prdDefs"
          :theme="quartz"
          style="height: 200px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          @rowClicked="onRowClicked1"
        >
        </ag-grid-vue>

        <br /><br />
        <div class="d-flex align-center mb-2">
          <h5 class="mb-0 mr-3">BOM목록</h5>
          <v-text-field label="제품명" v-model="form.prdName" hide-details readonly="true" style="max-width: 150px"></v-text-field>
          <v-row justify="end">
            <v-btn color="error" class="mr-3" @click="resetForm">초기화</v-btn>
            <v-btn color="primary" class="mr-6" @click="submitForm">추가</v-btn>
          </v-row>
        </div>

        <ag-grid-vue
          :rowData="bomData"
          :columnDefs="bomDefs"
          :theme="quartz"
          style="height: 200px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          @rowClicked="onRowClicked2"
        >
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="BOM코드" v-model="form.bomCode" :readonly="true" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="BOM버젼" v-model="form.bomVer" :readonly="true" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="form.writer" :readonly="true" outlined />
            </v-col>

            <v-col cols="6">
              <v-text-field label="등록일자" v-model="form.addDate" type="date" dense outlined />
            </v-col>
          </v-row>
        </div>
        <br />
        <h5 class="mb-0 mr-3">자재목록</h5>
        <div class="btn-list">
          <v-row justify="end">
            <v-btn
              color="warning"
              class="mr-4"
              @click="openModal('자재 조회', materialRowData, materialColDefs)"
              style="margin-bottom: 2rem"
              >자재 조회
            </v-btn>
            <v-btn color="primary" class="mr-3" @click="upMat">저장</v-btn>
            <v-btn color="error" class="mr-4" @click="delMat">삭제</v-btn>
          </v-row>

          <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
          <ag-grid-vue
            :rowData="matData"
            :columnDefs="matDefts"
            :theme="quartz"
            style="height: 200px; width: 100%"
            @cell-value-changed="onCellValueChanged"
            :rowSelection="'multiple'"
            @grid-ready="onGridReadyMat"
            enableCellChangeFlash="true"
          >
          </ag-grid-vue>
        </div>
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
// 모달 임포트
import MoDal from '../common/NewModal.vue';
const quartz = themeQuartz;
const today = new Date().toISOString().split('T')[0];
const form = ref({ writer: '', addDate: today, bomVer: '', bomCode: '', prdName: '' });

import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';
const $toast = useToast();

// 제품 리스트
const prdData = ref([]);

const prdDefs = ref([
  { field: '제품명', flex: 1 },
  { field: '제품코드', flex: 1 },
  { field: '제품유형', flex: 1 },
  { field: '작성자', flex: 1 },
  { field: '등록일', flex: 1 }
]);

// BOM 리스트
const bomData = ref([]);

const bomDefs = ref([
  { field: 'BOM코드', editable: true, flex: 1 },
  { field: '제품명', flex: 1 },
  { field: 'BOM버젼', flex: 1 },
  { field: '작성자', flex: 1 },
  { field: '사용유무', flex: 1 },
  { field: '등록일', flex: 1 }
]);

// 자재 리스트
const matData = ref([]);

const matDefts = ref([
  { headerCheckboxSelection: true, checkboxSelection: true, width: 50 },
  { field: '자재코드', editable: true, flex: 1 },
  { field: '자재명', flex: 1 },
  { field: '자재유형', flex: 1 },
  {
    field: '소요수량',
    flex: 1,
    editable: true,
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      inputType: 'number', // 👉 숫자 인풋
      min: 0, // 최소값
      step: 1
    }
  },
  { field: '단위', flex: 1, editable: true }
]);

const page = ref({ title: 'BOM관리' });
const breadcrumbs = shallowRef([
  {
    title: '기준정보',
    disabled: true,
    href: '#'
  },
  {
    title: 'BOM 관리',
    disabled: false,
    href: '#'
  }
]);

// 제품 조회
const prdList = async () => {
  try {
    const res = await axios.get('http://localhost:3000/BOMprdSelect');
    prdData.value = res.data.map((prd) => ({
      제품명: prd.PRD_NAME,
      제품코드: prd.PRD_CODE,
      제품유형: prd.PRD_TYPE,
      작성자: prd.PRD_WRITER,
      등록일: prd.PRD_DATE.substring(0, 10)
    }));
  } catch (error) {
    console.error('제품 목록을 불러오는 중 오류가 발생했습니다:', error);
    $toast.error('제품 목록을 불러올 수 없습니다.', { position: 'top-right', duration: 1000 });
  }
};

// 자재 조회(BOM_DETAIL)
const matList = async () => {
  const condition = {
    BOM_CODE: form.value.bomCode,
    BOM_VER: form.value.bomVer
  };
  try {
    const res = await axios.post('http://localhost:3000/BOM_detailSelect', condition);
    matData.value = res.data.map((prd) => ({
      자재코드: prd.MAT_CODE,
      자재명: prd.MAT_NAME,
      자재유형: prd.MAT_TYPE,
      소요수량: prd.QTY,
      단위: prd.UNIT
    }));
  } catch (error) {
    console.error('자재 목록을 불러오는 중 오류가 발생했습니다:', error);
    $toast.error('자재 목록을 불러올 수 없습니다.', { position: 'top-right', duration: 1000 });
  }
};

onMounted(() => {
  prdList();
  modalList();
});

const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(prdData.value);
};

// 검색 버튼
const searchKeyword = ref('');
const searchData = async () => {
  const condition = { PRD_NAME: searchKeyword.value };
  try {
    const res = await axios.post('http://localhost:3000/bomSearch', condition);
    prdData.value = res.data.map((prd) => ({
      제품명: prd.PRD_NAME,
      제품코드: prd.PRD_CODE,
      제품유형: prd.PRD_TYPE,
      작성자: prd.PRD_WRITER,
      등록일: prd.PRD_DATE.substring(0, 10)
    }));
    console.log('검색 키워드:', searchKeyword.value);
    console.log(prdData.value);
    bomData.value = [];
    matData.value = [];
    $toast.success('검색이 완료되었습니다.', { position: 'top-right', duration: 1000 });
  } catch (error) {
    console.error('검색 중 오류가 발생했습니다:', error);
    $toast.error('검색에 실패했습니다.', { position: 'top-right', duration: 1000 });
  }
};

// 폼 데이터를 초기화하는 함수
const resetForm = () => {
  form.value = {
    writer: '',
    addDate: ''
  };
  bomData.value = [];
  matData.value = [];
  $toast.info('폼이 초기화되었습니다.', { position: 'top-right', duration: 1000 });
};

// bom 변수
const selectedProduct = ref(null);
const selectedBomVer = ref(null);

const bomList = async (condition) => {
  try {
    const res = await axios.post('http://localhost:3000/BOMbomSelect', condition);
    bomData.value = res.data.map((prd) => ({
      BOM코드: prd.BOM_CODE,
      제품명: prd.PRD_NAME,
      BOM버젼: prd.BOM_VER,
      작성자: prd.BOM_WRITER,
      사용유무: prd.USE_YN,
      등록일: prd.BOM_RDATE.substring(0, 10)
    }));
  } catch (error) {
    console.error('BOM 목록을 불러오는 중 오류가 발생했습니다:', error);
    $toast.error('BOM 목록을 불러올 수 없습니다.', { position: 'top-right', duration: 1000 });
  }
};
const onRowClicked1 = async (e) => {
  form.value.prdName = e.data.제품명;
  const condition = { PRD_CODE: e.data.제품코드 };
  try {
    const res = await axios.post('http://localhost:3000/BOMbomSelect', condition);
    bomData.value = res.data.map((prd) => ({
      BOM코드: prd.BOM_CODE,
      제품명: prd.PRD_NAME,
      BOM버젼: prd.BOM_VER,
      작성자: prd.BOM_WRITER,
      사용유무: prd.USE_YN,
      등록일: prd.BOM_RDATE.substring(0, 10)
    }));
    selectedProduct.value = e.data;
    selectedBomVer.value = res.data[0]?.BOM_VER;
  } catch (error) {
    console.error('BOM 목록을 불러오는 중 오류가 발생했습니다:', error);
    $toast.error('BOM 목록을 불러올 수 없습니다.', { position: 'top-right', duration: 1000 });
  }
};

//BOM 추가(클릭이벤트)
const submitForm = async () => {
  if (!form.value.prdName) {
    $toast.error('제품을 선택해주세요.', { position: 'top-right', duration: 1000 });
    return;
  }
  console.log(selectedProduct.value);
  const condition = {
    PRD_CODE: selectedProduct.value.제품코드,
    BOM_WRITER: '김태완', // 세션에서 받아야함
    BOM_VER: selectedBomVer.value
  };
  try {
    const res = await axios.post('http://localhost:3000/BOMinsert', condition);
    console.log(res);
    const reloadCondition = { PRD_CODE: selectedProduct.value.제품코드 };
    await bomList(reloadCondition);
    $toast.success('BOM이 성공적으로 추가되었습니다!', { position: 'top-right', duration: 1000 });
  } catch (error) {
    console.error('BOM 추가 중 오류가 발생했습니다:', error);
    $toast.error('BOM 추가에 실패했습니다.', { position: 'top-right', duration: 1000 });
  }
};

// 행선택시 등록 폼으로
const onRowClicked2 = async (event) => {
  form.value.bomCode = event.data.BOM코드;
  form.value.bomVer = event.data.BOM버젼;
  form.value.writer = event.data.작성자;
  form.value.addDate = event.data.등록일;
  await matList();
};

const gridApiMat = ref(null);

const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};

// 자재 목록 수량수정 업데이트
const upMat = async () => {
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (!selectedRows.length) {
    $toast.warning('수정할 자재를 선택해주세요.', { position: 'top-right', duration: 1000 });
    return;
  }
  const matCodes = selectedRows.map((r) => r.자재코드);
  const qtys = selectedRows.map((r) => r.소요수량);
  try {
    await axios.post('http://localhost:3000/bomMatUpdate', {
      bomCode: form.value.bomCode,
      matCodes,
      qtys
    });
    $toast.success('저장이 완료되었습니다.', { position: 'top-right', duration: 1000 });
    await matList();
  } catch (error) {
    console.error('저장 중 오류가 발생했습니다:', error);
    $toast.error('저장에 실패했습니다.', { position: 'top-right', duration: 1000 });
  }
};

// 자재 목록 선택삭제
const delMat = async () => {
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (selectedRows.length === 0) {
    $toast.warning('삭제할 자재를 선택하세요.');
    return;
  }
  const deleteRow = { BOM_CODE: form.value.bomCode, MAT_CODE: selectedRows[0].자재코드 };
  console.log(deleteRow);
  try {
    await axios.post('http://localhost:3000/bomDelete', deleteRow);
    $toast.success('삭제가 완료되었습니다.', { position: 'top-right', duration: 1000 });
    await matList();
  } catch (error) {
    console.error('삭제 중 오류가 발생했습니다:', error);
    $toast.error('삭제에 실패했습니다.', { position: 'top-right', duration: 1000 });
  }
};

//모달 value들
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '자재코드', headerName: '자재코드', flex: 1 },
  { field: '자재명', headerName: '자재명', flex: 1 },
  { field: '자재유형', headerName: '자재유형', flex: 1 },
  { field: '규격', headerName: '규격', flex: 1, editable: true },
  { field: '단위', headerName: '단위', flex: 1, editable: true }
];
const materialRowData = ref([]);

// 모달 조회
const modalList = async () => {
  try {
    const res = await axios.get('http://localhost:3000/BOMmodalSelect');
    materialRowData.value = res.data.map((prd) => ({
      자재코드: prd.MAT_CODE,
      자재명: prd.MAT_NAME,
      자재유형: prd.MAT_TYPE,
      규격: prd.MAT_SIZE,
      단위: prd.MAT_UNIT
    }));
  } catch (error) {
    console.error('모달 자재 목록을 불러오는 중 오류가 발생했습니다:', error);
    $toast.error('자재 목록을 불러올 수 없습니다.', { position: 'top-right', duration: 1000 });
  }
};

//모달 열때 데이터값 자식컴포넌트로
const openModal = async (title, rowData, colDefs) => {
  if (!form.value.bomCode) {
    $toast.warning('BOM이 선택되지 않았습니다.', { position: 'top-right', duration: 1000 });
    return;
  }
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// 모달에서 확인시 행추가
const modalConfirm = async (selectedRow) => {
  const confirmRow = {
    BOM_CODE: form.value.bomCode,
    MAT_CODE: selectedRow.자재코드,
    MAT_NAME: selectedRow.자재명,
    MAT_TYPE: selectedRow.자재유형,
    MAT_SIZE: selectedRow.규격,
    UNIT: selectedRow.단위,
    BOM_VER: form.value.bomVer
  };
  try {
    const res = await axios.post('http://localhost:3000/BOMmodalConfirm', confirmRow);
    console.log(res);
    $toast.success('자재가 성공적으로 추가되었습니다!', { position: 'top-right', duration: 1000 });
    await matList();
  } catch (error) {
    console.error('자재 추가 중 오류가 발생했습니다:', error);
    $toast.error('자재 추가에 실패했습니다.', { position: 'top-right', duration: 1000 });
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
</style>
