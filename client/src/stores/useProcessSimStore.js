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
  } catch {
    return { data: null };
  }
}

/* ---------- seeds (orders only, fallback) ---------- */
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

/* ---------- store ---------- */
export const useProcessSimStore = defineStore('process-sim', () => {
  const orders = reactive([]);
  const workers = reactive([]);
  const equipments = reactive([]);

  /* -------- 작업자 로드 (EMPLOYEES 생산부/재직) -------- */
  async function loadWorkers() {
    workers.splice(0, workers.length);
    const res = await safeGet(`${API}/api/workers/production`);
    const rows = res?.data?.rows || [];
    rows.forEach((r) =>
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
    const res = await safeGet(`${API}/workorders`, { params: { kw: '', page, size } });
    const rows = res?.data?.rows;

    if (Array.isArray(rows) && rows.length) {
      for (const r of rows) {
        const item = {
          id: r.id,
          issueNumber: r.issueNumber,
          productCode: r.productCode,
          productName: r.productName,
          productType: r.productType || '완제품',
          targetQty: Number(r.targetQty || 0),
          producedQty: 0,
          processes: procInitFor(r.productType || '완제품')
        };

        const st = await safeGet(`${API}/workexec/state/${r.id}`).then((x) => x.data?.rows || []);
        st.forEach((row) => {
          const p = item.processes[row.process_code];
          if (!p) return;
          p.status = row.status || p.status;
          p.progress = Number(row.progress || p.progress);
          p.prodQty = Number(row.prod_qty || p.prodQty);
          p.defectQty = Number(row.defect_qty || p.defectQty || 0);
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

  /* -------- 설비 상태 변경 도우미 -------- */
  function setEquipStatus(ids = [], status) {
    const set = new Set(ids);
    equipments.forEach((e) => {
      if (set.has(e.id)) e.status = status;
    });
  }
  function _recalcProcProgress(order, process) {
    const rt = order.processes[process];
    const pct = Math.floor((rt.prodQty / Math.max(order.targetQty, 1)) * 100);
    rt.progress = Math.max(0, Math.min(100, pct));
    if (rt.progress >= 100) rt.status = 'DONE';
  }
  function _recalcOrderProduced(order) {
    order.producedQty = producedOverall(order);
  }

  /* -------- 진행 제어 -------- */
  async function startJob({ orderId, process, workerId, equipIds, inputQty }) {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return { ok: false, msg: '지시 없음' };
    const ps = ord.processes[process];
    if (!ps) return { ok: false, msg: '해당 공정이 지시에 없음' };

    const resp = await safePost(`${API}/workexec/start`, { woId: orderId, process, workerId, equipIds, inputQty });
    const server = resp?.data || {};

    ps.status = 'RUN';
    ps.worker = workerId;
    ps.equipIds = (equipIds || []).slice();
    ps.startedAt = server.startedAt || new Date().toISOString();
    ps.endedAt = null;
    ps.inProgress = {
      inputQty: Number(inputQty || 0),
      doneQty: 0,
      startAt: ps.startedAt,
      endAt: null,
      workerId,
      equipIds: ps.equipIds.slice()
    };
    setEquipStatus(ps.equipIds, EQ.IN_USE);
    return { ok: true, startedAt: server.startedAt || null };
  }

  async function finishJob(orderId, process) {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return { ok: false, msg: '지시 없음' };
    const ps = ord.processes[process];
    if (!ps) return { ok: false, msg: '해당 공정이 지시에 없음' };

    let batchInput = 0;
    if (ps.inProgress) {
      const input = Number(ps.inProgress.inputQty || 0);
      const done = Number(ps.inProgress.doneQty || 0);
      batchInput = Math.max(input - done, 0);
      ps.inProgress.endAt = new Date().toISOString();
      ps.inProgress = null;
    }

    // 0~3% 불량 시뮬레이션 (알림은 화면에서만)
    let goodToAdd = 0;
    let defects = 0;
    if (batchInput > 0) {
      const rate = Math.floor(Math.random() * 4) / 100; // 0,1,2,3%
      defects = Math.min(batchInput, Math.round(batchInput * rate)); // ← 재선언 금지(가려짐 버그 수정)
      ps.defectQty = Math.max(0, (ps.defectQty || 0) + defects);
      goodToAdd = Math.max(0, batchInput - defects);
    }

    const resp = await safePost(`${API}/workexec/finish`, { woId: orderId, process, addDone: goodToAdd });
    const server = resp?.data || {};

    if (goodToAdd > 0) {
      const canAdd = Math.max(ord.targetQty - ps.prodQty, 0);
      ps.prodQty += Math.min(goodToAdd, canAdd);
    }

    _recalcProcProgress(ord, process);
    _recalcOrderProduced(ord);
    ps.status = ps.progress >= 100 ? 'DONE' : 'IDLE';
    ps.endedAt = server.endedAt || new Date().toISOString();
    setEquipStatus(ps.equipIds, EQ.AVAILABLE);

    return {
      ok: true,
      defects,
      endedAt: server.endedAt || null,
      allDone: !!server.allDone
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
