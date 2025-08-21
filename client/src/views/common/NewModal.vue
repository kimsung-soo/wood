<template>
  <v-dialog v-model="dialog" max-width="800">
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <v-text-field label="검색어" v-model="searchKeyword" dense outlined hide-details class="mr-2"></v-text-field>
          <v-btn color="darkText" @click="searchData">검색</v-btn>
        </div>

        <ag-grid-vue
          :rowData="internalRowData"
          :columnDefs="internalColDefs"
          :theme="quartz"
          rowSelection="single"
          @rowClicked="onRowClicked"
          style="height: 300px; width: 100%"
          :pagination="true"
          :pagination-page-size="10"
        ></ag-grid-vue>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="confirm">확인</v-btn>
        <v-btn color="error" text @click="close">취소</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, defineExpose, defineProps } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz } from 'ag-grid-community';

const quartz = themeQuartz;
const dialog = ref(false);
const searchKeyword = ref('');

const props = defineProps({
  title: String,
  rowData: Array,
  colDefs: Array
});

// props의 데이터를 받을 내부 ref 변수 선언
const internalRowData = ref([]);
const internalColDefs = ref([]);
// 선택된 행
const selectedRow = ref(null);

// props가 변경될 때마다 내부 ref 변수를 업데이트
watch(
  () => props.rowData,
  (newVal) => {
    internalRowData.value = newVal;
  },
  { immediate: true } // 컴포넌트가 처음 로드될 때 바로 실행
);
watch(
  () => props.colDefs,
  (newVal) => {
    internalColDefs.value = newVal;
  },
  { immediate: true }
);

// 열기, 닫기
const open = () => {
  dialog.value = true;
};
const close = () => {
  dialog.value = false;
};

function onRowClicked(event) {
  selectedRow.value = event.data;
  console.log(selectedRow.value);
}

const emit = defineEmits(['confirm']);

// '확인' 버튼 클릭 시 로직
const confirm = () => {
  if (selectedRow.value) {
    emit('confirm', selectedRow.value);
    //confirm이라는 이름으로 selectedRow.value 데이터를 부모에게 전달.
  }
  close();
};

// 검색
const searchData = () => {};

defineExpose({
  open
});
</script>
