// marketingRouter.js
const express = require("express");
const router = express.Router();
const marketingService = require("../services/marketingService.js");

// 거래처 등록
router.post("/marketing/insertacc", async (req, res) => {
  // const body = req.body;
  /* 객체 구조 분해 할당 방식 */
  const { body } = req;
  try {
    const result = await marketingService.addAccount(body);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send({ error: e });
  }
});

// 태완 - 입고
router.get("/inboundList", async (req, res) => {
  let list = await marketingService.inboundList();
  res.send(list);
});

// 입고 등록
router.post("/inboundInsert", async (req, res) => {
  try {
    const data = req.body;
    console.log(req.body);
    let result = await marketingService.inboundInsert(data);
    res.json(result);
  } catch (e) {
    console.log(e);
  }
});

// BOM_DETAIL 조회
router.post("/inboundSearch", async (req, res) => {
  const data = req.body;
  try {
    let list = await marketingService.inboundSearch(data);
    res.send(list);
  } catch (e) {
    console.log(e);
  }
});

// LOT- 조회
router.get("/lotSelect", async (req, res) => {
  let list = await marketingService.lotSelect();
  res.send(list);
});

// 출하지시서 - 등록 (창고조회)
router.get("/wrNameSelect", async (req, res) => {
  let list = await marketingService.wrNameSelect();
  res.send(list);
});

// 출하 이력 조회
router.get("/shipSelect", async (req, res) => {
  let list = await marketingService.shipSelect();
  res.send(list);
});

module.exports = router;
