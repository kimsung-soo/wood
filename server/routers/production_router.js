// server/routers/production_router.js
// commit
const express = require("express");
const router = express.Router();
const svc = require("../services/production_service");

/* ---------- 제품 목록 ---------- */
router.get("/products", async (req, res, next) => {
  try {
    const { kw = "", page = 1, size = 10 } = req.query;
    const data = await svc.getProducts({ kw, page, size });
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

/* —— NEW: 제품별 BOM —— */
router.get("/boms", async (req, res, next) => {
  try {
    const { productCode = "" } = req.query;
    const data = await svc.getBomForProduct(productCode);
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산의뢰 목록 ---------- */
router.get("/requests", async (req, res, next) => {
  try {
    const { kw = "", page = 1, size = 10 } = req.query;
    const data = await svc.getRequests({ kw, page, size });
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산계획 저장 ---------- */
router.post("/plans", async (req, res, next) => {
  try {
    const result = await svc.savePlan(req.body || {});
    res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산계획 목록(프로시저) ---------- */
router.get("/plans", async (req, res, next) => {
  try {
    const { kw = "", page = 1, size = 10 } = req.query;
    const data = await svc.getPlans({ kw, page, size });
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산계획 수정(프로시저) ---------- */
router.put("/plans/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await svc.updatePlan(id, req.body || {});
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산계획 삭제(프로시저) ---------- */
router.delete("/plans", async (req, res, next) => {
  try {
    const ids = req.body?.ids || [];
    const result = await svc.deletePlans(ids);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업지시 생성 ---------- */
router.post("/workorders", async (req, res, next) => {
  try {
    const result = await svc.createWorkOrder(req.body || {});
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업지시 목록 ---------- */
router.get("/workorders", async (req, res, next) => {
  try {
    const { kw = "", page = 1, size = 10 } = req.query;
    const data = await svc.getWorkOrders({ kw, page, size });
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업지시 수정 ---------- */
router.put("/workorders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await svc.updateWorkOrder(id, req.body || {});
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업지시 삭제 ---------- */
router.delete("/workorders", async (req, res, next) => {
  try {
    const ids = req.body?.ids || [];
    const result = await svc.deleteWorkOrders(ids);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

/* ----- 공정 진행 상태 조회 ----- */
router.get("/workexec/state/:woId", async (req, res, next) => {
  try {
    const rows = await svc.getExecState(req.params.woId);
    res.json({ ok: true, rows });
  } catch (err) {
    next(err);
  }
});

/* ----- 작업 시작 ----- */
router.post("/workexec/start", async (req, res, next) => {
  try {
    const { woId, process, workerId, equipIds, inputQty } = req.body || {};
    const r = await svc.startExec({
      woId,
      process,
      workerId,
      equipIds,
      inputQty,
    });
    res.json({ ok: true, ...r });
  } catch (err) {
    next(err);
  }
});

/* ----- 일시정지 ----- */
router.post("/workexec/pause", async (req, res, next) => {
  try {
    const { woId, process, partialDone = 0 } = req.body || {};
    const r = await svc.pauseExec({ woId, process, partialDone });
    res.json({ ok: true, ...r });
  } catch (err) {
    next(err);
  }
});

/* ----- 작업 종료 ----- */
router.post("/workexec/finish", async (req, res, next) => {
  try {
    const { woId, process, addDone = 0 } = req.body || {};
    const r = await svc.finishExec({ woId, process, addDone });
    res.json({ ok: true, ...r });
  } catch (err) {
    next(err);
  }
});

// 설비 조회 (FS_STATUS 기준 + IN_USE 반영)
router.get("/api/facilities", async (req, res) => {
  try {
    const { process = "" } = req.query; // 예: PRC-001 (없으면 전체)
    const data = await svc.getFacilitiesWithStatus({ process });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "설비 조회 실패" });
  }
});

// 생산 작업자 조회
router.get("/api/workers/production", async (_req, res) => {
  try {
    const rows = await svc.getProductionWorkers();
    res.json({ rows, count: rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "작업자 조회 실패" });
  }
});

// 작업 시작
router.post("/workexec/start", async (req, res) => {
  try {
    const data = await svc.startExec(req.body || {});
    res.json(data); // {ok, startedAt, state}
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "작업 시작 실패" });
  }
});

// 작업 종료
router.post("/workexec/finish", async (req, res) => {
  try {
    const data = await svc.finishExec(req.body || {});
    res.json(data); // {ok, endedAt, allDone, progress, prodQty}
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "작업 종료 실패" });
  }
});

module.exports = router;
