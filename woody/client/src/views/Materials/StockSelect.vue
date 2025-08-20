<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <div class="div"></div>
  <v-tabs v-model="tab" class="custom-tabs">
    <v-tab class="tab">원자재</v-tab>
    <v-tab class="tab">부자재</v-tab>
    <v-tab class="tab">소모품</v-tab>
    <v-tab class="tab">재공품</v-tab>
  </v-tabs>
  <UiParentCard title="재고 목록">
    <ag-grid-vue class="ag-theme-quartz" :rowData="rowData" :columnDefs="colDefs" :theme="quartz" style="height: 35rem; width: 100%">
    </ag-grid-vue>
    <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" />
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, watch } from 'vue';

import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz } from 'ag-grid-community';
import MoDal from '../common/NewModal.vue';
import axios from 'axios';
const quartz = themeQuartz;

const tab = ref(0); // 0번째 탭이 기본 선택 (원자재)

const rowData = ref([]);
const colDefs = [
  { field: '자재명', headerName: '자재명', flex: 1 },
  { field: '자재코드', headerName: '자재코드', flex: 1 },
  { field: '규격', headerName: '규격', flex: 1 },
  { field: '단위', headerName: '단위', flex: 1 },
  { field: '자재설명', headerName: '자재설명', flex: 1 },
  { field: '수량', headerName: '수량', flex: 1 }
];

watch(
  tab,
  async (newVal) => {
    const materialTypeMap = ['원자재', '부자재', '소모품', '재공품'];
    const selectedType = materialTypeMap[newVal];

    try {
      const res = await axios.get('http://localhost:3000/stockSelect', {
        params: { matType: selectedType }
      });
      console.log(res.data);
      // 데이터를 ag-grid의 colDefs에 맞게 변환
      rowData.value = res.data.map((item) => ({
        자재명: item.MAT_NAME,
        자재코드: item.MAT_CODE,
        규격: item.MAT_SIZE,
        단위: item.MAT_UNIT,
        자재설명: item.MAT_NOTE,
        수량: item.MAT_QTY
      }));
    } catch (error) {
      console.error('재고 목록을 가져오는 중 오류 발생:' + error);
      alert('재고 목록을 불러오는 데 실패했습니다.');
    }
  },
  { immediate: true }
);

const page = ref({ title: '재고 ' });
const breadcrumbs = shallowRef([
  {
    title: '자재',
    disabled: true,
    href: '#'
  },
  {
    title: '재고 조회',
    disabled: false,
    href: '#'
  }
]);
</script>

<style scoped>
.icons {
  margin-left: 19rem;
  margin-bottom: 1rem;
}

.icons:hover {
  cursor: pointer;
}

.radioDiv {
  margin-left: 1rem;
}

.div {
  padding: 0.5rem;
}

.tab {
  background-color: #eeeeee;
}

.tab:focus {
  background-color: white;
}
</style>
