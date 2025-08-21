// server/services/production_service.js
const mapper = require("../database/mapper");

/* 공통 페이지 파라미터 */
function pageParam(q) {
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const size = Math.max(parseInt(q.size || "10", 10), 1);
  return { page, size, limit: size, offset: (page - 1) * size };
}

/* 제품 유형 조회 */
async function resolveProductType(productCode, fallback = "완제품") {
  const row = (
    await mapper.query("product.selectTypeByCode", [productCode])
  )?.[0];
  return row?.prdType || fallback;
}

/* =========================
 * 제품/의뢰/계획
 * ========================= */
async function getProducts({ kw = "", page = 1, size = 10 }) {
  const { limit, offset } = pageParam({ page, size });
  const like = `%${kw}%`;
  const rows = await mapper.query("production.selectProducts", [
    kw,
    like,
    like,
    limit,
    offset,
  ]);
  const cnt = await mapper.query("production.countProducts", [kw, like, like]);
  return { ok: true, rows, total: cnt[0]?.cnt || 0 };
}

async function getRequests({ kw = "", page = 1, size = 10 }) {
  const { limit, offset } = pageParam({ page, size });
  const like = `%${kw}%`;
  const rows = await mapper.query("production.selectRequests", [
    kw,
    like,
    like,
    like,
    limit,
    offset,
  ]);
  const cnt = await mapper.query("production.countRequests", [
    kw,
    like,
    like,
    like,
  ]);
  return { rows, total: cnt[0]?.cnt || 0 };
}

async function savePlan(body) {
  const f = body?.form || {};
  const linkedOrderIds = (body?.linkedOrderIds || [])
    .map((v) => String(v).trim())
    .filter(Boolean);

  if (!f.issueNumber || !f.orderDate || !f.productCode) {
    throw new Error("필수 값 누락(계획번호/계획일자/제품코드)");
  }

  const prdType =
    f.productType || (await resolveProductType(f.productCode, "완제품"));

  await mapper.query("production.insertPlan", [
    f.issueNumber,
    f.orderDate,
    f.contact || null,
    f.orderNo || null,
    f.dueDate || null,
    f.dueDate2 || null,
    Number(f.targetQty || 0),
    f.productCode,
    f.productName || "",
    prdType,
    f.memo || null,
  ]);

  const planRow = await mapper.query("production.selectPlanByNo", [
    f.issueNumber,
  ]);
  const planId = planRow?.[0]?.id;
  if (!planId) throw new Error("계획 저장 실패(planId 없음)");

  if (linkedOrderIds.length) {
    const csv = linkedOrderIds.join(",");
    await mapper.query("orders.updateStatusByIdsCsv", ["진행중", csv]);
  }

  return { planId, planNo: f.issueNumber, ok: true };
}

async function getPlans({ kw = "", page = 1, size = 10 }) {
  const { limit, offset } = pageParam({ page, size });
  const r1 = await mapper.query("production.sp.selectPlans", [
    kw,
    limit,
    offset,
  ]);
  const list = Array.isArray(r1) ? (Array.isArray(r1[0]) ? r1[0] : r1) : [];
  const r2 = await mapper.query("production.sp.countPlans", [kw]);
  const cntRow = Array.isArray(r2)
    ? Array.isArray(r2[0])
      ? r2[0][0]
      : r2[0]
    : null;
  const total = cntRow?.cnt ? Number(cntRow.cnt) : 0;
  return { rows: list, total, ok: true };
}

async function updatePlan(id, body = {}) {
  const f = body || {};
  const createdDate = (f.createdDate || "").substring(0, 10) || null;
  const dueDate = (f.dueDate || "").substring(0, 10) || null;

  const res = await mapper.query("production.sp.updatePlan", [
    Number(id),
    f.planName || "",
    f.productCode || "",
    createdDate,
    f.writer || "",
    dueDate,
    Number(f.totalQty || 0),
    f.memo || null,
  ]);

  const affected = Array.isArray(res?.[0])
    ? res[0][0]?.affected
    : res?.[0]?.affected || 0;
  return { affected, ok: true };
}

async function deletePlans(ids = []) {
  const onlyNums = (Array.isArray(ids) ? ids : [])
    .map((v) => String(v).trim())
    .filter((v) => /^\d+$/.test(v));
  if (!onlyNums.length) return { affected: 0, ok: true };

  const csv = onlyNums.join(",");
  const res = await mapper.query("production.sp.deletePlans", [csv]);
  const affected = Array.isArray(res?.[0])
    ? res[0][0]?.affected
    : res?.[0]?.affected || 0;
  return { affected, ok: true };
}

/* --------- 제품별 BOM 조회 --------- */
async function getBomForProduct(productCode = "") {
  const code = String(productCode || "").trim();
  if (!code) return { header: null, items: [], ok: true };

  const header =
    (await mapper.query("production.selectBomHeaderByProduct", [code]))?.[0] ||
    null;
  if (!header) return { header: null, items: [], ok: true };

  const items = await mapper.query("production.selectBomItemsByHeader", [
    header.bomCode,
    header.bomVer,
  ]);
  return { header, items, ok: true };
}

/* =========================
 * 자재 현황
 * ========================= */
async function getMaterialStatus({ productCode = "", targetQty = 1 }) {
  const code = String(productCode || "").trim();
  const tgt = Math.max(Number(targetQty || 0), 0);
  if (!code) return { rows: [], count: 0, ok: true };

  const header =
    (await mapper.query("production.selectBomHeaderByProduct", [code]))?.[0] ||
    null;
  if (!header) return { rows: [], count: 0, ok: true };

  const bomItems = await mapper.query("production.selectBomItemsByHeader", [
    header.bomCode,
    header.bomVer,
  ]);
  if (!Array.isArray(bomItems) || !bomItems.length)
    return { rows: [], count: 0, ok: true };

  const matCsv = bomItems
    .map((x) => x.matCode)
    .filter(Boolean)
    .join(",");
  let availMap = new Map();
  if (matCsv) {
    const avail = await mapper.query("materials.selectAvailableByCodesCsv", [
      matCsv,
    ]);
    (avail || []).forEach((a) => availMap.set(a.matCode, a));
  }

  const rows = bomItems.map((it) => {
    const a = availMap.get(it.matCode) || {};
    const unit = it.unit || a.unit || "";
    const bomQty = Number(it.qty || 0);
    const requiredQty = Math.max(0, bomQty * tgt);
    const availableQty = Math.max(0, Number(a.availableQty || 0));
    const shortage = Math.max(0, requiredQty - availableQty);
    return {
      matCode: it.matCode,
      matName: it.matName,
      unit,
      bomQty,
      requiredQty,
      availableQty,
      shortage,
    };
  });

  return { rows, count: rows.length, ok: true };
}

/* =========================
 * 작업지시
 * ========================= */
async function createWorkOrder(body = {}) {
  const f = body?.form || {};
  const selectedPlanIds = body?.selectedPlanIds || [];

  if (!f.issueNumber) return { ok: false, msg: "지시번호가 없습니다." };
  if (!f.orderDate) return { ok: false, msg: "지시일자를 입력하세요." };
  if (!f.writer && !f.contact)
    return { ok: false, msg: "작성자를 입력하세요." };
  if (!f.productCode || !f.productName)
    return { ok: false, msg: "제품을 선택하세요." };
  if (!f.dueDate) return { ok: false, msg: "납기일자를 입력하세요." };

  const csv = (selectedPlanIds || [])
    .map((v) => String(v).trim())
    .filter((v) => /^\d+$/.test(v))
    .join(",");

  let orderName = (f.orderName || "").trim();
  if (!orderName && csv) {
    const r = await mapper.query("workorder.selectPlanNamesInCsv", [csv]);
    const row = Array.isArray(r) ? r[0] : r?.[0];
    orderName = row?.names || "";
  }

  const prdType =
    f.productType || (await resolveProductType(f.productCode, "완제품"));

  const res = await mapper.query("workorder.sp.create", [
    f.issueNumber,
    orderName || null,
    (f.orderDate || "").substring(0, 10) || null,
    f.writer || f.contact || "",
    f.productCode || "",
    f.productName || "",
    (f.dueDate || "").substring(0, 10) || null,
    Number(f.targetQty || 0),
    csv || null,
    f.memo || null,
  ]);
  const woId = Array.isArray(res?.[0]) ? res[0][0]?.id : res?.[0]?.id;
  if (!woId) return { ok: false, msg: "지시 저장 실패" };

  await mapper.query("workorder.updateProductType", [prdType, Number(woId)]);
  await mapper.query("exec.initStatesForWo", [Number(woId), prdType]);

  const mat = await getMaterialStatus({
    productCode: f.productCode,
    targetQty: Number(f.targetQty || 0),
  });
  const shortages = (mat.rows || []).filter((r) => Number(r.shortage || 0) > 0);
  if (shortages.length) {
    await mapper.query("workorder.sp.delete", [String(woId)]);
    return {
      ok: false,
      msg: "자재 부족으로 작업지시를 생성할 수 없습니다.",
      shortages,
    };
  }

  for (const r of mat.rows || []) {
    if (Number(r.requiredQty || 0) <= 0) continue;
    await mapper.query("materials.reserveInsert", [
      Number(woId),
      f.productCode,
      r.matCode,
      Number(r.requiredQty || 0),
      `WO ${f.issueNumber}`,
    ]);
  }

  return { ok: true, woId, woNo: f.issueNumber };
}

async function getWorkOrders({ kw = "", page = 1, size = 10 }) {
  const { limit, offset } = pageParam({ page, size });
  const r1 = await mapper.query("workorder.sp.select", [kw, limit, offset]);
  const rows = Array.isArray(r1?.[0]) ? r1[0] : Array.isArray(r1) ? r1 : [];

  const missingCodes = rows
    .filter((x) => !x.productType && x.productCode)
    .map((x) => x.productCode);
  if (missingCodes.length) {
    const csv = [...new Set(missingCodes)].join(",");
    const trows = await mapper.query("product.selectTypesByCodesCsv", [csv]);
    const tmap = new Map();
    (trows || []).forEach((t) => tmap.set(t.code, t.prdType));
    rows.forEach((r) => {
      if (!r.productType && r.productCode)
        r.productType = tmap.get(r.productCode) || "완제품";
    });
  }

  const r2 = await mapper.query("workorder.sp.count", [kw]);
  const cntRow = Array.isArray(r2?.[0]) ? r2[0][0] : r2?.[0];
  return { rows, total: Number(cntRow?.cnt || 0), ok: true };
}

async function updateWorkOrder(id, body = {}) {
  const f = body || {};
  const res = await mapper.query("workorder.sp.update", [
    Number(id),
    f.orderName || null,
    (f.orderDate || "").substring(0, 10) || null,
    f.contact || "",
    f.productCode || "",
    f.productName || "",
    (f.dueDate || "").substring(0, 10) || null,
    Number(f.targetQty || 0),
    f.memo || null,
  ]);
  const affected = Array.isArray(res?.[0])
    ? res[0][0]?.affected
    : res?.[0]?.affected || 0;
  return { affected, ok: true };
}

async function deleteWorkOrders(ids = []) {
  const onlyNums = (Array.isArray(ids) ? ids : [])
    .map((v) => String(v).trim())
    .filter((v) => /^\d+$/.test(v));
  if (!onlyNums.length) return { affected: 0, ok: true };

  for (const id of onlyNums) {
    await mapper.query("materials.reserveCancelByWo", [Number(id)]);
  }
  const csv = onlyNums.join(",");
  const res = await mapper.query("workorder.sp.delete", [csv]);
  const affected = Array.isArray(res?.[0])
    ? res[0][0]?.affected
    : res?.[0]?.affected || 0;

  return { affected, ok: true };
}

/* 공정 상태 조회/진행 */
async function getExecState(woId) {
  const rows = await mapper.query("exec.getState", [Number(woId)]);
  return rows || [];
}

async function startExec({ woId, process, workerId, equipIds = [], inputQty }) {
  if (!woId || !process || !inputQty) throw new Error("필수값 누락");

  await mapper.query("exec.upsertState", [
    Number(woId),
    process,
    "RUN",
    workerId || null,
    (equipIds || []).join(",") || null,
  ]);
  await mapper.query("exec.insertRun", [
    Number(woId),
    process,
    Number(inputQty),
    workerId || null,
    (equipIds || []).join(",") || null,
  ]);

  const st =
    (await mapper.query("exec.getStateOne", [Number(woId), process]))?.[0] ||
    null;
  return { ok: true, startedAt: st?.started_at || null, state: st };
}

async function pauseExec({ woId, process, partialDone = 0 }) {
  await mapper.query("exec.pauseLatest", [
    Number(partialDone || 0),
    Number(woId),
    process,
  ]);
  await mapper.query("exec.upsertState", [
    Number(woId),
    process,
    "PAUSE",
    null,
    null,
  ]);
  return { ok: true };
}

async function finishExec({ woId, process, addDone = 0 }) {
  await mapper.query("exec.finishLatest", [
    Number(addDone || 0),
    Number(woId),
    process,
  ]);

  const h = (await mapper.query("exec.getWoHeader", [Number(woId)]))?.[0];
  const target = Number(h?.target_qty || 0);
  const ptype = h?.product_type || "완제품";

  await mapper.query("exec.bumpStateOnFinish", [
    Number(addDone || 0),
    target,
    Number(addDone || 0),
    Number(addDone || 0),
    target,
    target,
    Number(addDone || 0),
    target,
    target,
    Number(woId),
    process,
  ]);

  const need =
    (await mapper.query("exec.countRequiredProcs", [ptype]))?.[0]?.cnt || 0;
  const done =
    (await mapper.query("exec.countDoneProcs", [Number(woId), ptype]))?.[0]
      ?.cnt || 0;
  const allDone = need > 0 && done >= need;
  if (allDone) {
    await mapper.query("exec.enqueueQuality", [Number(woId), target]);
  }

  const st =
    (await mapper.query("exec.getStateOne", [Number(woId), process]))?.[0] ||
    null;

  const lastRun = await mapper.query(
    `
      SELECT end_at AS endAt
      FROM work_order_exec
      WHERE wo_id = ? AND process_code = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [Number(woId), process]
  );
  const runEndedAt = lastRun?.[0]?.endAt || null;

  return {
    ok: true,
    allDone,
    endedAt: runEndedAt || st?.ended_at || null,
    progress: Number(st?.progress || 0),
    prodQty: Number(st?.prod_qty || 0),
  };
}

/* 설비/작업자 */
async function getFacilitiesWithStatus({ process = "" } = {}) {
  const base = await mapper.query("facility.selectWithLatestStatus", [
    process,
    process,
  ]);
  const runRows = await mapper.query("production.selectRunningEquipIds");
  const runSet = new Set();
  for (const r of runRows || []) {
    String(r.equipIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => runSet.add(id));
  }
  const rows = (base || []).map((r) => {
    let status = "AVAILABLE";
    if (runSet.has(r.facId)) status = "IN_USE";
    else if (Number(r.fsStatus) === 1) status = "MAINT";
    return {
      id: r.facId,
      code: r.facId,
      name: r.facName,
      process: r.prId,
      status,
      manager: r.manager,
      company: r.facCompany,
      useYn: Number(r.facUse || 0),
      type: r.facType,
      fsStatus: r.fsStatus,
      fsReason: r.fsReason || null,
      downStart: r.downStart || null,
      downEnd: r.downEnd || null,
    };
  });
  return { rows, count: rows.length, ok: true };
}

/* 생산 작업자 */
async function getProductionWorkers(dept = "생산") {
  let rows = await mapper.query("production.selectWorkers.employees", [
    dept,
    dept,
    dept,
  ]);

  if (!Array.isArray(rows) || rows.length === 0) {
    const any = await mapper.query("production.selectWorkers.employees", [
      "",
      "",
      "",
    ]);
    rows = (any || []).filter((r) => String(r.dept || "").includes("생산"));
  }

  return (rows || []).map((r) => ({
    id: r.id,
    name: r.name,
    dept: r.dept || "생산",
    role: r.auth || "",
    phone: r.phone || "",
    email: r.email || "",
    status: "재직",
  }));
}

module.exports = {
  getProducts,
  getRequests,
  savePlan,
  getPlans,
  updatePlan,
  deletePlans,
  createWorkOrder,
  getWorkOrders,
  updateWorkOrder,
  deleteWorkOrders,
  getBomForProduct,
  getMaterialStatus,
  getExecState,
  startExec,
  pauseExec,
  finishExec,
  getFacilitiesWithStatus,
  getProductionWorkers,
};
