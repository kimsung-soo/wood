<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="자재반품요청서 검색조건">
    <v-row class="mb-4">
      <v-col cols="4">
        <v-text-field label="자재명" v-model="materialName" placeholder="자재명" dense outlined readonly>
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
        <v-text-field label="자재코드" v-model="materialCode" placeholder="자재코드" dense outlined readonly></v-text-field>
      </v-col>
      <v-col cols="4">
        <v-text-field label="담당자" v-model="manager" placeholder="담당자" dense outlined />
      </v-col>
    </v-row>
    <v-row class="mb-4">
      <v-col cols="4">
        <v-text-field label="입고일자" v-model="insertDate" type="date" dense outlined />
      </v-col>
      <v-col cols="4">
        <v-text-field label="회수요청일자" v-model="reDate" type="date" dense outlined />
      </v-col>
      <v-col cols="4">
        <div class="radioDiv">
          <span class="mr-2">상태:</span>
          <v-radio-group v-model="status" inline hide-details>
            <v-radio label="등록" value="등록" />
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
  <UiParentCard title="자재반품요청서 목록">
    <ag-grid-vue
      :rowData="rowData"
      :columnDefs="colDefs"
      :theme="quartz"
      style="height: 200px; width: 100%"
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

const rowData = ref([]);

const colDefs = ref([
  { field: '요청서번호', flex: 2 },
  { field: '자재명', flex: 1 },
  { field: '자재코드', flex: 1 },
  { field: '규격', flex: 1 },
  { field: '단위', flex: 1 },
  { field: '작성일자', flex: 1.5 },
  { field: '회수요청일자', flex: 1.5 },
  { field: '담당자', flex: 1 },
  { field: '총수량', headerName: '총 수량', flex: 1 },
  {
    field: '상태',
    flex: 1,
    cellStyle: (params) => {
      if (params.value === '등록') {
        return { color: 'black', fontWeight: 'bold' };
      } else if (params.value === '완료') {
        return { color: 'red', fontWeight: 'bold' };
      }
      return null;
    }
  }
]);

onMounted(async () => {
  try {
    // 회수요청일자 지나면 상태값 완료로 변경
    await axios.post('http://localhost:3000/reMaterialSelectUpdate');

    const res = await axios.get('http://localhost:3000/reMaterialSelect');
    // 응답 데이터 바로 rowData에 할당
    rowData.value = res.data.map((item) => ({
      요청서번호: item.RR_NO,
      자재명: item.MAT_NAME,
      자재코드: item.MAT_CODE,
      규격: item.MAT_SIZE,
      단위: item.MAT_UNIT,
      작성일자: item.CREATED_DATE.slice(0, 10),
      회수요청일자: item.RR_DATE.slice(0, 10),
      담당자: item.MANAGER,
      총수량: item.RE_QTY,
      상태: item.RE_STATUS
    }));
  } catch (err) {
    console.error('발주 조회 실패:', err);
  }
});

const page = ref({ title: '불량품' });
const breadcrumbs = shallowRef([
  {
    title: '자재',
    disabled: true,
    href: '#'
  },
  {
    title: '자재반품요청서 조회',
    disabled: false,
    href: '#'
  }
]);

const materialName = ref('');
const materialCode = ref('');
const insertDate = ref('');
const materialType = ref('');
const status = ref('');
const reDate = ref('');

function inputReset() {
  materialName.value = '';
  materialCode.value = '';
  insertDate.value = '';
  materialType.value = '';
  status.value = '';
  reDate.value = '';
}

function fileSelect() {}
</script>

<style scoped>
.icons {
  margin-left: 27rem;
  margin-bottom: 1rem;
}

.icons:hover {
  cursor: pointer;
}

.radioDiv {
  margin-left: 1rem;
}

.div {
  padding: 0.5rem;
}
</style>
