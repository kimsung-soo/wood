<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard class="pc-wrap">
    <div class="wizard-head">
      <div class="steps">
        <div class="step" :class="{ active: step === 1, done: step > 1 }">1. 지시/작업자/공정/설비</div>
        <div class="sep"></div>
        <div class="step" :class="{ active: step === 2 }">2. 진행제어</div>
      </div>
      <div class="actions">
        <v-btn variant="tonal" :disabled="step === 1" @click="prevStep" density="comfortable">이전</v-btn>
        <v-btn color="primary" :disabled="!canNext" @click="onClickNext" density="comfortable">
          {{ step < 2 ? '다음' : '초기화면' }}
        </v-btn>
      </div>
    </div>

    <v-window v-model="step" class="mt-1">
      <!-- STEP 1 -->
      <v-window-item :value="1">
        <v-row dense>
          <v-col cols="12">
            <v-card variant="outlined" class="tight">
              <v-card-title class="tight-title">지시목록</v-card-title>

              <v-data-table class="no-hover" density="compact" :headers="orderHeaders" :items="orders" item-key="id" :items-per-page="8">
                <template #item.progressCol="{ item }">
                  <div class="prog-wrap">
                    <v-progress-linear :model-value="orderProgress(item)" height="10" />
                    <span class="prog-text">{{ orderProgress(item) }}%</span>
                  </div>
                </template>

                <template #item.stateCol="{ item }">
                  <v-chip size="small" :color="stateColor(overallState(item))" variant="tonal">
                    {{ overallState(item) }}
                  </v-chip>
                </template>

                <template #item.pick="{ item }">
                  <v-btn size="small" variant="tonal" @click="pickOrder(item)">선택</v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>

          <!-- 좌: 작업자/공정 -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="tight h-full">
              <v-card-title class="tight-title">작업자 & 공정 선택</v-card-title>
              <v-card-text class="tight-body">
                <div class="picked-box" v-if="pickedOrder">
                  <div class="picked-line">
                    <span class="muted">지시번호</span> <b>{{ pickedOrder.issueNumber }}</b>
                    <span class="divider">|</span>
                    <span class="muted">제품</span> {{ pickedOrder.productName }} ({{ pickedOrder.productType }})
                    <span class="divider">|</span>
                    <span class="muted">목표/기/미</span>
                    <b>{{ pickedOrder.targetQty }}</b> / {{ producedOverall }} / {{ remainingQty }}
                  </div>
                </div>

                <div v-if="pickedOrder" class="mt-2">
                  <div class="label mb-1">공정별 생산량</div>
                  <v-data-table :headers="procHeaders" :items="procRows" density="compact" class="no-hover" hide-default-footer>
                    <template #item.progress="{ item }">
                      <div class="prog-wrap">
                        <v-progress-linear :model-value="item.progress" height="8" />
                        <span class="prog-text">{{ item.progress }}%</span>
                      </div>
                    </template>
                    <template #item.state="{ item }">
                      <v-chip size="x-small" :color="stateChipColor(item.state)" variant="tonal">
                        {{ item.stateLabel }}
                      </v-chip>
                    </template>
                  </v-data-table>
                </div>

                <div class="mt-3">
                  <div class="label">작업자 선택</div>
                  <div class="grid-btns">
                    <v-btn
                      v-for="w in workers"
                      :key="w.id"
                      class="grid-btn"
                      density="comfortable"
                      :color="pickedWorker?.id === w.id ? 'primary' : undefined"
                      @click="pickedWorker = w"
                    >
                      <div class="bold">{{ w.name }}</div>
                      <div class="muted small">{{ w.id }}</div>
                    </v-btn>
                  </div>
                </div>

                <div class="mt-3">
                  <div class="label">공정 선택</div>

                  <v-btn-toggle v-model="pickedProcess" :disabled="!pickedOrder" mandatory class="w-full">
                    <v-btn v-for="p in processesForProduct" :key="p.code" :value="p.code" density="comfortable">
                      {{ p.name }}
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 우: 설비 -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="tight h-full">
              <v-card-title class="tight-title">
                설비 선택 <small class="muted"> — {{ pickedProcessName }}</small>
              </v-card-title>
              <v-card-text class="tight-body">
                <div v-if="!pickedProcess" class="muted">공정을 먼저 선택하세요.</div>

                <template v-else>
                  <v-data-table :headers="eqHeaders" :items="eqRows" density="compact" item-key="id" :items-per-page="5" class="no-hover">
                    <template #item.status="{ item }">
                      <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
                        {{ statusLabel(item.status) }}
                      </v-chip>
                    </template>

                    <template #item.pick="{ item }">
                      <v-btn
                        size="small"
                        :variant="pickedEquipId === item.id ? 'elevated' : 'tonal'"
                        :color="buttonColor(item)"
                        :disabled="!canPickThis(item)"
                        @click="pickEquip(item)"
                      >
                        {{ pickedEquipId === item.id ? '선택됨' : '선택' }}
                      </v-btn>
                    </template>
                  </v-data-table>
                </template>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- STEP 2 -->
      <v-window-item :value="2">
        <div class="summary-bar">
          <div class="sum-left">
            <span class="muted">선택 설비</span>
            <b v-if="pickedEquip">{{ pickedEquip.name }}</b>
            <span v-if="pickedEquip" class="muted">({{ pickedEquip.code }})</span>
            <span v-else class="muted">없음</span>
          </div>
          <div class="sum-right">
            <span class="muted">현재 공정 상태</span>
            <v-chip size="small" :color="stateChipColor(psNow?.status)" variant="tonal" class="ml-2">
              {{ stateLabelFor(psNow?.status) }}
            </v-chip>
          </div>
        </div>

        <v-card variant="outlined" class="tight">
          <v-card-text class="tight-body">
            <v-row dense>
              <v-col cols="6"
                ><v-text-field label="지시번호" :model-value="pickedOrder?.issueNumber" readonly density="compact" variant="outlined"
              /></v-col>
              <v-col cols="6"
                ><v-text-field label="공정" :model-value="pickedProcessName" readonly density="compact" variant="outlined"
              /></v-col>

              <v-col cols="6"
                ><v-text-field label="목표수량" :model-value="pickedOrder?.targetQty" readonly density="compact" variant="outlined"
              /></v-col>
              <v-col cols="6"
                ><v-text-field label="기생산량(전체)" :model-value="producedOverall" readonly density="compact" variant="outlined"
              /></v-col>

              <v-col cols="6"
                ><v-text-field label="미생산량(전체)" :model-value="remainingQty" readonly density="compact" variant="outlined"
              /></v-col>
              <v-col cols="6"
                ><v-text-field label="작업자" :model-value="pickedWorker?.name" readonly density="compact" variant="outlined"
              /></v-col>

              <v-col cols="6"
                ><v-text-field label="해당 공정 생산량" :model-value="currentProcProduced" readonly density="compact" variant="outlined"
              /></v-col>
              <v-col cols="6"
                ><v-text-field label="해당 공정 미생산량" :model-value="currentProcRemaining" readonly density="compact" variant="outlined"
              /></v-col>

              <v-col cols="6"
                ><v-text-field label="시작일시" :model-value="ctrlTime.startAt" readonly density="compact" variant="outlined"
              /></v-col>
              <v-col cols="6"
                ><v-text-field label="종료일시" :model-value="ctrlTime.endAt" readonly density="compact" variant="outlined"
              /></v-col>
            </v-row>

            <div class="bottom-row">
              <div class="keypad">
                <div class="keypad-screen">{{ inputQty }}</div>
                <div class="keys">
                  <button v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="n" @click="pushDigit(n)">{{ n }}</button>
                  <button @click="clearQty">C</button>
                  <button @click="pushDigit(0)">0</button>
                  <button @click="applyQty">✔</button>
                </div>
                <div class="muted small mt-1">허용 상한: {{ allowedInputCap }}</div>
              </div>

              <div class="ctrl-btns">
                <v-btn color="primary" class="mr-2" density="comfortable" @click="doStart">작업시작</v-btn>
                <v-btn color="error" density="comfortable" :loading="isFinishing" :disabled="isFinishing" @click.stop.prevent="doFinish">
                  작업종료
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </UiParentCard>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useProcessSimStore, PROCESS_LIST, EQ } from '@/stores/useProcessSimStore';

const API = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';
const store = useProcessSimStore();

/* 헤더 */
const page = ref({ title: '공정 진행관리' });
const breadcrumbs = ref([
  { title: '생산', disabled: true, href: '#' },
  { title: '공정 진행관리', disabled: false, href: '#' }
]);

/* 단계 */
const step = ref(1);
const prevStep = () => {
  if (step.value > 1) step.value--;
};
const onClickNext = () => {
  if (step.value === 1) {
    if (!pickedOrder.value) return alert('지시를 선택하세요.');
    if (!pickedWorker.value) return alert('작업자를 선택하세요.');
    if (!pickedProcess.value) return alert('공정을 선택하세요.');
    if (!pickedEquipId.value) return alert('설비를 선택하세요.');
    step.value = 2;
  } else {
    // 완료 시 초기화면으로
    pickedOrder.value = null;
    pickedWorker.value = null;
    pickedProcess.value = null;
    pickedEquipId.value = null;
    inputQty.value = 0;
    ctrlTime.value = { startAt: '', endAt: '' };
    step.value = 1;
  }
};

/* 지시/작업자 */
const orders = computed(() => store.orders ?? []);
const workers = computed(() => store.workers);

/* 선택값 */
const pickedOrder = ref(null);
const pickedWorker = ref(null);
const pickedProcess = ref(null);
const pickedEquipId = ref(null);

/* 설비 */
const equipments = ref([]);
const PR_TO_PROC = { 'PRC-001': 'CUT', 'PRC-002': 'FAB', 'PRC-003': 'POL', 'PRC-004': 'PAI', 'PRC-005': 'ASM' };
const PROC_TO_PR = { CUT: 'PRC-001', FAB: 'PRC-002', POL: 'PRC-003', PAI: 'PRC-004', ASM: 'PRC-005' };

async function loadEquipmentsByProcess(procCode = '') {
  const prId = PROC_TO_PR[procCode] || '';
  if (!prId) {
    equipments.value = [];
    return;
  }
  const res = await axios.get(`${API}/api/facilities`, { params: { process: prId } }).catch(() => ({ data: null }));
  const list = res?.data?.rows || [];
  equipments.value = list.map((r) => ({
    id: String(r.id ?? r.facId ?? r.code),
    code: String(r.code ?? r.facId),
    name: r.name,
    process: PR_TO_PROC[r.process] || PR_TO_PROC[r.prId] || procCode,
    status: r.status || EQ.AVAILABLE
  }));
}

/* 설비 표 */
const eqHeaders = [
  { title: 'Id', value: 'id', width: 100 },
  { title: 'Name', value: 'name' },
  { title: 'Status', value: 'status', sortable: false },
  { title: '선택', value: 'pick', sortable: false, align: 'end' }
];
const pickedEquip = computed(() => (!pickedEquipId.value ? null : equipments.value.find((e) => e.id === pickedEquipId.value) || null));
const eqRows = computed(() => equipments.value.filter((e) => e.process === pickedProcess.value));
const statusLabel = (s) => (s === EQ.AVAILABLE ? '사용가능' : s === EQ.IN_USE ? '생산중' : s === EQ.MAINT ? '점검중' : s);
const statusColor = (s) => (s === EQ.AVAILABLE ? 'success' : s === EQ.IN_USE ? 'warning' : 'grey');
const canPickThis = (row) => row.status === EQ.AVAILABLE || pickedEquipId.value === row.id;
const buttonColor = (row) => (pickedEquipId.value === row.id ? 'primary' : undefined);
function pickEquip(row) {
  if (!canPickThis(row)) return alert('이 설비는 현재 선택할 수 없습니다. (상태: ' + statusLabel(row.status) + ')');
  pickedEquipId.value = row.id;
}

/* 공정/지시 관련 계산 */
const orderHeaders = [
  { title: '지시번호', value: 'issueNumber' },
  { title: '제품명', value: 'productName' },
  { title: '유형', value: 'productType' },
  { title: '상태', value: 'stateCol', sortable: false },
  { title: '진행률', value: 'progressCol', sortable: false },
  { title: '선택', value: 'pick', sortable: false }
];
const processesForProduct = computed(() => {
  if (!pickedOrder.value) return [];
  const isSemi = pickedOrder.value.productType === '반제품';
  return PROCESS_LIST.filter((p) => !(isSemi && p.code === 'ASM'));
});
const pickedProcessName = computed(() => PROCESS_LIST.find((p) => p.code === pickedProcess.value)?.name || '-');

function overallState(o) {
  const list = Object.values(o.processes || {});
  if (!list.length) return 'N/A';
  if (list.some((p) => p?.status === 'RUN')) return '생산중';
  if (list.every((p) => p?.status === 'DONE')) return '생산완료';
  return '생산대기';
}
const stateColor = (s) => (s === '생산중' ? 'primary' : s === '생산완료' ? 'success' : 'grey');
const orderProgress = (o) => {
  const list = Object.values(o.processes || {});
  if (!list.length) return 0;
  return Math.round(list.reduce((a, b) => a + (b?.progress || 0), 0) / list.length);
};
function pickOrder(o) {
  pickedOrder.value = o;
  pickedWorker.value = null;
  pickedProcess.value = null;
  pickedEquipId.value = null;
}

const currentPs = computed(() => pickedOrder.value?.processes?.[pickedProcess.value]);
const procHeaders = [
  { title: '공정', value: 'name' },
  { title: '생산량', value: 'qty', align: 'end' },
  { title: '진행률', value: 'progress', sortable: false, align: 'end' },
  { title: '상태', value: 'state', sortable: false, align: 'end' }
];
const procRows = computed(() => {
  if (!pickedOrder.value) return [];
  const isSemi = pickedOrder.value.productType === '반제품';
  const codes = PROCESS_LIST.filter((p) => !(isSemi && p.code === 'ASM')).map((p) => p.code);
  return codes.map((code) => {
    const pinfo = PROCESS_LIST.find((p) => p.code === code);
    const st = pickedOrder.value.processes[code];
    const qty = st?.prodQty ?? 0;
    const prog = st?.progress ?? 0;
    return {
      code,
      name: pinfo?.name || code,
      qty: `${qty} / ${pickedOrder.value.targetQty}`,
      progress: prog,
      state: st?.status || 'WAIT',
      stateLabel: st?.status === 'RUN' ? '생산중' : st?.status === 'DONE' ? '완료' : st?.status === 'IDLE' ? '대기' : '준비'
    };
  });
});
function stateChipColor(state) {
  return state === 'RUN' ? 'primary' : state === 'DONE' ? 'success' : 'grey';
}
function stateLabelFor(state) {
  return state === 'RUN' ? '생산중' : state === 'DONE' ? '완료' : state === 'IDLE' ? '대기' : '준비';
}

const requiredProcessCodes = computed(() => {
  if (!pickedOrder.value) return [];
  const isSemi = pickedOrder.value.productType === '반제품';
  return PROCESS_LIST.filter((p) => !(isSemi && p.code === 'ASM')).map((p) => p.code);
});
const procProduced = (order, code) => order?.processes?.[code]?.prodQty ?? 0;
const producedOverall = computed(() => {
  if (!pickedOrder.value) return 0;
  const codes = requiredProcessCodes.value;
  if (!codes.length) return 0;
  const list = codes.map((c) => procProduced(pickedOrder.value, c));
  return Math.max(0, Math.min(Math.min(...list), pickedOrder.value.targetQty));
});
const remainingQty = computed(() => (!pickedOrder.value ? 0 : Math.max(0, pickedOrder.value.targetQty - producedOverall.value)));
const psNow = computed(() => pickedOrder.value?.processes?.[pickedProcess.value] || null);
const currentProcProduced = computed(() => psNow.value?.prodQty ?? 0);
const currentProcRemaining = computed(() =>
  !pickedOrder.value ? 0 : Math.max(0, pickedOrder.value.targetQty - (psNow.value?.prodQty ?? 0))
);
const allowedInputCap = computed(() => Math.min(remainingQty.value, currentProcRemaining.value));

/* 키패드/시간 */
const inputQty = ref(0);
const ctrlTime = ref({ startAt: '', endAt: '' });
const isFinishing = ref(false);

function pushDigit(n) {
  const next = Number(String(inputQty.value) + String(n));
  inputQty.value = Math.min(next, allowedInputCap.value);
}
const clearQty = () => (inputQty.value = 0);
const applyQty = () => (inputQty.value = Math.min(inputQty.value, allowedInputCap.value));
function nowISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* 공정 선택시 설비 로딩 */
watch(pickedProcess, async (code) => {
  inputQty.value = 0;
  ctrlTime.value = { startAt: '', endAt: '' };
  pickedEquipId.value = currentPs.value?.equipIds?.[0] || null;
  await loadEquipmentsByProcess(code || '');
});

/* 제어 */
async function doStart() {
  if (!pickedOrder.value || !pickedProcess.value || !pickedWorker.value) return;
  if (!pickedEquipId.value) return alert('설비를 선택하세요.');
  if (inputQty.value <= 0) return alert('투입량을 입력하세요.');
  ctrlTime.value.startAt = nowISO();
  ctrlTime.value.endAt = '';
  const res = await store.startJob({
    orderId: pickedOrder.value.id,
    process: pickedProcess.value,
    workerId: pickedWorker.value.id,
    equipIds: [pickedEquipId.value],
    inputQty: inputQty.value
  });
  if (!res?.ok) return alert(res?.msg || '작업 시작 실패');
  ctrlTime.value.startAt = res.startedAt?.replace(' ', 'T')?.slice(0, 16) || nowISO();
  const eq = equipments.value.find((e) => e.id === pickedEquipId.value);
  if (eq) eq.status = EQ.IN_USE;
  alert('작업이 시작되었습니다.');
}

async function doFinish() {
  if (isFinishing.value) return;
  isFinishing.value = true;
  try {
    if (!pickedOrder.value || !pickedProcess.value) return;

    const res = await store.finishJob(pickedOrder.value.id, pickedProcess.value);
    if (!res?.ok) return alert(res?.msg || '작업종료 실패');

    ctrlTime.value.endAt = (res.endedAt || nowISO()).replace(' ', 'T').slice(0, 16);

    // 설비/목록 갱신
    const eq = equipments.value.find((e) => e.id === pickedEquipId.value);
    if (eq) eq.status = EQ.AVAILABLE;
    await loadEquipmentsByProcess(pickedProcess.value);
    inputQty.value = 0;

    // ✅ 알림은 여기서 "한 번만"
    if (res.defects > 0) {
      alert(`${res.defects}개의 불량이 발생했습니다. 공정완료를 위해 추가 투입해 주세요.`);
    } else {
      alert('작업이 종료되었습니다.');
    }

    if (res.allDone) {
      alert('이 지시의 모든 공정이 완료되어 품질검사 대기 큐에 적재되었습니다.');
    }
  } finally {
    isFinishing.value = false;
  }
}

/* 다음 버튼 활성화 */
const canNext = computed(() =>
  step.value === 1 ? Boolean(pickedOrder.value && pickedWorker.value && pickedProcess.value && pickedEquipId.value) : true
);

/* mount */
onMounted(async () => {
  await Promise.all([store.loadOrders({ page: 1, size: 100 }), store.loadWorkers()]);
});
</script>

<style scoped>
.pc-wrap {
  --pad: 10px;
}
.tight {
  padding-bottom: 0;
}
.tight-title {
  padding: 8px var(--pad);
}
.tight-body {
  padding: 8px var(--pad) 10px;
}
.wizard-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.steps {
  display: flex;
  align-items: center;
  gap: 6px;
}
.step {
  padding: 4px 8px;
  border-radius: 8px;
  background: #f4f4f5;
  font-weight: 600;
  font-size: 12px;
}
.step.active {
  background: #dbeafe;
  color: #1d4ed8;
}
.step.done {
  background: #dcfce7;
  color: #166534;
}
.sep {
  width: 14px;
  height: 2px;
  background: #e5e7eb;
  border-radius: 1px;
}
.actions {
  display: flex;
  gap: 6px;
}
.picked-box {
  padding: 8px;
  border-radius: 8px;
  background: #f8fafc;
}
.picked-line {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.divider {
  color: #9ca3af;
}
.muted {
  color: #6b7280;
}
.small {
  font-size: 12px;
}
.bold {
  font-weight: 700;
}
.grid-btns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.grid-btn {
  justify-content: flex-start;
  flex-direction: column;
  align-items: flex-start;
}
.h-full {
  height: 100%;
}
.no-hover .v-data-table__tr:hover {
  background: transparent;
}
.prog-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.prog-text {
  min-width: 34px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px var(--pad);
  margin-bottom: 8px;
}
.sum-left,
.sum-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bottom-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}
.keypad {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px;
  width: 420px;
  max-width: 100%;
}
.keypad-screen {
  height: 40px;
  background: #111;
  color: #fff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
  font-size: 18px;
}
.keys {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 6px;
}
.keys button {
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: #f3f4f6;
  font-weight: 700;
}
.ctrl-btns {
  white-space: nowrap;
}
.ml-2 {
  margin-left: 8px;
}
</style>
