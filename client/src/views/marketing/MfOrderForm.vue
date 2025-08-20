<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard>
    <h5>생산의뢰서 등록</h5>

    <div class="main-container">
      <div class="list-container">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="생산의뢰서번호" v-model="form.number" readonly outlined />
            </v-col>

            <v-col cols="6">
              <v-text-field label="주문일자" v-model="form.addDate" type="date" outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="form.writer" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="납기일자" v-model="form.dueDate" type="date" outlined />
            </v-col>
          </v-row>
        </div>

        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 500px; width: 100%"
          @cell-value-changed="onCellValueChanged"
        />
        <br /><br />

        <v-row justify="end">
          <v-btn color="primary" class="mr-6" @click="submitForm">생산의뢰서전송(생산)</v-btn>
        </v-row>
      </div>
    </div>

    <!-- 제품 선택 모달 -->
    <MoDal
      ref="modalRef"
      :title="modalTitle"
      :rowData="modalRowData"
      :colDefs="modalColDefs"
      @confirm="modalConfirm"
    />
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import UiParentCard from '@/components/shared/UiParentCard.vue'
import { themeQuartz } from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
import MoDal from '../common/NewModal.vue'

const quartz = themeQuartz

// ✅ 주문번호 기본값 1
const form = ref({
  number: 1,
  addDate: '',
  client: '',
  dueDate: '',
})

// 그리드 데이터
const rowData1 = ref([
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
  { 제품코드: '선택하세요', 제품명: '', 수량: '', 비고: '' },
])

const selectedRowIndex = ref(null)

const materialColDefs = [
  { field: '제품코드', headerName: '제품코드', flex: 2 },
  { field: '제품명',   headerName: '제품명',   flex: 2 },
]
const materialRowData = ref([
  { 제품코드: '1234', 제품명: '완제품 블랙' },
  { 제품코드: '1235', 제품명: '완제품 화이트' },
  { 제품코드: '1236', 제품명: '반제품 블랙' },
])

const colDefs1 = ref([
  { headerName: '번호', valueGetter: p => p.node.rowIndex + 1, flex: 1, editable: false, sortable: false, filter: false },
  { field: '제품코드', flex: 1, editable: false, cellClass: 'clickable-cell',
    onCellClicked: (params) => { selectedRowIndex.value = params.node.rowIndex; openModal('제품 선택', materialRowData.value, materialColDefs) } },
  { field: '제품명', flex: 1, editable: false, cellClass: 'clickable-cell',
    onCellClicked: (params) => { selectedRowIndex.value = params.node.rowIndex; openModal('제품 선택', materialRowData.value, materialColDefs) } },
  { field: '수량', flex: 1, editable: true },
  { field: '생산유형', flex: 1, editable: true },
  { field: '비고', flex: 1, editable: true },

])

const onCellValueChanged = (e) => {
  console.log('changed:', e.colDef.field, 'old=', e.oldValue, 'new=', e.newValue)
}

// ✅ 등록 시 번호 +1, 나머지 리셋
function submitForm() {
  console.log('폼:', form.value)
  console.log('그리드:', rowData1.value)
  // TODO: 서버 전송
  form.value = {
    ...form.value,
    number: Number(form.value.number) + 1,
    addDate: '',
    client: '',
    dueDate: '',
  }
}

// ✅ 초기화는 번호 유지
function resetForm() {
  form.value = {
    ...form.value,
    addDate: '',
    client: '',
    dueDate: '',
  }
}



// 모달
const modalRef = ref(null)
const modalTitle = ref('')
const modalRowData = ref([])
const modalColDefs = ref([])
const openModal = (title, rowData, colDefs) => {
  modalTitle.value = title
  modalRowData.value = rowData
  modalColDefs.value = colDefs
  modalRef.value?.open?.()
}
const modalConfirm = (selectedRow) => {
  if (selectedRowIndex.value == null) return
  const idx = selectedRowIndex.value
  rowData1.value = rowData1.value.map((row, i) =>
    i === idx ? { ...row, 제품코드: selectedRow.제품코드, 제품명: selectedRow.제품명 } : row
  )
  modalRef.value?.close?.()
}

// 페이지 헤더
const page = ref({ title: '생산의뢰서등록' })
const breadcrumbs = shallowRef([
  { title: '영업', disabled: true, href: '#' },
  { title: '생산의뢰서', disabled: true, href: '#' },
  { title: '생산의뢰서 등록', disabled: false, href: '#' },
])
</script>


<style scoped>
.main-container {
  display: flex;
  gap: 20px;
  padding: 0 10px;
}
.list-container { flex: 1 1 50%; min-width: 500px; }

.clickable-cell {
  cursor: pointer;
  text-decoration: underline;
}
</style>
