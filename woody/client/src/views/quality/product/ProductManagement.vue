<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <UiParentCard>
    <v-row class="mb-4">
      <v-col cols="3">
        <v-text-field label="생산완료일자" v-model="form.finished_at" type="date" dense outlined />
      </v-col>
    </v-row>
    <v-row justify="end" class="mb-4">
      <v-btn color="error" variant="elevated" @click="resetForm">초기화</v-btn>
    </v-row>
    <br />
    <ag-grid-vue
      :rowData="gridData"
      :columnDefs="colDefs"
      :theme="quartz"
      :gridOptions="myGridOptions"
      @row-clicked="onRowClicked"
      style="height: 400px"
    />
  </UiParentCard>
</template>

<script setup>
import axios from 'axios';
import { useRouter } from 'vue-router';
import { ref, shallowRef, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';

ModuleRegistry.registerModules([AllCommunityModule]);

const quartz = themeQuartz;
const router = useRouter();

const page = ref({ title: '제품검사성적서 관리' });
const breadcrumbs = shallowRef([
  { title: '품질', disabled: true, href: '#' },
  { title: '제품성적서관리', disabled: false, href: '#' }
]);

// 폼 필드 정의를 템플릿과 맞추기
const form = ref({
  finished_at: '' // 검사일자 (YYYY-MM-DD)
});

// 컬럼 정의
// headerName : field  => DB 컬럼 그대로 정의
const colDefs = ref([
  { headerName: '지시번호', field: 'wo_no' },
  { headerName: '제품코드', field: 'product_code' },
  { headerName: '제품명', field: 'product_name' },
  { headerName: '제품유형', field: 'product_type' },
  { headerName: '총생산량', field: 'qty' },
  { headerName: '지시상태', field: 'status' },
  { headerName: '작업자', field: 'writer' },
  { headerName: '생산완료일자', field: 'finished_at' }
]);

const rowData = ref([]);

const getTaskPrd = async () => {
  try {
    const { data } = await axios.get('http://localhost:3000/taskprd');
    rowData.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    rowData.value = [];
  }
};

// 검색(필터)
const gridData = computed(() => {
  const date = (form.value.finished_at || '').trim();
  return rowData.value
    .map((r) => {
      return {
        ...r,
        // finished_at이 있을 때 yyyy-mm-dd로 잘라서 표시
        finished_at: r.finished_at ? String(r.finished_at).substring(0, 10) : ''
      };
    })
    .filter((r) => {
      const byDate = !date || r.finished_at.startsWith(date);
      return byDate;
    });
});

const myGridOptions = ref({
  defaultColDef: { flex: 1, minWidth: 100, resizable: true },
  pagination: true,
  paginationAutoPageSize: true
});

const onRowClicked = (event) => {
  const row = event.data;
  router.push({
    path: '/qm/prdmngcert',
    query: {
      wo_no: String(row.wo_no), // 지시번호
      product_code: String(row.product_code || ''), // 제품코드
      product_name: String(row.product_name || ''), // 제품명
      product_type: String(row.product_type || ''), // 제품유형
      qty: String(row.qty || 0), // 총생산량
      writer: String(row.writer || ''), // 작업자
      finished_at: String(row.finished_at || '') // 생산완료일
    }
  });
};

// 초기화 버튼
const resetForm = () => {
  form.value.finished_at = '';
};

onMounted(() => {
  getTaskPrd();
});
</script>
