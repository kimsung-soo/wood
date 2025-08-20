// server/routers/production_router.js
const express = require("express");
const router = express.Router();
const svc = require("../services/production_service");

/* ---------- 제품 목록 ---------- */
router.get("/products", async (req, res, next) => {
  try {
    const { kw = "", page = 1, size = 10 } = req.query;
    const data = await svc.getProducts({ kw, page, size });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/* ---------- 제품별 BOM ---------- */
router.get("/boms", async (req, res, next) => {
  try {
    const { productCode = "" } = req.query;
    const data = await svc.getBomForProduct(productCode);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산의뢰 목록 ---------- */
router.get("/plans", async (req, res, next) => {
  try {
    const { kw = "", page = 1, size = 10 } = req.query;
    const data = await svc.getPlans({ kw, page, size });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산계획 저장 ---------- */
router.post("/plans", async (req, res, next) => {
  try {
    const result = await svc.savePlan(req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산계획 수정 ---------- */
router.put("/plans/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await svc.updatePlan(id, req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산계획 삭제 ---------- */
router.delete("/plans", async (req, res, next) => {
  try {
    const ids = req.body?.ids || [];
    const result = await svc.deletePlans(ids);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업지시 생성(+자재예약) ---------- */
router.post("/workorders", async (req, res, next) => {
  try {
    const result = await svc.createWorkOrder(req.body || {});
    res.json(result); // ok true/false 그대로 전달
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업지시 목록 ---------- */
router.get("/workorders", async (req, res, next) => {
  try {
    const { kw = "", page = 1, size = 10 } = req.query;
    const data = await svc.getWorkOrders({ kw, page, size });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업지시 수정 ---------- */
router.put("/workorders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await svc.updateWorkOrder(id, req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업지시 삭제(+예약환원) ---------- */
router.delete("/workorders", async (req, res, next) => {
  try {
    const ids = req.body?.ids || [];
    const result = await svc.deleteWorkOrders(ids);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* ---------- 공정 진행 상태 조회 ---------- */
router.get("/workexec/state/:woId", async (req, res, next) => {
  try {
    const rows = await svc.getExecState(req.params.woId);
    res.json({ ok: true, rows });
  } catch (err) {
    next(err);
  }
});

/* ---------- 작업 시작/일시정지/종료 ---------- */
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
    res.json(r);
  } catch (err) {
    next(err);
  }
});

router.post("/workexec/pause", async (req, res, next) => {
  try {
    const { woId, process, partialDone = 0 } = req.body || {};
    const r = await svc.pauseExec({ woId, process, partialDone });
    res.json(r);
  } catch (err) {
    next(err);
  }
});

router.post("/workexec/finish", async (req, res, next) => {
  try {
    const { woId, process, addDone = 0 } = req.body || {};
    const r = await svc.finishExec({ woId, process, addDone });
    res.json(r);
  } catch (err) {
    next(err);
  }
});

/* ---------- 설비/작업자/자재현황 ---------- */
router.get("/api/facilities", async (req, res, next) => {
  try {
    const { process = "" } = req.query;
    const data = await svc.getFacilitiesWithStatus({ process });
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

/* ✅ 제품별 자재현황(가용재고 기준) */
router.get("/materials/status", async (req, res, next) => {
  try {
    const { productCode = "", targetQty = 1 } = req.query;
    const data = await svc.getMaterialStatus({
      productCode,
      targetQty: Number(targetQty || 1),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/* ---------- 생산 작업자 목록 ---------- */
router.get("/api/workers/production", async (req, res, next) => {
  try {
    const dept = (req.query?.dept || "생산").trim();
    const rows = await svc.getProductionWorkers(dept);
    res.json({ ok: true, rows, count: rows.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
