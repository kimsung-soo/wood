<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="제품 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="제품 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
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
          rowSelection="single"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReadyPrd"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="제품명" v-model="form.product" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="공정흐름도 코드" v-model="form.diagram" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="form.writer" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="등록일" v-model="form.addDate" type="date" dense outlined />
            </v-col>
            <v-row justify="center">
              <v-btn color="error" class="mr-3" @click="resetForm">초기화</v-btn>
              <v-btn color="primary" class="mr-6" @click="submitForm">저장</v-btn>
            </v-row>
          </v-row>
        </div>
        <br />
        <h5>공정목록</h5>
        <br />
        <div class="btn-list">
          <v-row justify="end">
            <v-btn
              color="warning"
              class="mr-4"
              @click="openModal('공정 조회', materialRowData, materialColDefs)"
              style="margin-bottom: 2rem"
              >공정 조회
            </v-btn>
            <v-btn color="error" class="mr-4" @click="del">삭제</v-btn>
          </v-row>

          <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
          <ag-grid-vue
            :rowData="prcData"
            :columnDefs="prcDefs"
            :theme="quartz"
            style="height: 250px; width: 100%"
            @cell-value-changed="onCellValueChanged"
            :rowDragManaged="true"
            :animateRows="true"
            :rowSelection="'multiple'"
            @grid-ready="onGridReadyMat"
            @row-drag-end="onRowDragEnd"
          >
          </ag-grid-vue>
        </div>
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
import MoDal from '../common/NewModal.vue'; // 수정된 부분: 모달 컴포넌트 임포트
const quartz = themeQuartz;

const form = ref({ product: '', diagram: '', writer: '', addDate: '' });

const gridApiMat = ref(null); // mat 그리드 API 저장용
const gridApiPrd = ref(null);
const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};
const onGridReadyPrd = (params) => {
  gridApiPrd.value = params.api;
};

// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  { headerCheckboxSelection: true, checkboxSelection: true, width: 50 },
  { field: '제품명', editable: true, width: 120 },
  { field: '제품코드', width: 130 },
  { field: '제품유형', width: 130 },
  { field: '공정흐름도', width: 130 },
  { field: '작성자', width: 110, editable: true },
  { field: '등록일', width: 110, editable: true }
]);

// 공정 리스트
const prcData = ref([]);

const prcDefs = ref([
  { headerCheckboxSelection: true, checkboxSelection: true, width: 50 },
  { field: '공정순서', type: Number, flex: 1, rowDrag: true, editable: true },
  { field: '공정코드', editable: true, flex: 1 },
  { field: '공정명', flex: 1 },
  { field: '설비유형', flex: 1 }
]);

const page = ref({ title: '공정흐름도 관리' });
const breadcrumbs = shallowRef([
  {
    title: '기준정보',
    disabled: true,
    href: '#'
  },
  {
    title: '공정흐름도 관리',
    disabled: false,
    href: '#'
  }
]);
onMounted(() => {
  prdList();
  modalList();
});

// 제품 조회
const prdList = async () => {
  const res = await axios.get('http://localhost:3000/diaPrdList');
  rowData1.value = res.data.map((prd) => ({
    제품명: prd.PRD_NAME,
    제품코드: prd.PRD_CODE,
    제품유형: prd.PRD_TYPE,
    공정흐름도: prd.DIA_CODE,
    작성자: prd.PRD_WRITER,
    등록일: prd.PRD_DATE.substring(0, 10)
  }));
};

//cell 단위 수정
const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};

// 저장버튼

const submitForm = async () => {
  const selectedRows2 = gridApiPrd.value.getSelectedRows();
  if (selectedRows2.length === 0) {
    alert('제품을 선택하세요');
    return;
  }
  const alreadyAssigned = selectedRows2.find((r) => r.공정흐름도); // 공정흐름도 컬럼 값 존재 여부 확인
  if (alreadyAssigned) {
    alert(`이미 공정흐름도 코드가 부여된 제품입니다: ${alreadyAssigned.제품명}`);
    return;
  }

  const prdCode = selectedRows2.map((r) => r.제품코드);
  const newRow = {
    제품코드: prdCode,
    작성자: form.value.writer,
    등록일: form.value.addDate
  };
  console.log(newRow);
  await axios.post('http://localhost:3000/diaInsert', newRow);

  await prdList();
};

// 폼 데이터를 초기화하는 함수
const resetForm = () => {
  form.value = {
    writer: '',
    addDate: '',
    product: '',
    diagram: ''
  };
  prcData.value = [];
};
// 공정 조회
const prcList = async () => {
  if (!form.value.diagram) {
    return;
  }
  const condition = {
    DIA_CODE: form.value.diagram
  };
  const res = await axios.post('http://localhost:3000/prcList', condition);
  prcData.value = res.data.map((prd) => ({
    공정순서: prd.PRC_ORDER,
    공정코드: prd.PRC_CODE,
    공정명: prd.PRC_NAME,
    설비유형: prd.FAC_TYPE
  }));
};

// 행선택시 등록 폼으로
const onRowClicked = (event) => {
  form.value.product = event.data.제품명;
  form.value.diagram = event.data.공정흐름도;
  form.value.writer = event.data.작성자;
  form.value.addDate = event.data.등록일;
  prcList();
  const selectedRows = gridApiMat.value.getSelectedRows();
  const selectedRows2 = gridApiPrd.value.getSelectedRows();
  console.log(selectedRows);
  console.log(selectedRows2);
};

// 공정 삭제
const del = async () => {
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (selectedRows.length === 0) {
    alert('삭제할 공정을 선택하세요.');
    return;
  }
  confirm('공정을 삭제하시겠습니까?');
  const prcCode = selectedRows.map((r) => r.공정코드);
  await axios.post('http://localhost:3000/prcDelete', {
    diaCode: form.value.diagram,
    prcCode
  });
  await prcList();
};

// 드래그 앤 드랍 공정순서 변화

const onRowDragEnd = async () => {
  const updatedData = [];
  gridApiMat.value.forEachNode((node, index) => {
    updatedData.push({
      DIA_CODE: form.value.diagram, // 현재 다이어그램 코드
      PRC_CODE: node.data.공정코드, // 공정 코드
      PRC_ORDER: index + 1 // 새로운 순서
    });
  });

  console.log(updatedData);

  try {
    await axios.post('http://localhost:3000/updateProcessOrder', updatedData);
  } catch (error) {
    console.error('순서 저장 실패', error);
  }

  await prcList();
};

//모달 value들
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '공정코드', headerName: '공정코드', flex: 1 },
  { field: '공정명', headerName: '공정명', flex: 1 },
  { field: '설비유형', headerName: '설비유형', flex: 1 },
  { field: '등록일자', headerName: '등록일자', flex: 1 }
];
const materialRowData = ref([]);

// 모달 조회
const modalList = async () => {
  const res = await axios.get('http://localhost:3000/diaModalList');
  console.log(res.data);
  materialRowData.value = res.data.map((prd) => ({
    공정코드: prd.PRC_CODE,
    공정명: prd.PRC_NAME,
    설비유형: prd.FAC_TYPE,
    등록일자: prd.PRC_RDATE.substring(0, 10)
  }));
};

//모달 열때 데이터값 자식컴포넌트로
const openModal = (title, rowData, colDefs) => {
  if (!form.value.product) {
    alert('제품이 선택되지 않았습니다');
    return;
  }
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// 모달에서 확인시 공정추가
const modalConfirm = async (selectedRow) => {
  for (var i = 0; i < prcData.value.length; i++) {
    if (selectedRow.공정코드 == prcData.value[i].공정코드) {
      alert('등록된 공정입니다.');
      return;
    }
  }
  const confirmRow = {
    DIA_CODE: form.value.diagram,
    PRC_CODE: selectedRow.공정코드,
    PRC_NAME: selectedRow.공정명,
    FAC_TYPE: selectedRow.설비유형
  };
  const res = await axios.post('http://localhost:3000/prcModalConfirm', confirmRow);
  console.log(res);
  await prcList();
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
