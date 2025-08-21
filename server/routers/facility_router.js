const express = require("express");
const router = express.Router();
const facilityService = require("../services/facility_service");


// ====================== 설비 ======================

// 설비 전체 조회
router.get("/facility", async (req, res) => {

  try {
    const list = await facilityService.facilitySelect();
    res.send(list);
  } catch (err) {
    console.error("설비 목록 조회 실패:", err);
    res.status(500).json({ error: "설비 목록 조회 중 오류가 발생했습니다." });
  }
});


// 설비 단건 조회
router.get("/facilityById", async (req, res) => {
  try {
    const row = await facilityService.facilityById({ FAC_ID: req.query.facId });
    res.send(row);

  } catch (err) {
    console.error("설비 단건 조회 실패:", err);
    res.status(500).json({ error: "설비 단건 조회 중 오류가 발생했습니다." });
  }
});

// 설비 등록
router.post("/facilityInsert", async (req, res) => {
  try {

    const newId = await facilityService.facilityInsert(req.body);
    res.status(200).json({ ok: true, message: "등록 완료", FAC_ID: newId });

  } catch (err) {
    console.error("설비 등록 실패:", err);
    res.status(500).json({ error: "설비 등록 중 오류가 발생했습니다." });
  }
});


// 다음 설비 코드 조회
router.get("/facility/next-id", async (req, res) => {
  try {
    const nextId = await facilityService.getNextFacilityId();
    res.send({ FAC_ID: nextId });

  } catch (err) {
    console.error("다음 설비 코드 조회 실패:", err);
    res
      .status(500)
      .json({ error: "다음 설비 코드 조회 중 오류가 발생했습니다." });
  }
});

// 설비 수정
router.put("/facilityUpdate", async (req, res) => {
  try {
    await facilityService.facilityUpdate(req.body);
    res.status(200).json({ message: "수정 완료" });
  } catch (err) {
    console.error("설비 수정 실패:", err);
    res.status(500).json({ error: "설비 수정 중 오류가 발생했습니다." });
  }
});

// 설비 삭제
router.delete("/facilityDelete", async (req, res) => {
  try {
    await facilityService.facilityDelete({ FAC_ID: req.body.FAC_ID });
    res.status(200).json({ message: "삭제 완료" });
  } catch (err) {
    console.error("설비 삭제 실패:", err);
    res.status(500).json({ error: "설비 삭제 중 오류가 발생했습니다." });
  }
});


// 설비 유형별 조회
router.get("/facility/by-type", async (req, res) => {
  try {
    const list = await facilityService.facilitySelectByFacType(
      req.query.facType || null

    );
    res.send(list);
  } catch (err) {
    console.error("설비 유형별 조회 실패:", err);
    res.status(500).json({ error: "설비 유형별 조회 중 오류가 발생했습니다." });
  }
});


// ====================== 설비 상태 ======================

// 상태 전체 조회
router.get("/facility/status", async (req, res) => {
  try {
    const list = await facilityService.facilityStatusList();
    res.send(list);

  } catch (err) {
    console.error("설비 상태 목록 조회 실패:", err);
    res
      .status(500)
      .json({ error: "설비 상태 목록 조회 중 오류가 발생했습니다." });
  }
});


// 특정 설비 현재 상태 조회

router.get("/facility/status/current/:facId", async (req, res) => {
  try {
    const row = await facilityService.facilityStatusCurrentByFac(
      req.params.facId
    );
    res.send(row);
  } catch (err) {
    console.error("설비 현재 상태 조회 실패:", err);
    res
      .status(500)
      .json({ error: "설비 현재 상태 조회 중 오류가 발생했습니다." });
  }
});


// 상태 비가동 처리

router.patch("/facility/status/down", async (req, res) => {
  try {
    await facilityService.facilityStatusUpdateToDown(req.body);
    res.status(200).json({ message: "비가동 처리 완료" });
  } catch (err) {

    console.error("설비 비가동 처리 실패:", err);
    res.status(500).json({ error: "설비 비가동 처리 중 오류가 발생했습니다." });
  }
});

// 상태 종료 처리

router.patch("/facility/status/end", async (req, res) => {
  try {
    const {
      FS_ID,
      endTime,
      restoreStatus = 0,
      checkTime = null,
      MANAGER = null,
      repairContent,
      repairNote,
      repairStart = null,
      repairEnd = null,
      repairManager = null,
    } = req.body;

    // 1) 상태 종료
    await facilityService.facilityStatusEndDowntime({
      FS_ID,
      endTime,
      restoreStatus,
      checkTime,
      MANAGER,
    });

    res.status(200).json({ message: "상태 종료 처리 완료" });

  } catch (err) {
    console.error("설비 상태 종료 처리 실패:", err);
    res
      .status(500)
      .json({ error: "설비 상태 종료 처리 중 오류가 발생했습니다." });
  }
});


// 상태 이력 조회 (필터)
router.get("/facility/status/filter", async (req, res) => {
  try {
    const list = await facilityService.facilityStatusFilter({

      facId: req.query.facId || null,
      startDate: req.query.start || null,
      endDate: req.query.end || null,
    });

    res.send(list);

  } catch (err) {
    console.error("설비 상태 이력 조회 실패:", err);
    res
      .status(500)
      .json({ error: "설비 상태 이력 조회 중 오류가 발생했습니다." });
  }
});


// ====================== 설비 수리 ======================

// 수리 목록 조회

router.get("/facility/repairs", async (req, res) => {
  try {
    const rows = req.query.facId
      ? await facilityService.facilityRepairByFacId(req.query.facId)
      : await facilityService.facilityRepairList();
    res.send(rows);
  } catch (err) {
    console.error("설비 수리 내역 조회 실패:", err);
    res
      .status(500)
      .json({ error: "설비 수리 내역 조회 중 오류가 발생했습니다." });
  }
});


// ====================== 설비 점검 ======================

// 미완료 점검 목록
router.get("/facility/inspections/open", async (req, res) => {
  try {
    const list = await facilityService.facilityOpenInspections();
    res.send(list);

  } catch (err) {
    console.error("설비 점검(미완료) 조회 실패:", err);
    res
      .status(500)
      .json({ error: "설비 점검(미완료) 조회 중 오류가 발생했습니다." });
  }
});


// 점검 완료 처리

router.post("/facility/inspection/complete", async (req, res) => {
  try {
    const { FS_ID, FAC_ID, fit, ngReason, content, nextAt, doneAt, manager } =
      req.body;

    // 1) 점검 기록 저장
    await facilityService.facilityCheckInsert({
      FS_ID,
      FAC_ID,
      FC_NEXTDAY: nextAt ?? null,
      FC_SUIT: fit ?? null,
      FC_SUIT_REASON: fit === "부적합" ? ngReason ?? "" : null,
      FC_CONTENT: content ?? null,
      MANAGER: manager ?? null,
    });

    // 2) 점검 종료
    const restoreStatus = fit === "부적합" ? 1 : 0;

    await facilityService.facilityStatusEndInspection({
      FS_ID,
      endTime: doneAt,
      restoreStatus,
      checkTime: doneAt,
      nextCheck: nextAt ?? null,
      MANAGER: manager ?? null,
    });

    res.status(200).json({ message: "점검 완료" });

  } catch (err) {
    console.error("설비 점검 완료 처리 실패:", err);
    res
      .status(500)
      .json({ error: "설비 점검 완료 처리 중 오류가 발생했습니다." });
  }
});


// 점검 이력 조회
router.get("/facility/inspections/history", async (req, res) => {
  try {
    const list = await facilityService.facilityInspectionHistory({
      facId: req.query.facId || null,
      startDate: req.query.start || null,
      endDate: req.query.end || null,

    });
    res.send(list);
  } catch (err) {
    console.error("설비 점검 이력 조회 실패:", err);
    res
      .status(500)
      .json({ error: "설비 점검 이력 조회 중 오류가 발생했습니다." });
  }
});


// ====================== 상태 신규 생성 ======================

// 비가동/점검 신규 등록
router.post("/facility/status", async (req, res) => {
  try {
    const FS_ID = await facilityService.facilityStatusInsert(req.body);
    res.status(200).json({ message: "상태 등록 완료", FS_ID });
  } catch (err) {
    console.error("설비 상태 등록 실패:", err);
    res.status(500).json({ error: "설비 상태 등록 중 오류가 발생했습니다." });
  }
});

// ====================== 공통 코드 & 공정 ======================

// 공통 코드 조회
router.get("/common/codes/:group", async (req, res) => {
  try {
    const list = await facilityService.getCodesByGroup(req.params.group);
    res.send(list);
  } catch (err) {
    console.error("공통 코드 조회 실패:", err);
    res.status(500).json({ error: "공통 코드 조회 중 오류가 발생했습니다." });
  }
});

// 공정 조회
router.get("/process", async (req, res) => {
  try {
    const list = await facilityService.getProcessList();
    res.send(list);
  } catch (err) {
    console.error("공정 조회 실패:", err);
    res.status(500).json({ error: "공정 조회 중 오류가 발생했습니다." });
  }
});


module.exports = router;
