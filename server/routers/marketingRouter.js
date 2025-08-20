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
module.exports = router;
