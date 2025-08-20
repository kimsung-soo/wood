<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="자재 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="자재 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
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
              <v-text-field label="자재코드" v-model="form.matCode" readonly="true" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="자재명" v-model="form.matName" dense outlined />
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
                    @click="openModal('자재 규격 조회', materialRowData, materialColDefs)"
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
              <v-select label="자재유형" v-model="form.type" :items="typeOptions" dense outlined />
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
import { ref, shallowRef, onMounted } from 'vue';
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
  matCode: '', //
  matName: '',
  writer: '',
  date: today,
  size: '',
  safeQT: '',
  unit: '',
  type: '',
  note: ''
});

onMounted(() => {
  matList();
  modalList();
  typeList();
  unitList();
});
// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  { field: '자재코드', width: 140 },
  { field: '자재명', width: 140 },
  { field: '자재유형', width: 140 },
  { field: '규격', width: 140 },
  { field: '안전재고', width: 130 },
  { field: '단위', width: 130 },
  { field: '작성자', width: 130 },
  { field: '등록일자', width: 130 },
  { field: '비고', width: 130 }
]);

const page = ref({ title: '자재 관리' });
const breadcrumbs = shallowRef([
  {
    title: '기준정보',
    disabled: true,
    href: '#'
  },
  {
    title: '자재 관리',
    disabled: false,
    href: '#'
  }
]);

//cell 단위 수정
const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};

// 제품 리스트
const matList = async () => {
  const res = await axios.get('http://localhost:3000/masterMatSelect');
  console.log(res);
  rowData1.value = res.data.map((prd) => ({
    자재코드: prd.MAT_CODE,
    자재명: prd.MAT_NAME,
    자재유형: prd.MAT_TYPE,
    규격: prd.MAT_SIZE,
    단위: prd.MAT_UNIT,
    안전재고: prd.MAT_SAFEQT,
    작성자: prd.MAT_WRITER,
    등록일자: prd.MAT_DATE.substring(0, 10),
    비고: prd.MAT_NOTE
  }));
};

// 단위, 유형 드롭박스
const unitOptions = ref([]);
const typeOptions = ref([]);
const unitList = async () => {
  const unitRes = await axios.get('http://localhost:3000/masterMatUnit');
  unitOptions.value = unitRes.data.map((prd) => prd.code_name);
};
const typeList = async () => {
  const typeRes = await axios.get('http://localhost:3000/masterMatType');
  typeOptions.value = typeRes.data.map((prd) => prd.code_name);
};

// 저장버튼
const submitForm = async () => {
  console.log(!form.value.matCode);
  // 수정
  if (form.value.matCode) {
    const updateRow = {
      MAT_NAME: form.value.matName,
      MAT_TYPE: form.value.type,
      MAT_UNIT: form.value.unit,
      MAT_SIZE: form.value.size,
      MAT_SAFEQT: form.value.safeQT,
      MAT_WRITER: form.value.writer,
      MAT_DATE: form.value.date,
      MAT_NOTE: form.value.note,
      MAT_CODE: form.value.matCode
    };
    const result = await axios.post('http://localhost:3000/masterMatUpdate', updateRow);
    console.log(result.config.data);
    matList();
  } else {
    // db저장
    if (!form.value.safeQT || !form.value.type) {
      alert('값을 올바르게 기재하십시오.');
      return;
    }
    const newRow = {
      MAT_NAME: form.value.matName,
      MAT_TYPE: form.value.type,
      MAT_UNIT: form.value.unit,
      MAT_SIZE: form.value.size,
      MAT_SAFEQT: form.value.safeQT,
      MAT_WRITER: form.value.writer,
      MAT_DATE: form.value.date,
      MAT_NOTE: form.value.note
    };
    const result = await axios.post('http://localhost:3000/masterMatInsert', newRow);
    console.log(result.config.data);
    matList();
  }
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

// 행 선택시 등록 폼으로
const onRowClicked = (event) => {
  form.value.matCode = event.data.자재코드;
  form.value.matName = event.data.자재명;
  form.value.writer = event.data.작성자;
  form.value.date = event.data.등록일자;
  form.value.safeQT = event.data.안전재고;
  form.value.size = event.data.규격;
  form.value.unit = event.data.단위;
  form.value.type = event.data.자재유형;
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
  const res = await axios.get('http://localhost:3000/masterMatModal');
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
