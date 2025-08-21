import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';
import axios from 'axios';

export const PROCESS_LIST = [
  { code: 'CUT', name: '재단' },
  { code: 'FAB', name: '가공' },
  { code: 'POL', name: '연마' },
  { code: 'PAI', name: '도장' },
  { code: 'ASM', name: '조립' }
];

export const EQ = { AVAILABLE: 'AVAILABLE', IN_USE: 'IN_USE', MAINT: 'MAINT' };
const API = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';

const ROUTES = {
  start: '/workexec/start',
  finish: '/workexec/finish',
  orders: '/workorders',
  orderState: (id) => `/workexec/state/${id}`,
  workers: '/api/workers/production'
};

async function safeGet(url, cfg) {
  try {
    return await axios.get(url, cfg);
  } catch {
    return { data: null };
  }
}
async function safePost(url, body) {
  try {
    return await axios.post(url, body);
  } catch (e) {
    return { data: { ok: false, msg: e?.response?.data?.msg || e.message } };
  }
}

/* ---------- helpers ---------- */
function requiredCodes(productType) {
  return PROCESS_LIST.filter((p) => !(productType === '반제품' && p.code === 'ASM')).map((p) => p.code);
}
function processName(code) {
  return PROCESS_LIST.find((p) => p.code === code)?.name || code;
}
function producedOverall(order) {
  const codes = requiredCodes(order.productType);
  if (!codes.length) return 0;
  const list = codes.map((c) => order.processes[c]?.prodQty ?? 0);
  return Math.max(0, Math.min(order.targetQty, Math.min(...list)));
}
function procInitFor(productType) {
  const obj = {};
  PROCESS_LIST.forEach((pr) => {
    if (productType === '반제품' && pr.code === 'ASM') return;
    obj[pr.code] = {
      status: 'WAIT',
      progress: 0,
      prodQty: 0,
      defectQty: 0,
      inProgress: null,
      startedAt: null,
      endedAt: null,
      worker: null,
      equipIds: []
    };
  });
  return obj;
}
function seedDemoOrders() {
  return [
    {
      id: 1,
      issueNumber: 'WO-20250811-2856',
      productCode: 'P001',
      productName: '블랙 데스크',
      productType: '완제품',
      targetQty: 80,
      producedQty: 0,
      processes: procInitFor('완제품')
    },
    {
      id: 2,
      issueNumber: 'WO-20250705-4112',
      productCode: 'P001',
      productName: '블랙 데스크',
      productType: '완제품',
      targetQty: 120,
      producedQty: 0,
      processes: procInitFor('완제품')
    },
    {
      id: 3,
      issueNumber: 'WO-20250621-1023',
      productCode: 'P002',
      productName: '화이트 데스크',
      productType: '반제품',
      targetQty: 200,
      producedQty: 0,
      processes: procInitFor('반제품')
    }
  ];
}

export const useProcessSimStore = defineStore('process-sim', () => {
  const orders = reactive([]);
  const workers = reactive([]);
  const equipments = reactive([]);

  /* -------- 작업자 로드 -------- */
  async function loadWorkers() {
    workers.splice(0, workers.length);
    // ✅ 부서 파라미터 ‘생산’로 전달
    const res = await safeGet(`${API}${ROUTES.workers}`, { params: { dept: '생산' } });
    (res?.data?.rows || []).forEach((r) =>
      workers.push({
        id: r.id,
        name: r.name,
        dept: r.dept,
        role: r.role,
        phone: r.phone,
        email: r.email
      })
    );
  }

  /* -------- 지시/상태 로드 -------- */
  async function loadOrders({ page = 1, size = 100 } = {}) {
    orders.splice(0, orders.length);
    const res = await safeGet(`${API}${ROUTES.orders}`, { params: { kw: '', page, size } });
    const rows = res?.data?.rows;

    if (Array.isArray(rows) && rows.length) {
      for (const r of rows) {
        const item = {
          id: Number(r.id),
          issueNumber: r.issueNumber,
          productCode: r.productCode,
          productName: r.productName,
          productType: r.productType || '완제품',
          targetQty: Number(r.targetQty || 0),
          producedQty: 0,
          processes: procInitFor(r.productType || '완제품')
        };

        const st = await safeGet(`${API}${ROUTES.orderState(r.id)}`).then((x) => x.data?.rows || []);
        st.forEach((row) => {
          const p = item.processes[row.process_code];
          if (!p) return;
          p.status = row.status || p.status;
          p.progress = Number(row.progress ?? p.progress);
          p.prodQty = Number(row.prod_qty ?? p.prodQty);
          p.defectQty = Number(row.defect_qty ?? p.defectQty ?? 0);
          p.startedAt = row.started_at || null;
          p.endedAt = row.ended_at || null;
          p.worker = row.worker_id || null;
          p.equipIds = (row.equip_ids || '').split(',').filter(Boolean);
        });

        item.producedQty = producedOverall(item);
        orders.push(item);
      }
    } else {
      seedDemoOrders().forEach((o) => orders.push(o));
    }
  }

  /* -------- 설비 상태 도우미 -------- */
  function setEquipStatus(ids = [], status) {
    const set = new Set((ids || []).map(String));
    equipments.forEach((e) => {
      if (set.has(String(e.id))) e.status = status;
    });
  }

  function _recalcOrderProduced(order) {
    order.producedQty = producedOverall(order);
  }

  /* -------- 진행 제어 -------- */
  async function startJob(payload) {
    // payload: { orderId, process, workerId, equipIds, inputQty, startAt }
    const { orderId, process } = payload || {};
    const ord = orders.find((o) => Number(o.id) === Number(orderId));
    if (!ord) return { ok: false, msg: '지시 없음' };
    const ps = ord.processes[process];
    if (!ps) return { ok: false, msg: '해당 공정이 지시에 없음' };

    const body = {
      woId: Number(payload.orderId),
      process: payload.process,
      workerId: payload.workerId,
      equipIds: payload.equipIds,
      inputQty: Number(payload.inputQty || 0),
      startAt: payload.startAt
    };

    const resp = await safePost(`${API}${ROUTES.start}`, body);
    const data = resp?.data || {};
    if (data?.ok === false) return data;

    ps.status = 'RUN';
    ps.worker = payload.workerId;
    ps.equipIds = (payload.equipIds || []).slice();
    ps.startedAt = data.startedAt || payload.startAt || new Date().toISOString();
    ps.endedAt = null;
    ps.inProgress = {
      inputQty: Number(payload.inputQty || 0),
      doneQty: 0,
      startAt: ps.startedAt,
      endAt: null,
      workerId: payload.workerId,
      equipIds: ps.equipIds.slice()
    };
    setEquipStatus(ps.equipIds, EQ.IN_USE);
    return { ok: true, startedAt: data.startedAt || null };
  }

  async function finishJob(payload) {
    // payload: { orderId, process, workerId, equipIds, startAt, endAt, inputQty }
    const { orderId, process } = payload || {};
    const ord = orders.find((o) => Number(o.id) === Number(orderId));
    if (!ord) return { ok: false, msg: '지시 없음' };
    const ps = ord.processes[process];
    if (!ps) return { ok: false, msg: '해당 공정이 지시에 없음' };

    // ★ 서버는 addDone(이번 종료 증가량)을 요구함
    const body = {
      woId: Number(payload.orderId),
      process: payload.process,
      addDone: Number(payload.inputQty || 0)
    };

    const resp = await safePost(`${API}${ROUTES.finish}`, body);
    const data = resp?.data || {};
    if (data?.ok === false) return data;

    // 서버 응답 기준으로 동기화
    if (typeof data.prodQty === 'number') ps.prodQty = data.prodQty;
    if (typeof data.progress === 'number') ps.progress = data.progress;
    if (data.endedAt) ps.endedAt = data.endedAt;

    ps.status = ps.progress >= 100 ? 'DONE' : 'IDLE';
    ps.inProgress = null;
    setEquipStatus(ps.equipIds, EQ.AVAILABLE);

    _recalcOrderProduced(ord);

    return {
      ok: true,
      endedAt: data.endedAt || null,
      prodQty: ps.prodQty,
      progress: ps.progress,
      allDone: !!data.allDone
    };
  }

  /* -------- 파생 -------- */
  const flatRowsForStatus = computed(() => {
    const out = [];
    for (const o of orders) {
      const reqCodes = requiredCodes(o.productType);
      for (const code of reqCodes) {
        const ps = o.processes[code];
        out.push({
          orderId: o.id,
          process: code,
          processName: processName(code),
          issueNumber: o.issueNumber,
          productName: o.productName,
          state: ps?.status || 'WAIT',
          progress: ps?.progress ?? 0,
          targetQty: o.targetQty,
          producedQty: ps?.prodQty ?? 0,
          remainingQty: Math.max(o.targetQty - (ps?.prodQty ?? 0), 0),
          defectQty: ps?.defectQty ?? 0
        });
      }
    }
    return out;
  });

  function findPerformance(q = {}) {
    const kwNo = (q.issueNumber || '').trim();
    const kwName = (q.productName || '').trim();
    const type = q.productType || '';
    let hit = null;
    if (kwNo) hit = orders.find((x) => (x.issueNumber || '').includes(kwNo));
    if (!hit && (kwName || type)) {
      hit = orders.find((x) => (!kwName || (x.productName || '').includes(kwName)) && (!type || x.productType === type));
    }
    if (!hit) return null;

    const reqCodes = requiredCodes(hit.productType);
    const items = [];
    for (const code of reqCodes) {
      const ps = hit.processes[code] || {};
      const st = ps.startedAt ? ps.startedAt.replace(' ', 'T').slice(0, 16) : '';
      const en = ps.endedAt ? ps.endedAt.replace(' ', 'T').slice(0, 16) : '';
      items.push({
        process: processName(code),
        worker: ps.worker || '',
        startAt: st || '',
        endAt: en || st || '',
        orderQty: hit.targetQty,
        inputQty: Math.min(hit.targetQty, (ps.prodQty || 0) + (ps.defectQty || 0)),
        defectQty: ps.defectQty || 0,
        outputQty: Math.min(hit.targetQty, ps.prodQty || 0)
      });
    }
    return {
      issueNumber: hit.issueNumber,
      productCode: hit.productCode,
      productName: hit.productName,
      productType: hit.productType,
      items
    };
  }

  return {
    PROCESS_LIST,
    EQ,
    orders,
    workers,
    equipments,
    loadWorkers,
    loadOrders,
    startJob,
    finishJob,
    flatRowsForStatus,
    findPerformance,
    producedOverall
  };
});
