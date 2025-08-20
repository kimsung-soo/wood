const express = require("express");
const router = express.Router();
const materialService = require("../services/materials_service");

router.get("/materials", async (req, res) => {
  let materialList = await materialService.materialsSelect();
  res.send(materialList);
});

// 자재발주서 등록
router.post("/material/order/insert", async (req, res) => {
  try {
    const { orderData, detailList } = req.body;

    // 1. service를 통해 다음 발주 번호(PO_NO) 생성
    const newPO_NO = await materialService.getNextPONo();

    // 2. 생성된 PO_NO를 orderData에 추가
    orderData.PO_NO = newPO_NO;

    // 3. 발주서 등록 (PURCHASE_ORDER)
    await materialService.materialOrder(orderData);

    // 4. 발주서 상세 등록 (PURCHASE_ORDER_DETAIL)
    for (const detail of detailList) {
      await materialService.materialOrderDetail({
        ...detail,
        PO_NO: newPO_NO, // 새로 생성된 PO_NO 사용
      });
    }

    res.status(200).json({ message: "등록 완료", poNo: newPO_NO });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "등록 실패", error: err.message });
  }
});

// 자재발주서 조회
router.get("/materials/order/select", async (req, res) => {
  let materialOrderList = await materialService.getMaterialOrders();
  res.send(materialOrderList);
});

// 자재발주서 목록 검색 라우터
router.post("/orderSearch", async (req, res) => {
  try {
    const data = req.body;
    const result = await materialService.orderSearch(data);
    res.json(result);
  } catch (err) {
    console.error("자재발주서 검색 실패:", err);
    res.status(500).json({ error: "검색 중 오류가 발생했습니다." });
  }
});

// 임시 입고 등록
router.post("/materialInsert", async (req, res) => {
  try {
    let dataToProcess = req.body;
    if (!Array.isArray(dataToProcess)) dataToProcess = [dataToProcess];

    // 각 row마다 입고번호 발급
    for (let i = 0; i < dataToProcess.length; i++) {
      const nextReceiptNo = await materialService.GetNextPeceiptNo();
      dataToProcess[i].RECEIPT_NO = nextReceiptNo;
    }

    console.log("처리할 데이터:", dataToProcess);

    const result = await materialService.tmpMaterialInsert(dataToProcess);
    res.status(200).send(result);
  } catch (error) {
    console.error("materialInsert 오류:", error);
    res.status(500).send({ error: "등록 실패" });
  }
});

// 임시 입고 목록 조회
router.get("/materialSelect", async (req, res) => {
  let list = await materialService.tmpSelect();
  res.send(list);
});

// tmp_in_mat 검색 라우터
router.post("/tmpSearch", async (req, res) => {
  try {
    const data = req.body;
    const result = await materialService.tmpSearch(data);
    res.json(result);
  } catch (err) {
    console.error("임시 입고 검색 실패:", err);
    res.status(500).json({ error: "검색 중 오류가 발생했습니다." });
  }
});

// 불량품 조회
router.get("/failMaterials", async (req, res) => {
  let list = await materialService.failMaterials();
  res.send(list);
});

// 자재반품요청서 등록
router.post("/return/request/insert", async (req, res) => {
  try {
    const { requestData, detailList } = req.body;

    // 1. service를 통해 다음 RR_NO 생성
    const newRR_NO = await materialService.GetNextRRNO();

    // 2. 생성된 RR_NO를 requestData에 추가
    requestData.RR_NO = newRR_NO;

    // 3. 반품요청서 등록 (RETURN_REQUEST)
    await materialService.reMaterialInsert(requestData);

    // 4. 반품요청서 상세 등록 (RETURN_REQUEST_DETAIL)
    for (const detail of detailList) {
      await materialService.reMaterialInsertDetail({
        ...detail,
        RR_NO: newRR_NO, // 새로 생성된 RR_NO 사용
      });

      // 상태 업데이트
      await materialService.reMaterialUpdate(detail.RECEIPT_NO, "완료");
    }

    res.status(200).json({ message: "등록 완료", rrNo: newRR_NO });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "등록 실패", error: err.message });
  }
});

// 자재반품요청서 목록 조회
router.get("/reMaterialSelect", async (req, res) => {
  let list = await materialService.reMaterialSelect();
  res.send(list);
});

// 자재반품요청서 기간 지난 후 상태 변경
router.post("/reMaterialSelectUpdate", async (req, res) => {
  const result = await materialService.reMaterialSelectUpdate();
  res.send(result);
});

// 원자재 합격품 조회
router.get("/materialPass", async (req, res) => {
  let list = await materialService.materialsPass();
  res.send(list);
});

// LOT 등록
router.post("/LOTInsert", async (req, res) => {
  console.log(req.body);
  try {
    const rows = Array.isArray(req.body) ? req.body : [req.body];

    let results = [];

    for (const row of rows) {
      const params = {
        MAT_CODE: row.MAT_CODE,
        MANAGER: row.MANAGER,
        MAT_QTY: row.MAT_QTY,
        RECEIPT_NO: row.RECEIPT_NO,
        RECEIVED_DATE: new Date().toISOString().slice(0, 10),
      };
      const result = await materialService.LOTInsert(params);
      results.push(result);
    }

    res.status(200).json({
      message: "LOT 등록 완료",
      results: results,
    });
  } catch (error) {
    console.error("LOTInsert 오류:", error);
    res.status(500).json({ message: "LOT 등록 실패", error });
  }
});

// LOT 등록 시 입고 번호 상태 변경
router.put("/updateTMP", async (req, res) => {
  const { RECEIPT_NO, STATUS } = req.body;
  try {
    await materialService.updateTMP(RECEIPT_NO, STATUS);
    res.status(200).send({ message: "입고 상태 변경 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "입고 상태 변경 실패" });
  }
});

// 자재 조회
router.get("/stockSelect", async (req, res) => {
  const matType = req.query.matType;
  try {
    const list = await materialService.stockSelect(matType);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "재고 조회 실패", error: err.message });
  }
});

// 입출고 조회
router.get("/stockStatus", async (req, res) => {
  let list = await materialService.stockStatus();
  res.send(list);
});

module.exports = router;
