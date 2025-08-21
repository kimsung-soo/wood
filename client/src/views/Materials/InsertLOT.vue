<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="LOT 등록">
    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" />
    <v-row class="mb-4">
      <v-btn
        color="warning"
        class="mr-2 button"
        @click="openModal('원자재 합격 수량 조회', materialRowData, materialColDefs)"
        style="margin-bottom: 2rem"
      >
        원자재 합격 수량 조회
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
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// 로그인한 세션의 정보들이 담김.
const authStore = useAuthStore();

const quartz = themeQuartz;

// ----------------- 그리드 데이터 -----------------
const rowData = ref([]);

const colDefs = ref([
  { field: '입고번호', flex: 1 },
  { field: '자재명', flex: 1 },
  { field: '자재코드', flex: 1 },
  { field: '규격', flex: 1 },
  { field: '단위', flex: 1 },
  { field: '발주수량', headerName: '발주 수량', flex: 1 },
  { field: '입고수량', headerName: '입고 수량', flex: 1 },
  { field: '합격수량', headerName: '합격 수량', flex: 1 }
]);

// ----------------- 폼 입력 필드 -----------------
const manager = authStore.user?.name || '';

// ----------------- 모달 (기본 정의) -----------------
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);

const materialColDefs = [
  { field: '입고번호', headerName: '입고번호', flex: 1.5 },
  { field: '자재명', headerName: '자재명', flex: 1 },
  { field: '자재코드', headerName: '자재코드', flex: 1 },
  { field: '규격', headerName: '규격', flex: 1.5 },
  { field: '단위', headerName: '단위', flex: 1 },
  { field: '합격수량', headerName: '합격수량', flex: 1 }
];
const materialRowData = ref([]);

const openModal = async (title) => {
  modalTitle.value = title;
  modalColDefs.value = materialColDefs;

  try {
    const res = await axios.get('http://localhost:3000/materialPass');
    modalRowData.value = res.data.map((mat) => ({
      입고번호: mat.RECEIPT_NO,
      자재명: mat.MAT_NAME,
      자재코드: mat.MAT_CODE,
      규격: mat.MAT_SIZE,
      단위: mat.MAT_UNIT,
      합격수량: mat.TOTAL_QTY,
      발주수량: mat.RECEIPT_QTY,
      입고수량: mat.RECEIVED_QTY
    }));

    if (modalRef.value) {
      modalRef.value.open();
    }
  } catch (error) {
    console.error(error);
    alert('원자재 합격품 목록을 불러오는 데 실패했습니다.');
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
      단위: row.단위 || '',
      발주수량: row.발주수량 || 0,
      입고수량: row.입고수량 || 0,
      합격수량: row.합격수량 || 0
    });
  });
}

// ----------------- 리셋 / 제출 -----------------
function resetForm() {
  manager.value = authStore.user?.name || '';
  rowData.value = [];
}

async function submitForm() {
  if (!manager.value) {
    alert('담당자를 입력해주세요.');
    return;
  }

  if (rowData.value.length === 0) {
    alert('등록할 LOT가 없습니다.');
    return;
  }

  try {
    // row별로 LOT 등록 요청
    rowData.value.map((row) => {
      return axios.post('http://localhost:3000/LOTInsert', {
        MAT_CODE: row.자재코드,
        MANAGER: manager.value,
        MAT_QTY: row.합격수량,
        RECEIPT_NO: row.입고번호
      });
    });

    const receiptNos = rowData.value.map((row) => row.입고번호);
    const uniqueReceiptNos = [...new Set(receiptNos)];

    await Promise.all(
      uniqueReceiptNos.map((receiptNo) => {
        return axios.put('http://localhost:3000/updateTMP', {
          RECEIPT_NO: receiptNo,
          STATUS: '입고 완료'
        });
      })
    );

    alert('LOT 등록 완료!');
    resetForm();
  } catch (error) {
    console.error(error);
    alert('LOT 등록 중 오류가 발생했습니다.');
  }
}

// 페이지/브레드크럼
const page = ref({ title: '재고' });
const breadcrumbs = shallowRef([
  { title: '자재', disabled: true, href: '#' },
  { title: 'LOT 등록', disabled: false, href: '#' }
]);
</script>

<style scoped>
.button {
  margin-top: 1rem;
  margin-left: 1rem;
}
</style>
