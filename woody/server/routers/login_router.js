const express = require("express");
const router = express.Router();
const loginSercive = require("../services/login_service");

// 로그인
router.post("/login", async (req, res) => {
  let loginInfo = req.body;
  let resInfo = await loginSercive
    .loginByEmail(loginInfo)
    .catch((err) => console.log(err));
  if (resInfo.result) {
    // 로그인 성공 했으면 세션에 저장
    req.session.user = resInfo.userInfo.email;
    req.session.save(function (err) {
      if (err) throw err;
      res.send({ result: true, email: resInfo.userInfo.email });
    });
  } else {
    // 로그인 실패
    res.send({ result: false, message: "회원 정보가 존재하지 않습니다." });
  }
});

// 로그아웃
router.get("/logout", async (req, res) => {
  // 로그아웃 시 정보를 저장하고 있는 세션 소멸
  req.session.destroy();
  res.send({ result: true });
});

module.exports = router;
