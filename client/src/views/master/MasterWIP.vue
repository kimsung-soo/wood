<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="재공품 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="재공품 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
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
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="재공품코드" v-model="form.wipCode" readonly="true" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="재공품명" v-model="form.wipName" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="form.writer" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="등록일자" v-model="form.date" type="date" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="단위" v-model="form.unit" :items="unitOptions" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="재공품유형" v-model="form.type" :items="typeOptions" dense outlined />
            </v-col>
            <v-col cols="12">
              <v-text-field label="규격" v-model="form.size" placeholder="규격" dense outlined readonly>
                <template #append-inner>
                  <i
                    class="fa-solid fa-magnifying-glass"
                    style="cursor: pointer; font-size: large; margin-right: 0.5rem"
                    @click="openModal('재공품 규격 조회', materialRowData, materialColDefs)"
                  ></i>
                </template>
              </v-text-field>
              <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
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
  wipCode: '', //
  wipName: '',
  writer: '',
  date: today,
  size: '',
  unit: '',
  type: '',
  note: ''
});

onMounted(() => {
  wipList();
  // modalList();
  unitList();
  typeList();
});

// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  { field: '재공품코드', editable: true, width: 130 },
  { field: '재공품명', width: 130, editable: true },
  { field: '재공품유형', width: 130, editable: true },
  { field: '규격', width: 110, editable: true },
  { field: '단위', width: 110, editable: true },
  { field: '작성자', width: 110, editable: true },
  { field: '등록일자', width: 110, editable: true }
]);

const page = ref({ title: '재공품 관리' });
const breadcrumbs = shallowRef([
  {
    title: '기준정보',
    disabled: true,
    href: '#'
  },
  {
    title: '재공품 관리',
    disabled: false,
    href: '#'
  }
]);

// 제품 리스트
const wipList = async () => {
  const res = await axios.get('http://localhost:3000/masterWIPSelect');
  console.log(res);
  rowData1.value = res.data.map((prd) => ({
    재공품코드: prd.WIP_CODE,
    재공품명: prd.WIP_NAME,
    재공품유형: prd.WIP_TYPE,
    규격: prd.WIP_SIZE,
    단위: prd.WIP_UNIT,
    작성자: prd.WIP_WRITER,
    등록일자: prd.WIP_DATE.substring(0, 10),
    비고: prd.WIP_NOTE
  }));
};

// 단위, 유형 드롭박스
const unitOptions = ref([]);
const typeOptions = ref([]);
const unitList = async () => {
  const unitRes = await axios.get('http://localhost:3000/masterWIPUnit');
  unitOptions.value = unitRes.data.map((prd) => prd.code_name);
};
const typeList = async () => {
  const typeRes = await axios.get('http://localhost:3000/masterWIPType');
  typeOptions.value = typeRes.data.map((prd) => prd.code_name);
};

/// 저장버튼
const submitForm = async () => {
  console.log(!form.value.wipCode);
  // 수정
  if (form.value.wipCode) {
    const updateRow = {
      WIP_NAME: form.value.wipName,
      WIP_TYPE: form.value.type,
      WIP_UNIT: form.value.unit,
      WIP_SIZE: form.value.size,
      WIP_DATE: form.value.date,
      WIP_NOTE: form.value.note,
      WIP_WRITER: form.value.writer,
      WIP_CODE: form.value.wipCode
    };
    const result = await axios.post('http://localhost:3000/masterWIPUpdate', updateRow);
    console.log(result.config.data);
    wipList();
  } else {
    // db저장
    if (!form.value.type || !form.value.wipName || !form.value.size) {
      alert('값을 올바르게 기재하십시오.');
      return;
    }
    const newRow = {
      WIP_NAME: form.value.wipName,
      WIP_TYPE: form.value.type,
      WIP_UNIT: form.value.unit,
      WIP_SIZE: form.value.size,
      WIP_DATE: form.value.date,
      WIP_NOTE: form.value.note,
      WIP_WRITER: form.value.writer
    };
    const result = await axios.post('http://localhost:3000/masterWIPInsert', newRow);
    console.log(result.config.data);
    wipList();
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

// 행선택시 등록 폼으로
const onRowClicked = (event) => {
  form.value.wipCode = event.data.재공품코드;
  form.value.wipName = event.data.재공품명;
  form.value.writer = event.data.작성자;
  form.value.date = event.data.등록일자;
  form.value.size = event.data.규격;
  form.value.unit = event.data.단위;
  form.value.type = event.data.재공품유형;
  form.value.note = event.data.비고;
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
