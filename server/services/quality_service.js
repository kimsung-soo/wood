const mariadb = require("../database/mapper.js");

// 합/불 원자재 조회
const matHisAll = async () => {
  let list = await mariadb.query("materialSelect");
  return list;
};

// 원자재검수관리 조회
const matMng = async () => {
  let list = await mariadb.query("matManagement");
  return list;
};

// 합격원자재 등록
const addPassMat = async (data) => {
  const params = [
    data.RECEIPT_NO,
    data.MAT_CODE,
    data.TOTAL_QTY,
    data.Q_CHECKED_DATE,
    data.CREATED_BY,
  ];
  return mariadb.query("passMat", params);
};

// 불합격원자재 등록
const addRejectMat = async (data) => {
  const params = [
    data.RECEIPT_NO,
    data.MAT_CODE,
    data.RJT_REASON,
    data.Q_CHECKED_DATE,
    data.TOTAL_QTY,
    data.CREATED_BY,
  ];
  return mariadb.query("rejectMat", params);
};

// 제품공정조회
const selectTaskPrd = async () => {
  let list = await mariadb.query("taskPrd");
  return list;
};

// 제품성적서조회
const selectPrdCert = async () => {
  let list = await mariadb.query("selectProductCertificate");
  return list;
};

// 합격제품등록
const addPassPrd = async (b) => {
  const params = [
    Number(b.TP_ID) || 0, // INT
    String(b.PRD_CODE || ""),
    b.PRD_NAME || null,
    Number(b.TOTAL_QTY) || 0, // INT
    b.PRD_TYPE || null,
    String(b.Q_CHECKED_DATE || ""), // 'YYYY-MM-DD'
    b.CREATED_BY || null,
  ];
  return await mariadb.query("passPrd", params);
};

// 불합격제품등록
const addRejectPrd = async (b) => {
  const conn = await mariadb.getConnection();
  try {
    await conn.beginTransaction();

    // 🔐 PRD_CERT_ID를 딱 1번만 뽑아서 두 테이블에 동일하게 사용
    const [{ NEXT_ID }] = await conn.query(
      `SELECT GetNextPRD_CERT_ID() AS NEXT_ID`
    );
    if (!NEXT_ID) throw new Error("GetNextPRD_CERT_ID() failed");

    // 1) PRODUCT_CERTIFICATE (불합격 헤더)
    await conn.query(
      `
      INSERT INTO PRODUCT_CERTIFICATE
        (PRD_CERT_ID, TP_ID, PRD_CODE, PRD_NAME, TOTAL_QTY, PRD_TYPE, Q_CHECKED_DATE, PRD_STATUS, CREATED_BY)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, '불합격', ?)
      `,
      [
        NEXT_ID,
        Number(b.TP_ID) || 0,
        String(b.PRD_CODE || ""),
        b.PRD_NAME || null,
        Number(b.TOTAL_QTY) || 0,
        b.PRD_TYPE || null,
        String(b.Q_CHECKED_DATE || ""), // 'YYYY-MM-DD'
        b.CREATED_BY || null,
      ]
    );

    // 2) REJECTED_PRODUCT (상세)
    await conn.query(
      `
      INSERT INTO REJECTED_PRODUCT
        (RJT_PRD_ID, PRD_CERT_ID, PRD_CODE, RJT_CODE, RJT_REASON)
      VALUES
        (GetNextRJT_PRD_ID(), ?, ?, ?, ?)
      `,
      [
        NEXT_ID, // 동일한 PRD_CERT_ID 사용
        String(b.PRD_CODE || ""),
        b.RJT_CODE || null,
        String(b.RJT_REASON || "").slice(0, 100),
      ]
    );

    await conn.commit();
    return { ok: true, PRD_CERT_ID: NEXT_ID };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// 품질기준조회
const selectQstd = async () => {
  let list = await mariadb.query("selectQStandard");
  return list;
};

// 품질공통코드
const qcCommonCode = async () => {
  let list = await mariadb.query("qcStatus");
  return list;
};

// 원자재 입고공통코드
const matCommonCode = async () => {
  let list = await mariadb.query("receiveStatus");
  return list;
};

module.exports = {
  matHisAll,
  matMng,
  addPassMat,
  addRejectMat,
  selectTaskPrd,
  selectPrdCert,
  addPassPrd,
  addRejectPrd,
  selectQstd,
  qcCommonCode,
  matCommonCode,
};
