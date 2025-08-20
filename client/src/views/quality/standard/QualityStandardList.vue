<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <!-- 상단 툴바 -->
    <div class="toolbar">
      <div class="filters">
        <v-row>
          <v-col cols="3">
            <v-text-field v-model="search.keyword" label="기준" @keyup.enter="onSearch" dense outlined />
          </v-col>
          <v-col cols="3">
            <v-select v-model="search.type" :items="['완제품', '반제품', '원목', '합판']" label="제품 구분" density="compact" />
          </v-col>
          <v-col cols="3">
            <v-btn class="ml-2" color="darkText" @click="onSearch">검색</v-btn>
            <v-btn class="ml-2" @click="onReset">초기화</v-btn>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- 그리드 -->
    <div class="grid-wrap">
      <ag-grid-vue
        :theme="quartz"
        :columnDefs="colDefs"
        :rowData="qcStdRowData"
        :gridOptions="gridOptions"
        rowSelection="single"
        @grid-ready="onGridReady"
        @cell-value-changed="onCellValueChanged"
        style="height: 420px; width: 100%"
      />
    </div>
  </UiParentCard>
</template>

<script setup>
import axios from 'axios';
import { ref, shallowRef, watch, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

// 페이지 상단
const page = ref({ title: '품질 기준 조회' });
const breadcrumbs = shallowRef([
  { title: '품질', disabled: true, href: '#' },
  { title: '품질 기준 조회', disabled: false, href: '#' }
]);

// 컬럼 정의
const colDefs = ref([
  { headerName: '기준명', field: 'stdName', flex: 1, suppressSizeToFit: true },
  { headerName: '허용수치', field: 'allowedValue', flex: 1, suppressSizeToFit: true }
]);

const qcStdRowData = ref([]);

// 검색 상태
const search = ref({
  keyword: '', // 기준(입력란)
  type: '' // 제품 구분 선택
});

// 품질기준 데이터 가져오기
const getQStandardList = async () => {
  try {
    const url = 'http://localhost:3000/qstdlist';
    const result = await axios.get(url);

    if (result.data && result.data.length > 0) {
      qcStdRowData.value = result.data.map((item) => ({
        stdName: item.STD_NAME,
        allowedValue: item.ALLOWED_VALUE
      }));
    } else {
      qcStdRowData.value = [];
    }
  } catch (err) {
    console.error('데이터 조회 중 오류:', err);
    qcStdRowData.value = [];
  }
};

// 타입 변경 감지
watch(
  () => search.value.type,
  async (newType) => {
    if (newType) {
      await getQStandardList(newType);
    } else {
      await getQStandardList();
    }
  }
);

// ag-Grid 옵션
const gridOptions = ref({
  defaultColDef: {
    resizable: true,
    sortable: true
  },
  pagination: false,
  animateRows: true
});

let gridApi = null;

// 그리드 준비 이벤트
const onGridReady = (e) => {
  gridApi = e.api;
};

// 셀 값 변경 이벤트 (필요한 경우에만)
const onCellValueChanged = (event) => {
  console.log('Cell value changed:', event);
};

// 컴포넌트 마운트 시 초기 데이터 로드
onMounted(() => {
  getQStandardList();
});

// 검색 버튼 클릭
const onSearch = async () => {
  let filteredData = [...qcStdRowData.value];

  // 키워드 검색 (기준 필드에서)
  if (search.value.keyword) {
    filteredData = filteredData.filter((item) => item.stdName.toLowerCase().includes(search.value.keyword.toLowerCase()));
  }

  // 그리드에 필터된 데이터 적용
  if (gridApi) {
    gridApi.setGridOption('rowData', filteredData);
  }
};

// 초기화 버튼 클릭
const onReset = async () => {
  search.value.keyword = '';
  search.value.type = '';

  // 전체 데이터 다시 로드
  await getQStandardList();
};
</script>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.grid-wrap {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
}

/* 인쇄 시 상단 툴바 감춤 */
@media print {
  .toolbar {
    display: none;
  }
}
</style>
