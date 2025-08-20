<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="header">
      <h2>제품검수서 작성</h2>
      <div class="actions">
        <button class="btn gray" @click="onReset">입력초기화</button>
        <button class="btn blue" @click="onSave">등록</button>
        <button class="btn black" @click="onNext">다음</button>
      </div>
    </div>

    <!-- 검사 항목 그리드 -->
    <div>
      <ag-grid-vue
        :rowData="rowData"
        :columnDefs="colDefs"
        :defaultColDef="defaultColDef"
        rowSelection="single"
        @cellValueChanged="onCellValueChanged"
        class="ag-theme-quartz"
        style="height: 360px"
      />
    </div>

    <!-- 처리상태 -->
    <div class="status">
      <strong>처리상태</strong>
      <span class="dot" :class="overallPass ? 'ok' : 'no'"></span>
      <span>{{ overallPass ? '합격' : '불합격' }}</span>
    </div>

    <!-- 하단 기본정보 -->
    <div class="info-grid">
      <div class="item">
        <label>제품검사번호</label>
        <input type="text" v-model="form.제품검사번호" placeholder="(자동입력)" disabled />
      </div>
      <div class="item">
        <label>제품코드</label>
        <input type="text" v-model="form.제품코드" placeholder="(자동입력)" disabled />
      </div>
      <div class="item">
        <label>제품명</label>
        <input type="text" v-model="form.제품명" placeholder="(자동입력)" disabled />
      </div>
      <div class="item">
        <label>합격품수량</label>
        <input type="number" v-model.number="form.합격품수량" />
      </div>
      <div class="item">
        <label>총수량</label>
        <input type="number" v-model.number="form.총수량" />
      </div>
      <div class="item">
        <label>작성자</label>
        <input type="text" v-model="form.작성자" />
      </div>
      <div class="item">
        <label>제품유형</label>
        <input type="text" v-model="form.제품유형" placeholder="(자동입력)" disabled />
      </div>
      <div class="item">
        <label>검사완료일자</label>
        <input type="date" v-model="form.검사완료일자" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, type ColDef, type ValueParserParams, type CellValueChangedEvent } from 'ag-grid-community';

// 테마 CSS (v31+)
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-quartz.css';

// 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

// ===== 타입 =====
interface ProductionManagement {
  검사기준: string;
  허용수치: string;
  측정값: number | null;
  판정: boolean;
}

// 간단 판정 규칙 예시: 실제 로직에 맞게 교체 가능
const ruleMap: Record<string, (val: number | null) => boolean> = {
  함수율: (v) => v !== null && v <= 13, // <= 13%
  치수정밀도: (v) => v !== null && v <= 2, // <= 2mm
  '강도/내구성': (v) => v !== null && v >= 35, // >= 35MPa
  안정성: (v) => v !== null && v === 0, // 예시: 0이면 위험요소 없음
  '포름알데히드 방출률': (v) => v !== null && v <= 0.3 // E0 예시
};

// ===== 데이터 =====
const rowData: Ref<ProductionManagement[]> = ref([
  { 검사기준: '함수율', 허용수치: '수분 함량이 12 ~ 13% 이하', 측정값: 12, 판정: true },
  { 검사기준: '치수정밀도', 허용수치: '입고자재에서 ± 2mm 이내', 측정값: 1, 판정: true },
  { 검사기준: '강도/내구성', 허용수치: '휨강도 35MPa 이상', 측정값: 40, 판정: true },
  { 검사기준: '안정성', 허용수치: '전도/전기/모서리 위험요소 없음', 측정값: 0, 판정: true },
  { 검사기준: '포름알데히드 방출률', 허용수치: 'E0 등급(≤0.3mg/L)', 측정값: 0.1, 판정: true }
]);

// 숫자 파서
const numberParser = (p: ValueParserParams) => {
  const n = Number(p.newValue);
  return isNaN(n) ? null : n;
};

// 배지 렌더러
const passRenderer = (p: any) => {
  const ok = !!p.value;
  const wrap = document.createElement('span');
  wrap.className = ok ? 'badge ok' : 'badge no';
  wrap.textContent = ok ? '합격' : '불합격';
  return wrap;
};

// ===== 컬럼 =====
const defaultColDef: ColDef = {
  resizable: true,
  sortable: false
};

const colDefs: Ref<ColDef<ProductionManagement>[]> = ref([
  { headerName: '검사기준', field: '검사기준', flex: 1.2, editable: false },
  { headerName: '허용수치', field: '허용수치', flex: 2, editable: false },
  {
    headerName: '측정값',
    field: '측정값',
    flex: 0.8,
    editable: true,
    valueParser: numberParser,
    cellEditor: 'agTextCellEditor',
    type: 'rightAligned'
  },
  {
    headerName: '판정',
    field: '판정',
    flex: 0.7,
    editable: false,
    cellRenderer: passRenderer
  }
]);

// 측정값 변경 시 판정 자동 계산
const onCellValueChanged = (e: CellValueChangedEvent<ProductionManagement>) => {
  if (e.colDef.field !== '측정값') return;
  const row = e.data;
  const rule = ruleMap[row.검사기준];
  row.판정 = rule ? rule(row.측정값) : !!row.판정;
  // 뷰 갱신
  rowData.value = [...rowData.value];
};

// 전체 처리상태
const overallPass = computed(() => rowData.value.every((r) => r.판정));

// ===== 하단 폼 =====
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');

const form = ref({
  제품검사번호: '',
  제품코드: '',
  제품명: '',
  합격품수량: 90,
  총수량: 100,
  작성자: '사람1',
  제품유형: '',
  검사완료일자: `${yyyy}-${mm}-${dd}`
});

// ===== 버튼 핸들러 =====
const onReset = () => {
  // 측정값/판정 초기화 예시
  rowData.value = rowData.value.map((r) => ({
    ...r,
    측정값: null,
    판정: false
  }));
};

const onSave = () => {
  // 실제에선 API 호출
  console.log('저장 payload', {
    header: { ...form.value, 처리상태: overallPass.value ? '합격' : '불합격' },
    items: rowData.value
  });
  alert('저장 완료(콘솔 확인)');
};

const onNext = () => {
  // 실제 라우팅/다음 단계 로직
  alert('다음 단계로 이동');
};
</script>

<style scoped>
.space-y-4 > * + * {
  margin-top: 16px;
}

/* 헤더 영역 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header h2 {
  font-size: 20px;
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn.gray {
  background: #e5e7eb;
}
.btn.blue {
  background: #3b82f6;
  color: white;
}
.btn.black {
  background: #111827;
  color: white;
}

/* 처리상태 */
.status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  display: inline-block;
}
.dot.ok {
  background: #22c55e;
}
.dot.no {
  background: #ef4444;
}

/* 배지 */
.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 9999px;
  color: white;
  display: inline-block;
}
.badge.ok {
  background: #16a34a;
}
.badge.no {
  background: #dc2626;
}

/* 하단 폼 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  border: 1px solid #e5e7eb;
  padding: 12px;
  border-radius: 8px;
}
.item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.item label {
  font-size: 12px;
  color: #374151;
}
.item input {
  height: 36px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.item input:disabled {
  background: #f9fafb;
  color: #6b7280;
}
</style>
