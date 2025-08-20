<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="출하지시서 등록">
    <v-row class="mb-4">
      <v-col cols="6">
        <v-text-field label="주문서번호" v-model="form.order" dense outlined readonly>
          <template #append-inner>
            <i
              class="fa-solid fa-magnifying-glass"
              style="cursor: pointer; font-size: large; margin-right: 0.5rem"
              @click="openModal('주문서 조회', materialRowData, materialColDefs)"
            ></i>
          </template>
        </v-text-field>
        <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" />
      </v-col>
      <v-col cols="6">
        <v-text-field label="거래처" v-model="form.customer" outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="납기일자" v-model="form.dueDate" type="date" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="출하지시일자" v-model="form.shipDate" type="date" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="작성자" v-model="form.writer" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-select label="창고명" v-model="form.wrName" :items="wrOptions" dense outlined />
      </v-col>
      <v-row justify="end">
        <v-btn color="warning" class="mr-3" @click="openModal1('입고 제품 조회', materialRowData1, materialColDefs1)">입고 조회</v-btn>
        <MoDal ref="modalRef1" :title="modalTitle1" :rowData="modalRowData1" :colDefs="modalColDefs1" @confirm="modalConfirm" />
      </v-row>
    </v-row>

    <ag-grid-vue
      :rowData="rowData"
      :columnDefs="colDefs"
      :theme="quartz"
      style="height: 200px; width: 100%"
      @cell-value-changed="onCellValueChanged"
      @grid-ready="onGridReady"
    >
    </ag-grid-vue>

    <!-- 버튼 -->
    <v-row justify="end" class="button">
      <v-btn color="error" class="mr-2" @click="resetForm">초기화</v-btn>
      <v-btn color="primary" @click="submitForm">등록</v-btn>
    </v-row>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, reactive, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz } from 'ag-grid-community';
import MoDal from '../common/NewModal.vue';
import axios from 'axios';

const quartz = themeQuartz;
const wrOptions = ref([]);
onMounted(() => {
  modalList();
  fetchCommonCodes();
});
// 공통코드 데이터를 가져오는 함수
const fetchCommonCodes = async () => {
  try {
    // 부서 공통코드 API 호출 (예시)
    const authRes = await axios.get('http://localhost:3000/wrNameSelect');
    wrOptions.value = authRes.data.map((item) => item.WR_NAME); // `code_name`을 배열에 담기
  } catch (error) {
    console.error('공통코드 데이터를 불러오는 데 실패했습니다:', error);
  }
};

// ----------------- 그리드 데이터 (독립) -----------------
const rowData = ref([]);

const colDefs = ref([
  { field: '제품코드', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: '제품유형', flex: 1 },
  { field: '출하수량', editable: true, flex: 1 },
  { field: '입고일자', flex: 1 },
  { field: 'LOT번호', flex: 1 }
]);

// ----------------- 폼 입력 필드 (유지) -----------------
const form = reactive({ order: '', customer: '', dueDate: '', shipDate: '', writer: '', wrName: '' });

// ----------------- 모달 (기본 정의) -----------------
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);

// 모달 입고 제품들
const modalRef1 = ref(null);
const modalTitle1 = ref('');
const modalRowData1 = ref([]);
const modalColDefs1 = ref([]);

const materialRowData1 = ref([]);
const materialColDefs1 = [
  { field: 'LOT번호', headerName: 'LOT번호', flex: 1 },
  { field: '제품코드', headerName: '제품코드', flex: 1 },
  { field: '제품명', headerName: '제품명', flex: 1 },
  { field: '제품유형', headerName: '제품유형', flex: 1 },
  { field: '재고수량', headerName: '재고수량', flex: 1 },
  { field: '입고일자', headerName: '입고일자', flex: 1 }
];

const modalList = async () => {
  const res = await axios.get('http://localhost:3000/lotSelect');
  materialRowData1.value = res.data.map((mat) => ({
    LOT번호: mat.PRD_LOT,
    제품코드: mat.PRD_CODE,
    제품명: mat.PRD_NAME,
    제품유형: mat.PRD_TYPE,
    재고수량: mat.RECEIVED_QTY,
    입고일자: mat.RECEIVED_DATE
  }));
};

const openModal1 = async (title, rowData, colDefs) => {
  console.log('hi');
  modalTitle1.value = title;
  modalRowData1.value = rowData;
  modalColDefs1.value = colDefs;
  if (modalRef1.value) {
    modalRef1.value.open();
  }
};

function modalConfirm(selectedRow) {
  if (!Array.isArray(selectedRow)) selectedRow = [selectedRow];

  // 선택된 항목들 그리드에 추가
  selectedRow.forEach((row) => {
    rowData.value.push({
      제품명: row.제품명 || '',
      제품코드: row.제품코드 || '',
      제품유형: row.제품유형 || '',
      출하수량: row.재고수량 || '',
      입고일자: row.입고일자 || '',
      LOT번호: row.LOT번호
    });
  });
}

// ----------------- 리셋 / 제출 -----------------
function resetForm() {
  // 폼 필드 초기화
  form.supplier = '';
  form.orderDate = '';
  form.dueDate = '';
  form.manager = '';

  rowData.value = [];
}

// async function submitForm() {
//   try {
//     if (!form.supplier || !form.manager || !form.orderDate || !form.dueDate) {
//       alert('모든 필드를 입력해주세요.');
//       return;
//     }
//     if (rowData.value.length === 0) {
//       alert('자재를 선택해주세요.');
//       return;
//     }

//     // 1. 발주서 데이터 (PO_NO는 Node에서 생성)
//     const orderData = {
//       SUPPLYER: form.supplier,
//       ORDER_DATE: form.orderDate,
//       PO_DDAY: form.dueDate,
//       MANAGER: form.manager,
//       PO_STATUS: '대기'
//     };

//     // 2. 상세 데이터
//     const detailList = rowData.value.map((row) => ({
//       MAT_CODE: row.자재코드,
//       RECEIPT_QTY: row.수량 || 0
//     }));

//     // 3. POST 요청
//     await axios.post('http://localhost:3000/material/order/insert', {
//       orderData,
//       detailList
//     });

//     alert('등록 되었습니다.');
//     resetForm();
//   } catch (error) {
//     console.error(error);
//     alert('등록 중 오류가 발생했습니다.');
//   }
// }

const page = ref({ title: '출하지시서 등록' });
const breadcrumbs = shallowRef([
  { title: '제품 입출고', disabled: true, href: '#' },
  { title: '출하지시서 등록', disabled: false, href: '#' }
]);
</script>

<style scoped>
.margin {
  margin-top: 2.5rem;
}

.button {
  margin-top: 1.5rem;
}
</style>
