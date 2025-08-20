// server/services/production_service.js
const mapper = require("../database/mapper");

/* 공통 페이지 파라미터 */
function pageParam(q) {
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const size = Math.max(parseInt(q.size || "10", 10), 1);
  return { page, size, limit: size, offset: (page - 1) * size };
}

/* 제품 유형 조회 (PRODUCT.PRD_TYPE) */
async function resolveProductType(productCode, fallback = "완제품") {
  const row = (
    await mapper.query("product.selectTypeByCode", [productCode])
  )?.[0];
  return row?.prdType || fallback;
}

/* =========================
 * 제품 목록
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
  return { rows, total: cnt[0]?.cnt || 0 };
}

/* =========================
 * 생산의뢰 목록
 * ========================= */
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

/* =========================
 * 생산계획 저장 (일반쿼리)
 * ========================= */
async function savePlan(body) {
  const f = body?.form || {};
  const selected = body?.selectedReqs || [];

  if (!f.issueNumber || !f.orderDate || !f.productCode) {
    throw new Error("필수 값 누락(계획번호/계획일자/제품코드)");
  }

  // 제품 유형 자동 삽입
  const prdType =
    f.productType || (await resolveProductType(f.productCode, "완제품"));

  // 1) 헤더 저장
  await mapper.query("production.insertPlan", [
    f.issueNumber,
    f.orderDate, // plan_name
    f.contact || null, // writer
    f.orderNo || null, // order_no
    f.dueDate || null, // created_date
    f.dueDate2 || null, // due_date
    Number(f.targetQty || 0), // total_qty
    f.productCode,
    f.productName || "",
    prdType, // product_type
    f.memo || null,
  ]);

  // 2) plan id 조회
  const planRow = await mapper.query("production.selectPlanByNo", [
    f.issueNumber,
  ]);
  const planId = planRow?.[0]?.id;
  if (!planId) throw new Error("계획 저장 실패(planId 없음)");

  // 3) 라인 저장
  for (const r of selected) {
    await mapper.query("production.insertPlanItem", [
      planId,
      r.id,
      Number(r.totalQty || 0),
    ]);
  }

  return { planId, planNo: f.issueNumber };
}

/* =========================
 * 생산계획 목록 (프로시저)
 * ========================= */
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

  return { rows: list, total };
}

/* =========================
 * 생산계획 수정 (프로시저)
 * ========================= */
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
  return { affected };
}

/* =========================
 * 생산계획 삭제 (프로시저)
 * ========================= */
async function deletePlans(ids = []) {
  const onlyNums = (Array.isArray(ids) ? ids : [])
    .map((v) => String(v).trim())
    .filter((v) => /^\d+$/.test(v));

  if (!onlyNums.length) return { affected: 0 };

  const csv = onlyNums.join(",");
  const res = await mapper.query("production.sp.deletePlans", [csv]);
  const affected = Array.isArray(res?.[0])
    ? res[0][0]?.affected
    : res?.[0]?.affected || 0;

  return { affected };
}

/* --------- 제품별 BOM 조회 --------- */
async function getBomForProduct(productCode = "") {
  const code = String(productCode || "").trim();
  if (!code) return { header: null, items: [] };

  const header =
    (await mapper.query("production.selectBomHeaderByProduct", [code]))?.[0] ||
    null;
  if (!header) return { header: null, items: [] };

  const items = await mapper.query("production.selectBomItemsByHeader", [
    header.bomCode,
    header.bomVer,
  ]);
  return { header, items };
}

/* =========================================================
 *                 작업지시(Work Orders)
 * ========================================================= */

/* 작업지시 생성 */
async function createWorkOrder(body = {}) {
  const f = body?.form || {};
  const selectedPlanIds = body?.selectedPlanIds || []; // [1,2,3]

  if (!f.issueNumber) throw new Error("지시번호가 없습니다.");
  if (!f.orderDate) throw new Error("지시일자를 입력하세요.");
  if (!f.writer && !f.contact) throw new Error("작성자를 입력하세요.");
  if (!f.productCode || !f.productName) throw new Error("제품을 선택하세요.");
  if (!f.dueDate) throw new Error("납기일자를 입력하세요.");

  const csv = (selectedPlanIds || [])
    .map((v) => String(v).trim())
    .filter((v) => /^\d+$/.test(v))
    .join(",");

  // 지시명 자동 채움 (프론트에서 없는 경우)
  let orderName = (f.orderName || "").trim();
  if (!orderName && csv) {
    const r = await mapper.query("workorder.selectPlanNamesInCsv", [csv]);
    const row = Array.isArray(r) ? r[0] : r?.[0];
    orderName = row?.names || "";
  }

  // 제품 유형 보장
  const prdType =
    f.productType || (await resolveProductType(f.productCode, "완제품"));

  const res = await mapper.query("workorder.sp.create", [
    f.issueNumber, // wo_no
    orderName || null, // wo_name
    (f.orderDate || "").substring(0, 10) || null, // wo_date
    f.writer || f.contact || "", // writer
    f.productCode || "", // product_code
    f.productName || "", // product_name
    (f.dueDate || "").substring(0, 10) || null, // due_date
    Number(f.targetQty || 0), // target_qty
    csv || null, // plan_ids_csv
    f.memo || null, // memo
  ]);

  // CALL 결과: [[{ id }], meta] 또는 [{ id }]
  const woId = Array.isArray(res?.[0]) ? res[0][0]?.id : res?.[0]?.id;

  // SP가 product_type을 세팅하지 않는 경우 보정
  if (woId) {
    await mapper.query("workorder.updateProductType", [prdType, Number(woId)]);
  }

  return { woId, woNo: f.issueNumber };
}

/* 작업지시 목록 */
async function getWorkOrders({ kw = "", page = 1, size = 10 }) {
  const { limit, offset } = pageParam({ page, size });
  const r1 = await mapper.query("workorder.sp.select", [kw, limit, offset]);
  const rows = Array.isArray(r1?.[0]) ? r1[0] : Array.isArray(r1) ? r1 : [];

  // productType 누락분 보정
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
  return { rows, total: Number(cntRow?.cnt || 0) };
}

/* 작업지시 수정 */
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
  return { affected };
}

/* 작업지시 삭제 */
async function deleteWorkOrders(ids = []) {
  const onlyNums = (Array.isArray(ids) ? ids : [])
    .map((v) => String(v).trim())
    .filter((v) => /^\d+$/.test(v));
  if (!onlyNums.length) return { affected: 0 };

  const csv = onlyNums.join(",");
  const res = await mapper.query("workorder.sp.delete", [csv]);
  const affected = Array.isArray(res?.[0])
    ? res[0][0]?.affected
    : res?.[0]?.affected || 0;
  return { affected };
}

/* =========================
 * 공정 상태 조회
 * ========================= */
async function getExecState(woId) {
  const rows = await mapper.query("exec.getState", [Number(woId)]);
  return rows || [];
}

/* =========================
 * 작업 시작 (시작 시각 DB 기록)
 * ========================= */
async function startExec({ woId, process, workerId, equipIds = [], inputQty }) {
  if (!woId || !process || !inputQty) throw new Error("필수값 누락");

  // 상태 upsert + 실행 row 생성 (NOW()로 started_at/start_at 기록)
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

  // 최신 상태 반환(새로고침 복원 용)
  const st =
    (await mapper.query("exec.getStateOne", [Number(woId), process]))?.[0] ||
    null;
  return { ok: true, startedAt: st?.started_at || null, state: st };
}

/* =========================
 * 작업 일시정지
 * ========================= */
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

/* =========================
 * 작업 종료 (종료 시각 DB 기록 + 품질큐 적재)
 * ========================= */
async function finishExec({ woId, process, addDone = 0 }) {
  // 1) 가장 최근 실행건 DONE 반영 (work_order_exec.end_at = NOW())
  await mapper.query("exec.finishLatest", [
    Number(addDone || 0),
    Number(woId),
    process,
  ]);

  // 2) 헤더 조회(목표/유형)
  const h = (await mapper.query("exec.getWoHeader", [Number(woId)]))?.[0];
  const target = Number(h?.target_qty || 0);
  const ptype = h?.product_type || "완제품";

  // 3) 공정 상태 누적/진행률 갱신 (100%되면 work_order_process_state.ended_at=NOW())
  await mapper.query("exec.bumpStateOnFinish", [
    Number(addDone || 0),
    target,
    Number(addDone || 0),
    target,
    target,
    Number(addDone || 0),
    target,
    target,
    Number(addDone || 0),
    target,
    target,
    Number(woId),
    process,
  ]);

  // 4) 모든 필요 공정 완료되면 품질 큐에 enqueue
  const need =
    (await mapper.query("exec.countRequiredProcs", [ptype]))?.[0]?.cnt || 0;
  const done =
    (await mapper.query("exec.countDoneProcs", [Number(woId), ptype]))?.[0]
      ?.cnt || 0;
  const allDone = need > 0 && done >= need;
  if (allDone) {
    await mapper.query("exec.enqueueQuality", [Number(woId), target]);
  }

  // 5) 최신 상태 반환
  const st =
    (await mapper.query("exec.getStateOne", [Number(woId), process]))?.[0] ||
    null;
  return {
    ok: true,
    allDone,
    endedAt: st?.ended_at || null,
    progress: Number(st?.progress || 0),
    prodQty: Number(st?.prod_qty || 0),
  };
}

/* =========================
 * 설비 목록 + 상태 계산
 *  - 입력: process (예: 'PRC-001'), 없으면 전체
 *  - 상태 우선순위: IN_USE > MAINT(FS_STATUS=1) > AVAILABLE
 * ========================= */
async function getFacilitiesWithStatus({ process = "" } = {}) {
  // 1) 설비 + 최신 FACILITY_STATUS (fs_status, fs_reason 등 함께)
  const base = await mapper.query("facility.selectWithLatestStatus", [
    process,
    process,
  ]);

  // 2) 현재 실행 중 설비 id 세트
  const runRows = await mapper.query("production.selectRunningEquipIds");
  const runSet = new Set();
  for (const r of runRows || []) {
    String(r.equipIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => runSet.add(id));
  }

  // 3) 최종 상태 매핑
  const rows = (base || []).map((r) => {
    let status = "AVAILABLE";
    if (runSet.has(r.facId)) status = "IN_USE";
    else if (Number(r.fsStatus) === 1) status = "MAINT";

    return {
      id: r.facId,
      code: r.facId,
      name: r.facName,
      process: r.prId, // 예: PRC-001
      status, // AVAILABLE / IN_USE / MAINT
      manager: r.manager,
      company: r.facCompany,
      useYn: Number(r.facUse || 0),
      type: r.facType,
      fsStatus: r.fsStatus, // 0/1
      fsReason: r.fsReason || null,
      downStart: r.downStart || null,
      downEnd: r.downEnd || null,
    };
  });

  return { rows, count: rows.length };
}

/* =========================
 * 생산 작업자 조회 (EMPLOYEES)
 * ========================= */
async function getProductionWorkers() {
  const rows = (await mapper.query("production.selectWorkers")) || [];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    dept: r.dept,
    role: r.auth,
    phone: r.phone,
    email: r.email,
    status: r.empStatus || "재직",
  }));
}

module.exports = {
  // 제품/의뢰/계획
  getProducts,
  getRequests,
  savePlan,
  getPlans,
  updatePlan,
  deletePlans,
  // 작업지시
  createWorkOrder,
  getWorkOrders,
  updateWorkOrder,
  deleteWorkOrders,
  // BOM
  getBomForProduct,
  // 공정
  getExecState,
  startExec,
  pauseExec,
  finishExec,
  // 설비/작업자
  getFacilitiesWithStatus,
  getProductionWorkers,
};
