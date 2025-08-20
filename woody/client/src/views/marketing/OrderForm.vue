<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard>
    <div class="main-container">
      <div class="list-container">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="거래처명" v-model="order.client" outlined readonly @click="accModal" />
            </v-col>

            <v-col cols="6">
              <v-text-field label="납기일자" v-model="order.dDay" type="date" :min="today" outlined />
            </v-col>
          </v-row>
        </div>

        <v-row justify="end">
          <v-btn color="primary" class="mr-6" @click="itemModal">제품 추가</v-btn>
        </v-row>

        <br /><br />

        <ag-grid-vue
          :columnDefs="orderCol"
          :rowData="orderRow"
          :theme="quartz"
          style="height: 500px; width: 100%"
          @cell-value-changed="onCellValueChanged"
        />
        <br /><br />

        <v-row justify="end">
          <v-col cols="12">
            <v-text-field label="비고" v-model="order.reqNote" outlined />
          </v-col>
          <v-btn color="error" class="mr-6" @click="reset">초기화</v-btn>
          <v-btn color="primary" class="mr-6" @click="submit">등록</v-btn>
        </v-row>
      </div>
    </div>

    <MoDal ref="accModalRef" :title="accModalTitle" :rowData="accModalRowData" :colDefs="accModalColDefs" @confirm="accModalConfirm" />
    <MoDal ref="itemModalRef" :title="itemModalTitle" :rowData="itemModalRowData" :colDefs="itemModalColDefs" @confirm="itemModalConfirm" />
  </UiParentCard>
</template>

<script setup>
// 모듈
import { ref, shallowRef, watch } from 'vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import axios from 'axios';

// 컴포넌트
import MoDal from '../common/NewModal.vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

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

const formatNumber = (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toLocaleString());
const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(String(val).replaceAll(',', ''));
  return Number.isFinite(n) ? n : null;
};
/**/

/* 주문 등록 테이블 */
const orderCol = ref([
  {
    headerName: '제품 코드 / 제품명',
    flex: 1,
    editable: false,
    valueGetter: (p) => (p.data ? `${p.data.prdCode ?? ''} / ${p.data.prdName ?? ''}` : '')
  },
  {
    field: 'qty',
    headerName: '수량',
    flex: 1,
    editable: true,
    valueFormatter: (p) => formatNumber(p.value),
    valueParser: (p) => parseNumber(p.newValue),
    cellStyle: { textAlign: 'right' }
  },
  { field: 'note', headerName: '비고', flex: 1, editable: true },
  {
    headerName: '삭제',
    flex: 0.4,
    editable: false,
    cellRenderer: (p) => {
      const btn = document.createElement('button');
      btn.innerHTML = '🗑';
      btn.className = 'ag-grid-del-btn';
      btn.addEventListener('click', () => {
        const idx = orderRow.value.findIndex((r) => r.__rowId === p.data.__rowId);
        if (idx !== -1) orderRow.value.splice(idx, 1);
      });
      return btn;
    }
  }
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
const accModalRef = ref(null);
const accModalTitle = ref('');
const accModalRowData = ref([]);
const accModalColDefs = ref([]);

const accColData = [
  { field: 'cusId', headerName: '거래처 코드', flex: 1 },
  { field: 'cusName', headerName: '거래처명', flex: 1 }
];

const accModal = async () => {
  try {
    const rowData = await getAccRowData();
    openAccModal('거래처 조회', rowData, accColData);
  } catch (e) {
    console.error(e);
    alert('에러가 발생하였습니다.');
  }
};

const getAccRowData = async () => {
  try {
    const { data } = await axios.get('/api/marketing/getacclist');
    return data ?? [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

const openAccModal = (title, rowData, colData) => {
  accModalTitle.value = title;
  accModalColDefs.value = colData;
  accModalRowData.value = rowData;
  if (accModalRef.value) {
    accModalRef.value.open();
  }
};

const accModalConfirm = (selectedRow) => {
  selectedAccount.value = selectedRow;
};
/**/

/* 제품 모달 */
const itemModalRef = ref(null);
const itemModalTitle = ref('');
const itemModalRowData = ref([]);
const itemModalColDefs = ref([]);

const itemColData = [
  { field: 'prdCode', headerName: '제품 코드', flex: 1 },
  { field: 'prdName', headerName: '제품명', flex: 1 }
];

const itemModal = async () => {
  try {
    const rowData = await getItemRowData();
    openItemModal('제품 조회', rowData, itemColData);
  } catch (e) {
    console.error(e);
    alert('에러가 발생하였습니다.');
  }
};

const getItemRowData = async () => {
  try {
    const { data } = await axios.get('/api/marketing/getitemlist');
    // 이미 선택된 상품 제외
    return (data ?? []).filter((d) => !orderRow.value.some((r) => r.prdCode === d.prdCode));
  } catch (e) {
    console.error(e);
    return [];
  }
};

const openItemModal = (title, rowData, colData) => {
  itemModalTitle.value = title;
  itemModalColDefs.value = colData;
  itemModalRowData.value = rowData;
  if (itemModalRef.value) {
    itemModalRef.value.open();
  }
};

const itemModalConfirm = (row) => {
  orderRow.value.push({
    __rowId: Math.random().toString(36).slice(2) + Date.now().toString(36),
    prdCode: row.prdCode,
    prdName: row.prdName,
    qty: 1,
    note: ''
  });
  selectedItem.value = row;
};
/**/

const order = ref({
  client: '',
  dDay: '',
  reqNote: ''
});

const reset = () => {
  order.value = { client: '', dDay: '', reqNote: '' };
  orderRow.value = [];
  selectedAccount.value = null;
  selectedItem.value = null;
};

const submit = async () => {
  const odr = order.value;
  const rows = orderRow.value;

  if (!selectedAccount.value?.cusId) {
    alert('거래처를 선택해주세요.');
    return;
  }
  if (!odr.dDay) {
    alert('납기일자를 입력해주세요.');
    return;
  }
  if (rows.length === 0) {
    alert('제품을 추가해주세요.');
    return;
  }

  if (!confirm('등록하시겠습니까?')) {
    return;
  }

  const payload = {
    cusId: selectedAccount.value.cusId, // 거래처 코드
    reqDDay: odr.dDay, // 납기일 (YYYY-MM-DD)
    reqNote: odr.reqNote ?? '', // 비고
    items: rows.map((r) => ({
      prdId: r.prdCode, // 제품 코드
      reqQty: Number(r.qty) || 0 // 주문 수량
    }))
  };

  try {
    const { data } = await axios.post('/api/marketing/insertorder', payload);
    if (data.affectedRows > 0) {
      alert('등록되었습니다.');
      reset();
    } else {
      alert('등록 실패');
    }
  } catch (e) {
    console.error(e);
    alert('등록 중 오류가 발생했습니다.');
  }
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
