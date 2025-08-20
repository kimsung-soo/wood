<!-- 작업 진행 현황  -->
<!-- src/views/production/WorkStatus.vue -->
<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard>
    <v-card variant="outlined">
      <v-card-title class="card-title">
        <span>작업 진행 현황</span>

        <!-- 우측: 검색 + 그룹핑 스위치 -->
        <div class="actions">
          <v-text-field
            v-model.trim="keyword"
            placeholder="지시번호/제품명 검색"
            density="compact"
            variant="outlined"
            hide-details
            class="search"
            @keyup.enter="noop"
          />
          <v-switch v-model="groupByIssue" inset color="primary" hide-details class="ml-2" :label="`지시번호 그룹`" />
        </div>
      </v-card-title>

      <!-- 공정 탭 -->
      <v-tabs v-model="tab" density="comfortable" class="px-2">
        <v-tab v-for="t in processTabs" :key="t.code" :value="t.code">
          {{ t.label }}
          <v-chip size="x-small" class="ml-1" color="primary" variant="tonal">
            {{ countsByProc[t.code] ?? 0 }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <v-divider />

      <!-- 단일 테이블: 탭 값으로 필터링 -->
      <v-data-table
        :headers="tableHeaders"
        :items="visibleRows"
        density="compact"
        item-key="key"
        :items-per-page="12"
        :group-by="groupByIssue ? [{ key: 'issueNumber', order: 'asc' }] : []"
        class="no-hover"
      >
        <!-- 상태 칩 -->
        <template v-slot:[`item.state`]="{ item }">
          <v-chip size="small" :color="stateColor(item.state)" variant="tonal">
            {{ stateKorean(item.state) }}
          </v-chip>
        </template>

        <!-- 진행률 바 -->
        <template v-slot:[`item.progress`]="{ item }">
          <div class="bar">
            <v-progress-linear :model-value="item.progress" height="10" :color="item.progress >= 100 ? 'success' : 'primary'" />
            <span class="pct">{{ item.progress }}%</span>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </UiParentCard>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useProcessSimStore } from '@/stores/useProcessSimStore';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const store = useProcessSimStore();

/* 헤더 */
const page = { title: '작업 진행 현황' };
const breadcrumbs = [
  { title: '생산', disabled: true, href: '#' },
  { title: '작업 진행 현황', disabled: false, href: '#' }
];

/* 공정 탭 정의 */
const processTabs = [
  { code: 'ALL', label: '전체' },
  { code: 'CUT', label: '절단' },
  { code: 'FAB', label: '가공' },
  { code: 'POL', label: '연마' },
  { code: 'PAI', label: '도장' },
  { code: 'ASM', label: '조립' },
  { code: 'DEFECT', label: '불량' }
];
const tab = ref('ALL');
const keyword = ref('');
const groupByIssue = ref(false);
const noop = () => {};

/* 컬럼(전체 vs 공정별 탭에서 공정명 숨김) */
const headersAll = [
  { title: '공정순서', value: 'orderIdx', width: 90 },
  { title: '공정명', value: 'processName', width: 120 },
  { title: '지시번호', value: 'issueNumber' },
  { title: '제품명', value: 'productName' },
  { title: '상태', value: 'state', width: 110 },
  { title: '진행률', value: 'progress', sortable: false, width: 220 },
  { title: '지시량', value: 'targetQty', width: 80 },
  { title: '기생산', value: 'producedQty', width: 80 },
  { title: '미생산', value: 'remainingQty', width: 80 },
  { title: '불량량', value: 'defectQty', width: 80 }
];
const headersNoProc = headersAll.filter((h) => h.value !== 'processName');
const tableHeaders = computed(() => (tab.value === 'ALL' ? headersAll : headersNoProc));

/* 원본 로우 */
function orderIdxOf(proc) {
  const map = { CUT: 1, FAB: 2, POL: 3, PAI: 4, ASM: 5 };
  return map[proc] || 9;
}
const allRows = computed(() =>
  (store.flatRowsForStatus ?? []).map((r) => ({
    key: `${r.orderId}-${r.process}`,
    orderIdx: orderIdxOf(r.process),
    process: r.process,
    processName: r.processName,
    issueNumber: r.issueNumber,
    productName: r.productName,
    state: r.state, // RUN/PAUSE/DONE/WAIT
    progress: r.progress,
    targetQty: r.targetQty,
    producedQty: r.producedQty,
    remainingQty: r.remainingQty,
    defectQty: r.defectQty ?? 0
  }))
);

/* 공정별 카운트(탭 칩) */
const countsByProc = computed(() => {
  const acc = { ALL: allRows.value.length };
  for (const r of allRows.value) acc[r.process] = (acc[r.process] || 0) + 1;
  return acc;
});

/* 탭 + 검색 필터 */
const visibleRows = computed(() => {
  const kw = keyword.value.toLowerCase();
  return allRows.value
    .filter((r) => (tab.value === 'ALL' ? true : tab.value === 'DEFECT' ? r.defectQty > 0 : r.process === tab.value))
    .filter((r) => !kw || r.issueNumber.toLowerCase().includes(kw) || r.productName.toLowerCase().includes(kw))
    .sort((a, b) => a.orderIdx - b.orderIdx);
});

/* 상태 표기 */
function stateKorean(s) {
  if (s === 'RUN') return '진행중';
  if (s === 'PAUSE') return '일시정지';
  if (s === 'DONE') return '완료';
  return '대기';
}
function stateColor(s) {
  return s === 'RUN' ? 'primary' : s === 'DONE' ? 'success' : s === 'PAUSE' ? 'warning' : 'grey';
}

onMounted(() => {
  // 서버에서 지시/공정상태 로드 → 현황 반영
  store.loadOrders({ page: 1, size: 100 });
  // (선택) 시뮬 구동이 있다면
  store.startTicker?.();
});
</script>

<style scoped>
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.actions {
  display: flex;
  align-items: center;
}
.search {
  width: 320px;
  max-width: 40vw;
}

/* 진행률 UI */
.bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pct {
  min-width: 38px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 테이블 UX */
.no-hover .v-data-table__tr:hover {
  background: transparent;
}
.ml-2 {
  margin-left: 8px;
}
</style>
