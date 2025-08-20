<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="자재발주서 검색조건">
    <v-row class="mb-4">
      <v-col cols="3">
        <v-text-field label="발행번호" v-model="issueNumber" placeholder="발행번호" dense outlined readonly>
          <template #append-inner>
            <i
              class="fa-solid fa-magnifying-glass"
              style="cursor: pointer; font-size: large; margin-right: 0.5rem"
              @click="openModal('자재발주서 조회', materialRowData, materialColDefs)"
            ></i>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="3">
        <v-text-field label="자재명" v-model="materialName" placeholder="자재명" dense outlined readonly>
          <template #append-inner>
            <i
              class="fa-solid fa-magnifying-glass"
              style="cursor: pointer; font-size: large; margin-right: 0.5rem"
              @click="openModal('자재 조회', materialRowData2, materialColDefs2)"
            ></i>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="3">
        <v-text-field label="자재코드" v-model="materialCode" placeholder="자재코드" dense outlined readonly></v-text-field>
      </v-col>
      <v-col cols="3">
        <v-text-field label="담당자" v-model="manager" placeholder="담당자" dense outlined />
      </v-col>
      <v-col cols="3">
        <v-text-field label="발주일자" v-model="orderDate" type="date" dense outlined />
      </v-col>
      <v-col cols="3">
        <v-text-field label="납기일자" v-model="dueDate" type="date" dense outlined />
      </v-col>
      <v-col cols="6">
        <div class="radioDiv">
          <span class="mr-2">상태:</span>
          <v-radio-group v-model="status" inline hide-details>
            <v-radio label="대기" value="대기" />
            <v-radio label="진행중" value="진행중" />
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
  <UiParentCard title="자재발주서 목록">
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

// 모달
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '발행번호', headerName: '발행번호', flex: 1.5 },
  { field: '업체', headerName: '공급업체', flex: 1 },
  { field: '자재코드', headerName: '자재코드', flex: 1 },
  { field: '자재명', headerName: '자재명', flex: 0.8 },
  { field: '발주일자', headerName: '발주일자', flex: 1 },
  { field: '수량', headerName: '수량', flex: 0.8 },
  {
    field: '상태',
    flex: 0.8,
    cellStyle: (params) => {
      if (params.value === '대기') {
        return { color: 'black', fontWeight: 'bold' };
      } else if (params.value === '진행중') {
        return { color: 'blue', fontWeight: 'bold' };
      } else if (params.value == '완료') {
        return { color: 'red', fontWeight: 'bold' };
      }
      return null;
    }
  }
];
const materialColDefs2 = [
  { field: '자재코드', headerName: '자재코드', flex: 1 },
  { field: '자재명', headerName: '자재명', flex: 1 },
  { field: '자재유형', headerName: '자재유형', flex: 1 },
  { field: '규격', headerName: '규격', flex: 1 },
  { field: '단위', headerName: '단위', flex: 1 }
];
const materialRowData2 = ref([]);

const openModal = async (title) => {
  modalTitle.value = title;

  if (title == '자재 조회') {
    modalColDefs.value = materialColDefs2;

    const res = await axios.get('http://localhost:3000/materials');
    modalRowData.value = res.data.map((mat) => ({
      자재코드: mat.MAT_CODE,
      자재명: mat.MAT_NAME,
      자재유형: mat.MAT_TYPE,
      규격: mat.MAT_SIZE,
      단위: mat.MAT_UNIT
    }));
  } else if (title == '자재발주서 조회') {
    modalColDefs.value = materialColDefs;

    const res = await axios.get('http://localhost:3000/materials/order/select');
    console.log(res.data);
    modalRowData.value = res.data.map((item) => ({
      발행번호: item.PO_NO,
      업체: item.SUPPLYER,
      자재코드: item.MAT_CODE,
      자재명: item.MAT_NAME,
      발주일자: item.ORDER_DATE.slice(0, 10),
      수량: item.RECEIPT_QTY,
      상태: item.PO_STATUS
    }));
  }

  if (modalRef.value) {
    modalRef.value.open();
  }
};

// ag gird
const colDefs = ref([
  { field: '발행번호', flex: 1.5 },
  { field: '공급업체', flex: 1 },
  { field: '자재코드', flex: 1 },
  { field: '자재명', flex: 1 },
  { field: '자재유형', flex: 1 },
  { field: '규격', flex: 1.1 },
  { field: '단위', flex: 0.6 },
  { field: '발주일자', flex: 1 },
  { field: '납기일자', flex: 1 },
  { field: '담당자', flex: 1 },
  { field: '발주수량', flex: 1 },
  {
    field: '상태',
    flex: 1,
    cellStyle: (params) => {
      if (params.value === '대기') {
        return { color: 'black', fontWeight: 'bold' };
      } else if (params.value === '진행중') {
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
    const res = await axios.get('http://localhost:3000/materials/order/select');
    console.log(res.data);
    // 응답 데이터 바로 rowData에 할당
    rowData.value = res.data.map((item) => ({
      발행번호: item.PO_NO,
      공급업체: item.SUPPLYER,
      자재코드: item.MAT_CODE,
      자재명: item.MAT_NAME,
      자재유형: item.MAT_TYPE,
      규격: item.MAT_SIZE,
      단위: item.MAT_UNIT,
      발주일자: item.ORDER_DATE.slice(0, 10),
      납기일자: item.PO_DDAY.slice(0, 10),
      담당자: item.MANAGER,
      발주수량: item.RECEIPT_QTY,
      상태: item.PO_STATUS
    }));
  } catch (err) {
    console.error('발주 조회 실패:', err);
  }
});

const page = ref({ title: '자재발주서' });
const breadcrumbs = shallowRef([
  {
    title: '자재',
    disabled: true,
    href: '#'
  },
  {
    title: '자재발주서 조회',
    disabled: false,
    href: '#'
  }
]);

const issueNumber = ref('');
const materialName = ref('');
const materialCode = ref('');
const manager = ref('');
const orderDate = ref('');
const dueDate = ref('');
const status = ref('');

// 초기화
function inputReset() {
  issueNumber.value = '';
  materialName.value = '';
  materialCode.value = '';
  manager.value = '';
  orderDate.value = '';
  dueDate.value = '';
  status.value = '';
}

// 검색
const fileSelect = async () => {
  try {
    const params = {
      poNo: issueNumber.value || null,
      matName: materialName.value || null,
      matCode: materialCode.value || null,
      manager: manager.value || null,
      orderDate: orderDate.value || null,
      dueDate: dueDate.value || null,
      status: status.value || null
    };

    const res = await axios.post('http://localhost:3000/orderSearch', params);

    rowData.value = res.data.map((item) => ({
      발행번호: item.PO_NO,
      공급업체: item.SUPPLYER,
      자재코드: item.MAT_CODE,
      자재명: item.MAT_NAME,
      자재유형: item.MAT_TYPE,
      규격: item.MAT_SIZE,
      단위: item.MAT_UNIT,
      발주일자: item.ORDER_DATE?.slice(0, 10) || '',
      납기일자: item.PO_DDAY?.slice(0, 10) || '',
      담당자: item.MANAGER,
      발주수량: item.RECEIPT_QTY,
      상태: item.PO_STATUS
    }));
  } catch (err) {
    console.error('발주서 검색 실패:', err);
    alert('검색 중 오류가 발생했습니다.');
  }
};

function onModalConfirm(selectedRow) {
  if (!selectedRow) return;

  if (modalTitle.value === '자재발주서 조회') {
    issueNumber.value = selectedRow['발행번호'] || '';
  } else if (modalTitle.value === '자재 조회') {
    materialName.value = selectedRow['자재명'] || '';
    materialCode.value = selectedRow['자재코드'] || '';
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
