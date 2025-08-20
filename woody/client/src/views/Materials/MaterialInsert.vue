<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="자재 입고">
    <v-row class="mb-4">
      <v-col cols="4">
        <v-text-field label="발행번호" v-model="form.issueNumber" dense outlined readonly />
      </v-col>
      <v-btn
        color="warning"
        class="mr-2 button"
        @click="openModal('자재발주서 조회', materialRowData, materialColDefs)"
        style="margin-bottom: 2rem"
      >
        자재발주서 조회
      </v-btn>
      <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" />
    </v-row>
    <v-row class="mb-4">
      <v-col cols="6">
        <v-text-field label="입고일자" v-model="form.insertDate" type="date" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="업체명" v-model="form.name" dense outlined readonly />
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

    <v-row class="mb-4 margin">
      <v-col cols="6">
        <v-text-field label="담당자" v-model="form.manager" outlined />
      </v-col>
    </v-row>

    <!-- 버튼 -->
    <v-row justify="end">
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

const rowData = ref([]);

const colDefs = ref([
  { field: '자재명', flex: 1 },
  { field: '자재코드', flex: 1 },
  { field: '규격', flex: 1 },
  { field: '단위', flex: 1 },
  { field: '발주수량', flex: 1 },
  { field: '업데이트수량', headerName: '현재 입고된 수량', flex: 1 },
  { field: '입고수량', headerName: '입고할 수량', editable: true, flex: 1 }
]);

// ----------------- 폼 입력 필드 -----------------
const form = reactive({
  issueNumber: '',
  insertDate: '',
  name: '',
  manager: ''
});

// ----------------- 모달 (기본 정의) -----------------
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '발행번호', headerName: '발행번호', flex: 1.5 },
  { field: '업체', headerName: '공급업체', flex: 1 },
  { field: '자재코드', headerName: '자재코드', flex: 1 },
  { field: '자재명', headerName: '자재명', flex: 1 },
  { field: '발주수량', headerName: '발주수량', flex: 1 },
  {
    field: '상태',
    headerName: '상태',
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

const openModal = async (title) => {
  modalTitle.value = title;
  modalColDefs.value = materialColDefs;

  const res = await axios.get('http://localhost:3000/materials/order/select');
  modalRowData.value = res.data.map((item) => ({
    발행번호: item.PO_NO,
    업체: item.SUPPLYER,
    자재코드: item.MAT_CODE,
    자재명: item.MAT_NAME,
    발주수량: item.RECEIPT_QTY,
    상태: item.PO_STATUS,
    규격: item.MAT_SIZE,
    단위: item.MAT_UNIT,
    업데이트수량: item.UPDATE_QTY,
    자재유형: item.MAT_TYPE
  }));

  if (modalRef.value) {
    modalRef.value.open();
  }
};

function onModalConfirm(selectedRow) {
  // 폼에 발행번호 / 업체명 반영
  form.issueNumber = selectedRow.발행번호 || '';
  form.name = selectedRow.업체 || '';

  const today = new Date();
  form.insertDate = today.toISOString().slice(0, 10);

  // 그리드 데이터에 추가
  rowData.value.push({
    자재명: selectedRow.자재명 || '',
    자재코드: selectedRow.자재코드 || '',
    규격: selectedRow.규격 || '',
    단위: selectedRow.단위 || '',
    발주수량: selectedRow.발주수량 || 0,
    업데이트수량: selectedRow.업데이트수량 || 0,
    자재유형: selectedRow.자재유형 || ''
  });
}

// ----------------- 리셋 / 제출 -----------------
function resetForm() {
  // 폼 필드 초기화
  form.issueNumber = '';
  form.insertDate = '';
  form.manager = '';
  form.name = '';
  rowData.value = [];
}

async function submitForm() {
  try {
    if (!form.issueNumber || !form.insertDate || !form.manager || !form.name) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    for (const row of rowData.value) {
      if ((row.입고수량 || 0) > (row.발주수량 || 0) - (row.업데이트수량 || 0)) {
        alert(`자재 "${row.자재명}"의 입고수량이 발주수량보다 많을 수 없습니다.`);
        return;
      }
    }

    for (const row of rowData.value) {
      const status = row.자재유형 == '원자재' ? '검수 대기' : '완료';

      // 1) MAT_IN_TMP에 등록 (모든 자재)
      await axios.post('http://localhost:3000/materialInsert', {
        PO_NO: form.issueNumber,
        RECEIPT_DATE: form.insertDate,
        SUPPLYER: form.name,
        MANAGER: form.manager,
        MAT_CODE: row.자재코드,
        RECEIPT_QTY: row.발주수량,
        RECEIVED_QTY: row.입고수량,
        TMP_STATUS: status
      });

      // 2) 부자재만 MATERIAL_RECEIPT에 등록
      if (row.자재유형 && row.자재유형 !== '원자재') {
        await axios.post('http://localhost:3000/LOTInsert', {
          MAT_CODE: row.자재코드,
          MANAGER: form.manager,
          MAT_QTY: row.입고수량,
          RECEIPT_NO: row.입고번호
        });
      }
    }

    alert('등록 되었습니다.');
    resetForm();
  } catch (error) {
    console.error(error);
    alert('등록 중 오류가 발생했습니다.' + error);
  }
}

const page = ref({ title: '입고' });
const breadcrumbs = shallowRef([
  { title: '자재', disabled: true, href: '#' },
  { title: '입고 등록 ', disabled: false, href: '#' }
]);
</script>

<style scoped>
.margin {
  margin-top: 2.5rem;
}

.button {
  margin-top: 1rem;
  margin-left: 3rem;
}
</style>
