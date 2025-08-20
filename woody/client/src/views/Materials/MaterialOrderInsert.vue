<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="자재발주서 등록">
    <v-btn color="warning" class="mr-2" @click="openModal('자재 조회', materialRowData, materialColDefs)" style="margin-bottom: 2rem">
      자재 조회
    </v-btn>
    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" />

    <v-row class="mb-4">
      <v-col cols="6">
        <v-text-field label="공급처" v-model="form.supplier" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="담당자" v-model="form.manager" outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="발주일자" v-model="form.orderDate" type="date" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="납기일자" v-model="form.dueDate" type="date" dense outlined />
      </v-col>
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
import { ref, shallowRef, reactive } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz } from 'ag-grid-community';
import MoDal from '../common/NewModal.vue';
import axios from 'axios';

const quartz = themeQuartz;

// ----------------- 그리드 데이터 (독립) -----------------
const rowData = ref([]);

const colDefs = ref([
  { field: '자재명', flex: 1 },
  { field: '자재코드', flex: 1 },
  { field: '자재유형', flex: 1 },
  { field: '규격', flex: 1 },
  { field: '단위', flex: 1 },
  { field: '수량', editable: true, flex: 1 },
  { field: '비고', editable: true, flex: 1 }
]);

// ----------------- 폼 입력 필드 (유지) -----------------
const form = reactive({
  supplier: '',
  orderDate: new Date().toISOString().substring(0, 10),
  dueDate: '',
  manager: ''
});

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
  if (!Array.isArray(selectedRow)) selectedRow = [selectedRow];

  // 선택된 항목들 그리드에 추가
  selectedRow.forEach((row) => {
    rowData.value.push({
      자재명: row.자재명 || '',
      자재코드: row.자재코드 || '',
      자재유형: row.자재유형 || '',
      규격: row.규격 || '',
      단위: row.단위 || ''
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

async function submitForm() {
  try {
    if (!form.supplier || !form.manager || !form.orderDate || !form.dueDate) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    if (rowData.value.length === 0) {
      alert('자재를 선택해주세요.');
      return;
    }

    // 1. 발주서 데이터 (PO_NO는 Node에서 생성)
    const orderData = {
      SUPPLYER: form.supplier,
      ORDER_DATE: form.orderDate,
      PO_DDAY: form.dueDate,
      MANAGER: form.manager,
      PO_STATUS: '대기'
    };

    // 2. 상세 데이터
    const detailList = rowData.value.map((row) => ({
      MAT_CODE: row.자재코드,
      RECEIPT_QTY: row.수량 || 0
    }));

    // 3. POST 요청
    await axios.post('http://localhost:3000/material/order/insert', {
      orderData,
      detailList
    });

    alert('등록 되었습니다.');
    resetForm();
  } catch (error) {
    console.error(error);
    alert('등록 중 오류가 발생했습니다.');
  }
}

const page = ref({ title: '자재발주서' });
const breadcrumbs = shallowRef([
  { title: '자재', disabled: true, href: '#' },
  { title: '자재발주서 등록', disabled: false, href: '#' }
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
