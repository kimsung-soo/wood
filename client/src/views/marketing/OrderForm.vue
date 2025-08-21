<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard title="주문서 등록">
    <div class="main-container">
      <div class="list-container">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field
                label="거래처명"
                v-model="order.client"
                outlined
                readonly
                @click="accModal('거래처 조회', materialRowData, materialColDefs)"
              />
            </v-col>
            <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
            <v-col cols="6">
              <v-text-field label="주문일자" v-model="order.rDay" type="date" outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="납기일자" v-model="order.dDay" type="date" :min="today" outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="order.writer" outlined />
            </v-col>
          </v-row>
        </div>

        <v-row justify="end">
          <v-btn color="warning" class="mr-6" @click="itemModal('제품 조회', itemRowData, itemColDefs)">제품 추가</v-btn>
        </v-row>

        <br /><br />

        <ag-grid-vue
          :columnDefs="orderCol"
          :rowData="orderRow"
          :theme="quartz"
          style="height: 300px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          :rowSelection="rowSelection"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReadyMat"
        />
        <br /><br />

        <v-row justify="end">
          <v-btn color="error" class="mr-6" @click="reset">초기화</v-btn>
          <v-btn color="primary" class="mr-6" @click="submit">등록</v-btn>
        </v-row>
      </div>
    </div>

    <MoDal ref="itemModalRef" :title="itemModalTitle" :rowData="itemModalRowData" :colDefs="itemModalColDefs" @confirm="itemModalConfirm" />
  </UiParentCard>
</template>

<script setup>
// 모듈
import { ref, shallowRef, watch, onMounted } from 'vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import axios from 'axios';

// 컴포넌트
import MoDal from '../common/NewModal.vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
const rowSelection = ref({
  mode: 'multiRow'
});
const order = ref({
  dDay: '',
  rDay: '',
  writer: '',
  client: '',
  client_code: ''
});
// 페이지 상단 Title, BreadCrumb, Theme
const breadcrumbs = shallowRef([
  { title: '영업', disabled: true, href: '#' },
  { title: '주문서', disabled: true, href: '#' },
  { title: '주문서 등록', disabled: false, href: '#' }
]);

const page = ref({ title: '주문서 등록' });
const quartz = themeQuartz;

/* 선언부 */
const today = new Date().toISOString().split('T')[0]; // 오늘 날짜
const selectedAccount = ref(null); // 선택된 거래처
const selectedItem = ref(null); // 선택된 제품

watch(selectedAccount, (val) => {
  order.value.client = val?.cusName ?? '';
});

onMounted(() => {
  modalList();
  modalList2();
});

const gridApiMat = ref(null); // mat 그리드 API 저장용

const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};

/* 주문 등록 테이블 */
const orderCol = ref([
  { field: '제품코드', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: '제품유형', flex: 1 },
  { field: '규격', flex: 1 },
  { field: '주문수량', flex: 1, editable: true, cellDataType: 'number' },
  { field: '단위', flex: 1 }
]);

const orderRow = ref([]);
// 수량 값 검증
const onCellValueChanged = (params) => {
  if (params.colDef.field === 'qty') {
    const v = Number(String(params.newValue).toString().replaceAll(',', ''));
    if (!Number.isFinite(v) || v <= 0) {
      params.data.qty = 1;
      params.api.applyTransaction({ update: [params.data] });
    } else {
      params.data.qty = v;
      params.api.applyTransaction({ update: [params.data] });
    }
  }
};
/**/

/* 거래처 모달 */
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '거래처코드', headerName: '거래처코드', flex: 1 },
  { field: '거래처명', headerName: '거래처명', flex: 1 },
  { field: '거래담당자', headerName: '거래담당자', flex: 1 }
];

const materialRowData = ref([]);

const modalList = async () => {
  try {
    const res = await axios.get('http://localhost:3000/reqCusModal');
    materialRowData.value = res.data.map((prd) => ({
      거래처코드: prd.CUS_ID,
      거래처명: prd.CUS_NAME,
      거래담당자: prd.CUS_MANAGER
    }));
  } catch (e) {
    console.error(e);
    return;
  }
};

//모달 열때 데이터값 자식컴포넌트로
const accModal = async (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

const modalConfirm = (selectedRow) => {
  order.value.client = selectedRow.거래처명;
  order.value.client_code = selectedRow.거래처코드;
  console.log(order.value.client_code);
};
/**/

/* 제품 모달 */
const itemModalRef = ref(null);
const itemModalTitle = ref('');
const itemModalRowData = ref([]);
const itemModalColDefs = ref([]);

const itemColDefs = [
  { field: '제품코드', headerName: '제품코드', flex: 1 },
  { field: '제품명', headerName: '제품명', flex: 1 },
  { field: '제품유형', headerName: '제품유형', flex: 1 },
  { field: '규격', headerName: '규격', flex: 1 },
  { field: '단위', headerName: '단위', flex: 1 }
];
const itemRowData = ref([]);

const modalList2 = async () => {
  try {
    const res = await axios.get('http://localhost:3000/reqPrdModal');
    itemRowData.value = res.data.map((prd) => ({
      제품코드: prd.PRD_CODE,
      제품명: prd.PRD_NAME,
      제품유형: prd.PRD_TYPE,
      규격: prd.PRD_SIZE,
      단위: prd.PRD_UNIT
    }));
  } catch (e) {
    console.error(e);
    return;
  }
};

const itemModal = async (title, rowData, colData) => {
  itemModalTitle.value = title;
  itemModalColDefs.value = colData;
  itemModalRowData.value = rowData;
  if (itemModalRef.value) {
    itemModalRef.value.open();
  }
};

const itemModalConfirm = (row) => {
  console.log(row);
  orderRow.value.unshift(row);
};
/**/

const reset = () => {
  order.value = { client: '', dDay: '', rDay: '' };
  orderRow.value = [];
  selectedAccount.value = null;
  selectedItem.value = null;
};

// 저장버튼
const submit = async () => {
  if (!order.value.client || !order.value.dDay) {
    alert('거래처와 납기일을 확인하세요');
    return;
  }
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (selectedRows.length === 0) {
    alert('등록할 제품을 선택하세요');
    return;
  }
  const invalidQty = selectedRows.some((row) => !row.주문수량 || row.주문수량 <= 0);
  if (invalidQty) {
    alert('모든 제품의 수량을 입력해주세요');
    return;
  }

  const condition = {
    CUS_ID: order.value.client_code,
    REQ_DATE: order.value.rDay,
    REQ_DDAY: order.value.dDay,
    WRITER: order.value.writer
  };
  const res = await axios.post('http://localhost:3000/reqInsert', condition);
  console.log(res);

  const payload = selectedRows.map((r) => ({
    REQ_QTY: r.주문수량,
    PRD_CODE: r.제품코드
  }));
  const res2 = await axios.post('http://localhost:3000/reqDetailInsert', payload);
  console.log(res2);
  alert('주문서 등록완료');
};
</script>

<style scoped>
.main-container {
  display: flex;
  gap: 20px;
  padding: 0 10px;
}
.list-container {
  flex: 1 1 50%;
  min-width: 500px;
}
.clickable-cell {
  cursor: pointer;
  text-decoration: underline;
}
.ag-grid-del-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}
.ag-grid-del-btn:hover {
  color: red;
}
</style>
