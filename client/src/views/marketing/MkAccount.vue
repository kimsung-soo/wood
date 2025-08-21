<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="거래처등록 및 조회">
    <div class="main-container">
      <div class="list-container">
        <h5>거래처등록</h5>
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 90px; width: 100%"
          @cell-value-changed="onCellValueChanged"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>

        <br /><br />
        <!-- <div class="d-flex align-right mb-4">
          <v-text-field label="검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
          <v-btn color="darkText" @click="searchData">검색</v-btn>
        </div> -->

        <v-row justify="end">
          <v-btn color="primary" class="mr-6" @click="submitForm">등록</v-btn>
        </v-row>

        <h5>거래처목록</h5>
        <ag-grid-vue
          :rowData="rowData2"
          :columnDefs="colDefs2"
          :theme="quartz"
          style="height: 360px; width: 100%"
          @cell-value-changed="onCellValueChanged"
        >
        </ag-grid-vue>
      </div>
      <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
      <div class="d-flex align-right mb-4"></div>
    </div>
  </UiParentCard>

  <!-- <p>{{ rowData1 }}</p> -->
</template>

<script setup>
// 기존 스크립트 내용은 동일합니다.
import { ref, shallowRef, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useProcessSimStore } from '@/stores/useProcessSimStore'; // 수정 가능 파일 아님: import만
import { startSimTicker, stopSimTicker } from '@/sim/simTicker.js'; // simTicker.js는 건드리지 않음
import axios from 'axios';
// 모달 임포트
import MoDal from '../common/NewModal.vue'; // 수정된 부분: 모달 컴포넌트 임포트
const quartz = themeQuartz;
const store = useProcessSimStore();

// const toYn = (v) => (v === '여' || v === 'Y' || v === 1 || v === '1' || v === true ? 'Y' : 'N');
// const toUseLabel = (v) => (v === 'Y' || v === 1 || v === '1' || v === true ? '사용' : '미사용');

function tryStartSimTicker() {
  // tick 없음 → 시작 안 함 (오류 예방)
  if (typeof store.tick !== 'function') {
    console.warn('[sim] store.tick() 없음 → ticker 미시작');
    return;
  }
  if (typeof window !== 'undefined' && typeof requestAnimationFrame === 'function') {
    startSimTicker();
  }
}

onMounted(tryStartSimTicker);
onActivated(tryStartSimTicker); // <KeepAlive> 대응
onBeforeUnmount(() => stopSimTicker());
onDeactivated(() => stopSimTicker());

// const form = ref({ writer: '' }, { addDate: '' }, { bomVer: '' }, { bomCode: '' });
const selectedRowIndex = ref(null);
onMounted(() => {
  // 초기 데이터 로드
  loadPartners();
});
const submitForm = async () => {
  // console.log(rowData1.value[0].거래처코드);

  /*
  [ { 거래처유형, 거래처명, 담당자 ...}, { 거래처유형, 거래처명, 담당자 ...}, { 거래처유형, 거래처명, 담당자 ...} ]
  [0]                                  [1]                                [2]
  */

  // 데이터 유효성 체크
  if (!rowData1.value[0].거래처유형 || !rowData1.value[0].거래처명 || !rowData1.value[0].담당자 || !rowData1.value[0].사용여부) {
    alert('비어있는 항목이 존재합니다.');
    return;
  }
  if (!(rowData1.value[0].사용여부 === '여' || rowData1.value[0].사용여부 === '부')) {
    alert('여/부 확인');
    return;
  }

  // Confirm 창
  if (!confirm('등록하시겠습니까?')) {
    return;
  }

  // 거래처 정보 객체 형태로
  const addAcc = {
    cusType: rowData1.value[0].거래처유형,
    cusName: rowData1.value[0].거래처명,
    cusManager: rowData1.value[0].담당자,
    cusUse: rowData1.value[0].사용여부 === '여' ? 1 : 0, // "여" 일 때 1 "부" 일 때 0
    cusNote: rowData1.value[0].비고
  };

  // Express 서버로 POST 요청 ( DB에 거래처 등록 )
  try {
    const { data } = await axios.post('/api/marketing/insertacc', addAcc);
    // 영향받은 행이 0 보다 클 경우 성공
    if (data.affectedRows > 0) {
      await loadPartners();
      alert('성공적으로 등록되었습니다.');
      // 성공적으로 등록시 값 초기화
      Object.keys(rowData1.value[0]).forEach((key) => {
        rowData1.value[0][key] = '';
      });
    } else {
      alert('데이터 등록 실패');
    }
    return;
  } catch (e) {
    console.error(e);
    alert('오류가 발생하였습니다.');
    return;
  }
};

// 거래처등록테이블
const rowData1 = ref([
  {
    // 거래처코드: '자동생성',
    거래처유형: null,
    // 사업자등록번호: '수기입력',
    거래처명: null,
    담당자: null,
    // 대표자: '수기입력',
    사용여부: null,
    비고: null
  }
]);

const colDefs1 = ref([
  // { field: '거래처코드', flex: 1, editable: false },
  {
    field: '거래처유형',
    flex: 1,
    cellClass: 'clickable-cell',
    headerClass: 'with-mag',
    editable: false,
    onCellClicked: (params) => {
      selectedRowIndex.value = params.node.rowIndex;
      openModal('거래처유형', materialRowData.value, materialColDefs);
    }
  },
  // { field: '사업자등록번호', flex: 1, editable: true },
  { field: '거래처명', flex: 1, editable: true },
  { field: '담당자', flex: 1, editable: true },
  // { field: '대표자', flex: 1, editable: true },
  { field: '사용여부', flex: 1, editable: true },
  { field: '비고', flex: 1, editable: true }
]);

// 거래처목록테이블
// const rowSelection = ref({
//   mode: 'multiRow'
// });

const rowData2 = ref([]);
const searchKeyword = ref('');

const colDefs2 = ref([
  { headerName: '거래처코드', field: 'cusId', flex: 1 },
  { headerName: '거래처유형', field: 'cusType', flex: 1 },
  { headerName: '거래처명', field: 'cusName', flex: 1 },
  { headerName: '담당자', field: 'cusManager', flex: 1 },
  {
    headerName: '사용여부',
    field: 'cusUse',
    flex: 1,
    valueFormatter: (p) => (p.value === 'Y' || p.value === 1 || p.value === '1' ? '사용' : '미사용')
  },
  { headerName: '비고', field: 'cusNote', flex: 1 },
  {
    headerName: '삭제',
    field: 'actions',
    flex: 0.5,
    cellRenderer: (params) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '삭제';
      btn.style.cursor = 'pointer';
      btn.onclick = () => deletePartner(params.data.cusId);
      return btn;
    }
  }
]);

const deletePartner = async (cusId) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    const { data } = await axios.delete(`/api/marketing/deleteacc/${cusId}`);
    console.log(data);
    if (data.affectedRows > 0) {
      alert('삭제되었습니다.');
      await loadPartners(); // 목록 새로고침
    } else {
      alert('삭제 실패');
    }
  } catch (e) {
    console.error(e);
    alert('삭제 중 오류가 발생했습니다.');
  }
};

// ========== 데이터 매핑 & 로딩 ==========

async function loadPartners(params = {}) {
  const { q = null } = params;
  const { data } = await axios.get('/api/marketing/getacclist', {
    params: { q, _ts: Date.now() } // 캐시 방지
  });
  rowData2.value = Array.isArray(data) ? data : [];
  console.log('거래처 목록:', rowData2.value);
}
onMounted(() => loadPartners());

//---------------------------------------

const page = ref({ title: '거래처등록 및 조회' });
const breadcrumbs = shallowRef([
  {
    title: '거래처',
    disabled: true,
    href: '#'
  },
  {
    title: '거래처등록 및 조회',
    disabled: false,
    href: '#'
  }
]);

const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};

// 모달
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const openModal = (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  modalRef.value?.open?.();
};
const modalConfirm = (selectedRow) => {
  if (selectedRowIndex.value == null) return;
  const idx = selectedRowIndex.value;
  rowData1.value = rowData1.value.map((row, i) => (i === idx ? { ...row, 거래처유형: selectedRow.거래처유형 } : row));
  modalRef.value?.close?.();
};

// 모달창 내용
const materialColDefs = [{ field: '거래처유형', headerName: '거래처유형', flex: 1 }];
const materialRowData = ref([
  { 거래처유형: '고객사' },
  { 거래처유형: '공급사' },
  { 거래처유형: '외주업체' },
  { 거래처유형: '운송업체' },
  { 거래처유형: '폐기업체' }
]);
</script>

<style scoped>
.main-container {
  display: flex;
  gap: 20px; /* 두 컨테이너 사이의 간격 */
  padding: 0 10px;
}

.list-container {
  flex: 1 1 50%; /* flex-grow: 1, flex-shrink: 1, flex-basis: 50% */
  min-width: 400px;
}

.clickable-cell {
  cursor: pointer;
  text-decoration: underline;
}

/* 거래처유형 헤더 왼쪽에 돋보기 아이콘 */
:deep(.ag-header .with-mag .ag-header-cell-text)::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  background: url('/icons/magnify.svg') no-repeat center / contain;
  transform: translateY(2px);
}
</style>
