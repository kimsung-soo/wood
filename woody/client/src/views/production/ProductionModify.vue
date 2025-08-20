<!-- src/views/production/ProductionModify.vue -->
<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <!-- 헤더: 제목 + 우측 삭제 -->
    <div class="card-headline">
      <h5 class="title">생산계획 수정/삭제</h5>
      <div class="head-actions">
        <v-btn class="ml-4" color="error" variant="elevated" @click="bulkDelete">삭제</v-btn>
      </div>
    </div>

    <!-- 검색 조건 -->
    <v-row class="mb-4" dense>
      <v-col cols="3">
        <v-text-field label="계획번호" v-model.trim="search.planNo" dense outlined hide-details @keyup.enter="applySearch" />
      </v-col>
      <v-col cols="3">
        <v-text-field label="계획명" v-model.trim="search.planName" dense outlined hide-details @keyup.enter="applySearch" />
      </v-col>
      <v-col cols="3">
        <v-text-field label="작성자" v-model.trim="search.writer" dense outlined hide-details @keyup.enter="applySearch" />
      </v-col>
      <v-col cols="3">
        <v-text-field label="납기일자" v-model="search.dueDate" type="date" dense outlined hide-details @keyup.enter="applySearch" />
      </v-col>
    </v-row>

    <!-- 버튼 중앙 정렬 -->
    <v-row justify="center" class="mt-2 mb-4">
      <v-col cols="auto">
        <v-btn variant="flat" color="error" class="mx-2" @click="resetFilters">초기화</v-btn>
        <v-btn variant="flat" color="darkText" class="mx-2" @click="applySearch">검색</v-btn>
      </v-col>
    </v-row>

    <!-- 목록 -->
    <div class="grid-wrap">
      <ag-grid-vue
        class="ag-theme-quartz ag-no-wrap"
        :rowData="pagedPlans"
        :columnDefs="colDefs"
        :pagination="true"
        :paginationPageSize="PAGE_SIZE"
        :suppressPaginationPanel="false"
        rowSelection="multiple"
        :rowMultiSelectWithClick="true"
        :suppressRowClickSelection="true"
        :immutableData="true"
        :getRowId="getRowId"
        :rowBuffer="3"
        @grid-ready="onGridReady"
        @row-double-clicked="openEdit"
      />
    </div>

    <!-- 편집 모달 -->
    <v-dialog v-model="edit.open" max-width="760" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>생산계획 수정</span>
          <v-chip size="small" v-if="edit.dirty" color="warning" variant="tonal">변경됨</v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="6" md="4">
              <v-text-field label="계획번호" v-model="edit.form.planNo" readonly density="compact" variant="outlined" />
            </v-col>

            <v-col cols="6" md="8">
              <v-text-field
                label="계획명"
                v-model.lazy="edit.form.planName"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-text-field
                label="제품코드"
                v-model.lazy="edit.form.productCode"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-text-field
                label="작성일자"
                v-model.lazy="edit.form.createdDate"
                type="date"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-text-field
                label="작성자"
                v-model.lazy="edit.form.writer"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-text-field
                label="납기일자"
                v-model.lazy="edit.form.dueDate"
                type="date"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-text-field
                label="총 수량"
                v-model.number.lazy="edit.form.totalQty"
                type="number"
                min="0"
                step="1"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                label="비고"
                v-model.lazy="edit.form.memo"
                placeholder="메모를 입력하세요"
                density="compact"
                variant="outlined"
                @update:modelValue="markDirty"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="flat" color="darkText" @click="closeEdit">닫기</v-btn>
          <v-btn variant="flat" color="success" @click="saveEdit">수정</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.open" :color="snack.color" :timeout="2000">
      {{ snack.msg }}
    </v-snackbar>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, markRaw, watch, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';

const API = 'http://localhost:3000'; // prefix 없음 (예: http://localhost:3000)

// 헤더
const page = ref({ title: '생산계획 수정/삭제' });
const breadcrumbs = shallowRef([
  { title: '생산', disabled: true, href: '#' },
  { title: '생산계획 수정/삭제', disabled: false, href: '#' }
]);

// 검색 폼
const search = ref({
  planNo: '',
  planName: '',
  writer: '',
  dueDate: ''
});
const PAGE_SIZE = 10;

// 목록 데이터
const plans = shallowRef([]);
let gridApi = null;

onMounted(() => {
  applySearch(); // 첫 로딩 시 조회
});

// 서버 조회
async function fetchPlans() {
  try {
    const kw = (search.value.planNo || search.value.planName || '').trim();
    const { data } = await axios.get(`${API}/plans`, {
      params: { kw, page: 1, size: 200 }
    });
    if (data?.ok) {
      // 서버 필드 정규화 (createdDate/dueDate = yyyy-MM-dd)
      plans.value = (data.rows || []).map((r) => ({
        id: r.id,
        planNo: r.planNo,
        productCode: r.productCode,
        planName: r.planName,
        createdDate: r.createdDate || '', // date only
        writer: r.writer || '',
        dueDate: r.dueDate || '',
        totalQty: r.totalQty ?? 0,
        memo: r.memo || ''
      }));
      toast('조회 완료');
    } else {
      toast('조회 실패', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('조회 중 오류', 'error');
  }
}

// 필터링(작성자/납기일자만 클라이언트 필터)
const filteredPlans = computed(() => {
  const f = search.value;
  return plans.value.filter((o) => (!f.writer || (o.writer || '').includes(f.writer)) && (!f.dueDate || o.dueDate === f.dueDate));
});
const pagedPlans = computed(() => filteredPlans.value);

// 검색/초기화 버튼
function applySearch() {
  fetchPlans().then(() => gridApi?.ensureIndexVisible(0));
}
function resetFilters() {
  search.value = { planNo: '', planName: '', writer: '', dueDate: '' };
  fetchPlans().then(() => gridApi?.ensureIndexVisible(0));
}

// ag-Grid
const colDefs = markRaw([
  { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 70 },
  { headerName: '계획번호', field: 'planNo', flex: 1.4, minWidth: 160, cellClass: 'cell-ellipsis' },
  { headerName: '제품코드', field: 'productCode', flex: 0.9, minWidth: 110, cellClass: 'cell-ellipsis' },
  { headerName: '계획명', field: 'planName', flex: 1.4, minWidth: 150, cellClass: 'cell-ellipsis' },
  { headerName: '작성일자', field: 'createdDate', flex: 1.0, minWidth: 120, cellClass: 'cell-ellipsis' },
  { headerName: '작성자', field: 'writer', flex: 0.8, minWidth: 90, cellClass: 'cell-ellipsis' },
  { headerName: '납기일자', field: 'dueDate', flex: 0.9, minWidth: 120, cellClass: 'cell-ellipsis' },
  { headerName: '총 수량', field: 'totalQty', flex: 0.7, minWidth: 90, cellClass: 'ag-right-aligned-cell cell-ellipsis' },
  { headerName: '비고', field: 'memo', flex: 1.2, minWidth: 140, cellClass: 'cell-ellipsis' }
]);

function onGridReady(e) {
  gridApi = e.api;
  gridApi.sizeColumnsToFit();
}
function getRowId(params) {
  return String(params.data.id);
}

// 편집 모달 상태
const edit = reactive({
  open: false,
  dirty: false,
  form: {
    id: null,
    planNo: '',
    productCode: '',
    planName: '',
    createdDate: '',
    writer: '',
    dueDate: '',
    totalQty: 0,
    memo: ''
  },
  original: null
});

function markDirty() {
  edit.dirty = true;
}
function openEdit(ev) {
  const r = ev?.data;
  if (!r) return;
  edit.form.id = r.id;
  edit.form.planNo = r.planNo; // readonly
  edit.form.productCode = r.productCode;
  edit.form.planName = r.planName;
  edit.form.createdDate = r.createdDate; // date
  edit.form.writer = r.writer;
  edit.form.dueDate = r.dueDate; // date
  edit.form.totalQty = r.totalQty;
  edit.form.memo = r.memo;
  edit.original = { ...r };
  edit.dirty = false;
  edit.open = true;
}
function closeEdit() {
  if (edit.dirty && !confirm('저장하지 않은 변경 사항이 있습니다. 닫을까요?')) return;
  edit.open = false;
}

// 저장(수정)
async function saveEdit() {
  if (!validateForm()) return;
  try {
    const id = edit.form.id;
    const payload = {
      // 백엔드 update용 필드(스키마 명칭에 맞춰 작성)
      planName: edit.form.planName,
      writer: edit.form.writer,
      createdDate: edit.form.createdDate, // yyyy-MM-dd
      dueDate: edit.form.dueDate, // yyyy-MM-dd
      totalQty: Number(edit.form.totalQty || 0),
      productCode: edit.form.productCode,
      memo: edit.form.memo
    };
    const { data } = await axios.put(`${API}/plans/${id}`, payload);
    if (data?.ok) {
      // 그리드 갱신
      const updated = { ...edit.original, ...edit.form };
      gridApi?.applyTransactionAsync({ update: [updated] });
      const arr = plans.value.slice();
      const i = arr.findIndex((r) => r.id === id);
      if (i > -1) arr[i] = updated;
      plans.value = arr;

      edit.open = false;
      edit.dirty = false;
      toast('수정되었습니다.');
    } else {
      toast('수정 실패', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('수정 중 오류', 'error');
  }
}
function validateForm() {
  if (!edit.form.planNo) return alert('계획번호가 없습니다.'), false;
  if (!edit.form.planName?.trim()) return alert('계획명은 필수입니다.'), false;
  if (!edit.form.productCode?.trim()) return alert('제품코드는 필수입니다.'), false;
  if (!edit.form.createdDate) return alert('작성일자는 필수입니다.'), false;
  if (!edit.form.writer?.trim()) return alert('작성자는 필수입니다.'), false;
  if (!edit.form.dueDate) return alert('납기일자는 필수입니다.'), false;
  if (!edit.form.totalQty || edit.form.totalQty <= 0) return alert('총 수량은 1 이상이어야 합니다.'), false;
  return true;
}

// 일괄 삭제
async function bulkDelete() {
  if (!gridApi) return;
  const selected = gridApi.getSelectedRows();
  if (!selected.length) {
    alert('삭제할 행을 선택하세요.');
    return;
  }
  if (!confirm(`${selected.length}건을 삭제하시겠습니까?`)) return;

  try {
    const ids = selected.map((r) => r.id);
    const { data } = await axios.delete(`${API}/plans`, { data: { ids } });
    if (data?.ok) {
      gridApi.applyTransactionAsync({ remove: selected });
      const set = new Set(ids);
      plans.value = plans.value.filter((r) => !set.has(r.id));
      if (edit.open && edit.form.id && set.has(edit.form.id)) edit.open = false;
      toast('삭제되었습니다.');
    } else {
      toast('삭제 실패', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('삭제 중 오류', 'error');
  }
}

// 검색 변경 시 첫 행으로 스크롤
watch(
  search,
  () => {
    gridApi?.ensureIndexVisible(0);
  },
  { deep: true }
);

// 토스트
const snack = ref({ open: false, msg: '', color: 'primary' });
const toast = (msg, color = 'primary') => (snack.value = { open: true, msg, color });
</script>

<style scoped>
.card-headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.card-headline .title {
  margin: 0;
  font-weight: 600;
}
.head-actions {
  display: flex;
  align-items: center;
}

/* 고정 높이로 virtualization 유지 */
.grid-wrap {
  height: 520px;
}
.ag-theme-quartz {
  height: 100%;
}

/* 말줄임 */
.cell-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ag-theme-quartz {
  --ag-font-size: 12px;
  --ag-grid-size: 4px;
}
</style>
