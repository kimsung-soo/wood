<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="자재반품요청서 등록">
    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" />
    <v-row class="mb-4">
      <v-btn
        color="warning"
        class="mr-2 button"
        @click="openModal('자재검수성적서 조회', materialRowData, materialColDefs)"
        style="margin-bottom: 2rem"
      >
        불량품 조회
      </v-btn>
    </v-row>
    <v-row class="mb-4">
      <v-col cols="6">
        <v-text-field label="작성일자" v-model="form.insertDate" type="date" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="회수요청일자" v-model="form.reDate" type="date" dense outlined />
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

    <v-row class="mb-4 ggg">
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

// ----------------- 그리드 데이터 -----------------
const rowData = ref([]);

const colDefs = ref([
  { field: '입고번호', flex: 1.5 },
  { field: '자재명', flex: 1 },
  { field: '자재코드', flex: 1 },
  { field: '규격', flex: 1 },
  { field: '단위', flex: 1 },
  { field: '수량', flex: 1 },
  { field: '사유', flex: 1.5 }
]);

// ----------------- 폼 입력 필드 -----------------
const form = reactive({
  insertDate: new Date().toISOString().slice(0, 10),
  reDate: '',
  manager: ''
});

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
  { field: '단위', headerName: '단위', flex: 0.8 },
  { field: '수량', headerName: '수량', flex: 1 },
  {
    field: '상태',
    flex: 0.8,
    cellStyle: (params) => {
      if (params.value === '등록') {
        return { color: 'black', fontWeight: 'bold' };
      } else if (params.value === '완료') {
        return { color: 'red', fontWeight: 'bold' };
      }
      return null;
    }
  }
];
const materialRowData = ref([]);

const openModal = async (title) => {
  modalTitle.value = title;
  modalColDefs.value = materialColDefs;

  try {
    const res = await axios.get('http://localhost:3000/failMaterials');
    modalRowData.value = res.data
      .filter((mat) => mat.MAT_STATUS !== '완료')
      .map((mat) => ({
        입고번호: mat.RECEIPT_NO,
        자재명: mat.MAT_NAME,
        자재코드: mat.MAT_CODE,
        규격: mat.MAT_SIZE,
        단위: mat.MAT_UNIT,
        수량: mat.TOTAL_QTY,
        상태: mat.MAT_STATUS,
        사유: mat.RJT_REASON
      }));

    if (modalRef.value) {
      modalRef.value.open();
    }
  } catch (error) {
    console.error('자재 목록을 가져오는 중 오류가 발생했습니다:' + error);
    alert('자재 목록을 불러오는 데 실패했습니다.');
  }
};

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
      수량: row.수량 || 0,
      사유: row.사유 || ''
    });
  });
}

// ----------------- 리셋 / 제출 -----------------
function resetForm() {
  form.manager = '';
  form.insertDate = '';
  form.reDate = '';
  rowData.value = [];
}

async function submitForm() {
  try {
    if (!form.manager || !form.insertDate || !form.reDate) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    // 1. 반품요청서 기본 데이터
    const requestData = {
      CREATED_DATE: new Date().toISOString().slice(0, 10), // 오늘 날짜
      RR_DATE: form.reDate,
      MANAGER: form.manager,
      RE_STATUS: '등록'
    };

    // 2. 상세 데이터
    const detailList = rowData.value.map((row) => ({
      MAT_CODE: row.자재코드,
      RE_QTY: row.수량 || 0,
      RECEIPT_NO: row.입고번호
    }));

    // 3. POST 요청
    await axios.post('http://localhost:3000/return/request/insert', {
      requestData,
      detailList
    });

    alert('등록 되었습니다.');
    resetForm();
  } catch (error) {
    console.error(error);
    alert('등록 중 오류가 발생했습니다.');
  }
}

// 페이지/브레드크럼
const page = ref({ title: '불량품' });
const breadcrumbs = shallowRef([
  { title: '자재', disabled: true, href: '#' },
  { title: '자재반품요청서 등록 ', disabled: false, href: '#' }
]);
</script>

<style scoped>
.ggg {
  margin-top: 1.5rem;
}
.button {
  margin-top: 1rem;
  margin-left: 1rem;
}
</style>
