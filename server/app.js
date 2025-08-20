const express = require("express");
const cors = require("cors");
const session = require("express-session");

require("dotenv").config({ path: "./database/dbconfig.env" });

const app = express();
const PORT = 3000;

let sessionSetting = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 60000,
  },
});

app.use(cors());
app.use(express.json());
app.use(sessionSetting);

app.listen(PORT, () => {
  console.log(`✅ Node 서버 실행: http://localhost:${PORT}`);
});

const boardRouter = require("./routers/board_router.js");
app.use(boardRouter);

// 생산
const productionRouter = require("./routers/production_router.js");
app.use(productionRouter);

// 품질
const qualityRouter = require("./routers/quality_router.js");
app.use(qualityRouter);
const MasterRouter = require("./routers/master_router.js");
app.use(MasterRouter);
const MaterialsRouter = require("./routers/materials_router.js");
app.use(MaterialsRouter);

//설비
const FacilityRouter = require("./routers/facility_router.js");
app.use(FacilityRouter);

//영업
const marketingRouter = require("./routers/marketingRouter.js");
app.use(marketingRouter);

// f로그인
const loginRouter = require("./routers/login_router.js");
app.use(loginRouter);
