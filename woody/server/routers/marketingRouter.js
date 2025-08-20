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


// 거래처 목록 조회
router.get("/marketing/getacclist", async (req, res) => {
  try {
    const result = await marketingService.getAccountList();
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send({ error: e });
  }
});

// 제품 목록 조회
router.get("/marketing/getitemlist", async (req, res) => {
  try {
    const result = await marketingService.getItemList();
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send({ error: e });
  }
});

// 주문 등록
router.post("/marketing/insertorder", async (req, res) => {
  const { body } = req;
  try {
    const result = await marketingService.addOrder(body);
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


// 주문서 목록 조회
router.get("/marketing/getordlist", async (req, res) => {
  try {
    const result = await marketingService.getOrderList();
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send({ error: e });
  }
});


module.exports = router;
