<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="재공품 등록">
    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" />
    <v-row class="mb-4">
      <v-btn
        color="warning"
        class="mr-2 button"
        @click="openModal('원자재 합격 수량 조회', materialRowData, materialColDefs)"
        style="margin-bottom: 2rem"
      >
        공정 조회
      </v-btn>
      <v-col cols="3">
        <v-text-field label="담당자" v-model="manager" outlined style="margin-left: 2rem" />
      </v-col>
    </v-row>
    <ag-grid-vue
      :rowData="rowData"
      :columnDefs="colDefs"
      :theme="quartz"
      style="height: 200px; width: 100%"
      @cell-value-changed="onCellValueChanged"
    >
    </ag-grid-vue>

    <!-- 버튼 -->
    <v-row justify="end" style="margin-top: 2rem">
      <v-btn color="error" class="mr-2" @click="resetForm">초기화</v-btn>
      <v-btn color="primary" @click="submitForm">등록</v-btn>
    </v-row>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz } from 'ag-grid-community';
import MoDal from '../common/NewModal.vue';

const quartz = themeQuartz;

// ----------------- 그리드 데이터 -----------------
const rowData = ref([]);

const colDefs = ref([
  { field: '재공품코드', flex: 1 },
  { field: '명칭', flex: 1 },
  { field: '규격', flex: 1 },
  { field: '단위', flex: 1 },
  { field: '유형', flex: 1 },
  { field: '재공품 수량', flex: 1 },
  { field: 'LOT 번호', flex: 1 }
]);

// ----------------- 폼 입력 필드 -----------------
const manager = ref('');

// ----------------- 모달 -----------------
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);

const materialColDefs = [
  { field: '발행번호', headerName: '발행번호', flex: 1.2 },
  { field: '업체', headerName: '공급업체', flex: 1 },
  { field: '자재명', headerName: '자재명', flex: 0.8 },
  { field: '자재코드', headerName: '자재코드', flex: 0.8 },
  { field: '규격', headerName: '규격', flex: 0.6 },
  { field: '발주일자', headerName: '발주일자', flex: 1 },
  { field: '수량', headerName: '수량', flex: 0.6 },
  { field: '상태', headerName: '상태', flex: 0.6 }
];

const materialRowData = ref([
  {
    발행번호: '20250808-001',
    업체: '원목세상',
    자재명: '원목',
    규격: 'mm',
    자재코드: 'ZCB-558',
    발주일자: '2025-08-08',
    수량: 10,
    상태: '완료'
  },
  {
    발행번호: '20250808-002',
    업체: '합판월드',
    자재명: '합판',
    규격: 'mm',
    자재코드: 'ABC-123',
    발주일자: '2025-08-08',
    수량: 5,
    상태: '완료'
  }
]);

const openModal = (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// ----------------- 모달 선택 확인 -----------------
function onModalConfirm(selectedRows) {
  if (!Array.isArray(selectedRows)) selectedRows = [selectedRows];

  // 선택된 항목들 그리드에 추가
  selectedRows.forEach((row) => {
    rowData.value.push({
      입고번호: row.입고번호 || '',
      자재명: row.자재명 || '',
      자재코드: row.자재코드 || '',
      규격: row.규격 || '',
      단위: row.단위 || 'EA',
      발주수량: row.수량 || 0,
      입고수량: 0,
      합격수량: 0,
      LOT번호: ''
    });
  });
}

// ----------------- 리셋 / 제출 -----------------
function resetForm() {
  manager.value = '';
  rowData.value = [];
  alert('초기화 되었습니다.');
}

function submitForm() {
  console.log('제출된 폼:', { form: {}, items: rowData.value });
  alert('폼 제출 성공');
}

// 페이지/브레드크럼
const page = ref({ title: '재고' });
const breadcrumbs = shallowRef([
  { title: '자재', disabled: true, href: '#' },
  { title: '재공품 등록', disabled: false, href: '#' }
]);
</script>

<style scoped>
.button {
  margin-top: 1rem;
  margin-left: 1rem;
}
</style>
