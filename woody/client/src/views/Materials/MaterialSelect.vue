<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="입고 검색조건">
    <v-row class="mb-4">
      <v-col cols="4">
        <v-text-field label="자재명" v-model="materialName" dense outlined readonly>
          <template #append-inner>
            <i
              class="fa-solid fa-magnifying-glass"
              style="cursor: pointer; font-size: large; margin-right: 0.5rem"
              @click="openModal('자재 조회', materialRowData, materialColDefs)"
            ></i>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="4">
        <v-text-field label="자재코드" v-model="materialCode" dense outlined readonly />
      </v-col>
      <v-col cols="4">
        <div class="radioDiv">
          <span class="mr-2">자재유형:</span>
          <v-radio-group v-model="materialType" inline hide-details>
            <v-radio label="원자재" value="원자재" />
            <v-radio label="부자재" value="부자재" />
            <v-radio label="소모품" value="소모품" />
          </v-radio-group>
        </div>
      </v-col>
    </v-row>
    <v-row class="mb-4">
      <v-col cols="4">
        <v-text-field label="입고일자" v-model="insertDate" type="date" dense outlined />
      </v-col>
      <v-col cols="4"></v-col>
      <v-col cols="4">
        <div class="radioDiv">
          <span class="mr-2">상태:</span>
          <v-radio-group v-model="status" inline hide-details>
            <v-radio label="검수 대기" value="검수 대기" />
            <v-radio label="완료" value="완료" />
          </v-radio-group>
        </div>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-btn color="error" class="mr-2" @click="inputReset">초기화</v-btn>
      <v-btn color="darkText" @click="fileSelect">검색</v-btn>
    </v-row>
  </UiParentCard>
  <div class="div"></div>
  <UiParentCard title="입고 목록">
    <ag-grid-vue
      :rowData="rowData"
      :columnDefs="colDefs"
      :theme="quartz"
      style="height: 19rem; width: 100%"
      :pagination="true"
      :pagination-page-size="5"
      @cell-value-changed="onCellValueChanged"
    >
    </ag-grid-vue>
    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" />
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue';

import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz } from 'ag-grid-community';
import MoDal from '../common/NewModal.vue';
import axios from 'axios';
const quartz = themeQuartz;

// ----------------- 모달 (기본 정의) -----------------
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);

const materialColDefs = [
  { field: '자재코드', headerName: '자재코드', flex: 1 },
  { field: '자재명', headerName: '자재명', flex: 1 },
  { field: '자재유형', headerName: '자재유형', flex: 1 },
  { field: '규격', headerName: '규격', flex: 1 },
  { field: '단위', headerName: '단위', flex: 1 }
];
const materialRowData = ref([]);

const openModal = async (title) => {
  modalTitle.value = title;
  modalColDefs.value = materialColDefs;

  try {
    const res = await axios.get('http://localhost:3000/materials');
    modalRowData.value = res.data.map((mat) => ({
      자재코드: mat.MAT_CODE,
      자재명: mat.MAT_NAME,
      자재유형: mat.MAT_TYPE,
      규격: mat.MAT_SIZE,
      단위: mat.MAT_UNIT
    }));

    if (modalRef.value) {
      modalRef.value.open();
    }
  } catch (error) {
    console.error('자재 목록을 가져오는 중 오류가 발생했습니다:' + error);
    alert('자재 목록을 불러오는 데 실패했습니다.');
  }
};

function onModalConfirm(selectedRow) {
  if (selectedRow) {
    materialName.value = selectedRow.자재명;
    materialCode.value = selectedRow.자재코드;
  }
}

// ag grid
const colDefs = ref([
  { field: '입고번호', flex: 1.5 },
  { field: '공급업체', flex: 1 },
  { field: '자재명', flex: 1 },
  { field: '자재코드', flex: 1 },
  { field: '자재유형', flex: 1 },
  { field: '규격', flex: 1 },
  { field: '단위', flex: 1 },
  { field: '입고일자', flex: 1.5 },
  { field: '담당자', flex: 1 },
  { field: '입고수량', flex: 1 },
  {
    field: '상태',
    flex: 1,
    cellStyle: (params) => {
      if (params.value == '검수 대기') {
        return { color: 'blue', fontWeight: 'bold' };
      } else if (params.value == '완료') {
        return { color: 'red', fontWeight: 'bold' };
      }
      return null;
    }
  }
]);
const rowData = ref([]);

onMounted(async () => {
  try {
    const res = await axios.get('http://localhost:3000/materialSelect');
    // 응답 데이터 바로 rowData에 할당
    rowData.value = res.data.map((item) => ({
      입고번호: item.RECEIPT_NO,
      공급업체: item.SUPPLYER,
      자재코드: item.MAT_CODE,
      자재명: item.MAT_NAME,
      자재유형: item.MAT_TYPE,
      규격: item.MAT_SIZE,
      단위: item.MAT_UNIT,
      입고일자: item.RECEIPT_DATE.slice(0, 10),
      담당자: item.MANAGER,
      입고수량: item.RECEIVED_QTY,
      상태: item.TMP_STATUS
    }));
  } catch (err) {
    console.error('발주 조회 실패:', err);
  }
});

const page = ref({ title: '입고' });
const breadcrumbs = shallowRef([
  {
    title: '자재',
    disabled: true,
    href: '#'
  },
  {
    title: '입고 조회',
    disabled: false,
    href: '#'
  }
]);

const materialName = ref('');
const materialCode = ref('');
const insertDate = ref('');
const materialType = ref('');
const status = ref('');

function inputReset() {
  materialName.value = '';
  materialCode.value = '';
  insertDate.value = '';
  materialType.value = '';
  status.value = '';
}

async function fileSelect() {
  try {
    // 검색 조건 객체 생성
    const searchParams = {
      MAT_NAME: materialName.value || null,
      MAT_CODE: materialCode.value || null,
      MAT_TYPE: materialType.value || null,
      RECEIPT_DATE: insertDate.value || null,
      PO_STATUS: status.value || null
    };

    const res = await axios.post('http://localhost:3000/tmpSearch', searchParams);
    console.log(res.data);
    // 응답 데이터 바로 rowData에 할당
    rowData.value = res.data.map((item) => ({
      입고번호: item.RECEIPT_NO,
      공급업체: item.SUPPLYER,
      자재코드: item.MAT_CODE,
      자재명: item.MAT_NAME,
      자재유형: item.MAT_TYPE,
      규격: item.MAT_SIZE,
      단위: item.MAT_UNIT,
      입고일자: item.RECEIPT_DATE.slice(0, 10),
      담당자: item.MANAGER,
      입고수량: item.RECEIVED_QTY,
      상태: item.MAT_TYPE == '원자재' ? '검수 대기' : item.MAT_TYPE == '부자재' ? '완료' : '실패'
    }));
  } catch (err) {
    console.error('입고 검색 실패:', err);
  }
}
</script>

<style scoped>
.radioDiv {
  margin-left: 1rem;
}

.div {
  padding: 0.5rem;
}
</style>
