// server/services/marketingService.js
const mariadb = require("../database/mapper.js");

// 거래처 등록
const addAccount = async (data) => {
  const params = [
    data.cusType,
    data.cusName,
    data.cusManager,
    data.cusUse,
    data.cusNote,
  ];
  try {
    const result = await mariadb.query("insertAccount", params);
    return result;
  } catch (e) {
    console.error(e);
    return { error: e };
  }
};

const getAccountList = async () => {
  try {
    const result = await mariadb.query("selectAccountList");
    return result;
  } catch (e) {
    console.error(e);
    return { error: e };
  }
};

const getItemList = async () => {
  try {
    const result = await mariadb.query("selectItemList");
    return result;
  } catch (e) {
    console.error(e);
    return { error: e };
  }
};

const addOrder = async (data) => {
  const params = [
    data.cusId,
    data.reqDDay,
    data.reqNote,
    JSON.stringify(data.items),
  ];
  try {
    const result = await mariadb.query("insertOrder", params);
    return result;
  } catch (e) {
    console.error(e);
    return { error: e };
  }
};

// 태완 -입고
const inboundList = async () => mariadb.query("inboundList");
const getNextLotNo = async () => mariadb.query("getNextLotNo");

const inboundInsert = async (rows) => {
  const lot = await getNextLotNo();
  const lotNo = lot[0]["generate_lot_number()"];
  for (const row of rows) {
    const params = [
      row.RECEIVED_QTY,
      row.PRD_CERT_ID,
      row.PRD_CODE,
      row.PRD_TYPE,
      row.PRD_NAME,
      lotNo,
    ];
    await mariadb.query("inboundInsert", params);
  }
  return { success: true };
};

const inboundSearch = async (data) => {
  const params = [data.startDate, data.endDate];
  let result = await mariadb.query("inboundSearch", params);
  return result;
};

/* 주문서 거래처/제품 모달 */
const reqCusModal = async () => mariadb.query("reqCusModal");
const reqPrdModal = async () => mariadb.query("reqPrdModal");

/* 주문서 등록 (헤더) — REQ_ID 발번 후 저장 */
const reqInsert = async (rows) => {
  const idRow = await mariadb.query("getNextPrd");
  const ID = idRow[0]["GetNextREQ_ID()"];
  const params = [ID, rows.CUS_ID, rows.REQ_DATE, rows.REQ_DDAY, rows.WRITER];
  await mariadb.query("reqInsert", params);
  return { success: true, reqId: ID };
};

/* 주문서 등록 (상세) — 헤더에서 받은 reqId 사용 */
const reqDetailInsert = async (payload) => {
  const { reqId, rows } = payload;
  for (const row of rows) {
    const params = [reqId, row.REQ_QTY, row.PRD_CODE];
    await mariadb.query("reqDetailInsert", params);
  }
  return { success: true };
};

/* 주문서 조회 */
const reqSelect = async () => mariadb.query("reqSelect");

// 주문서 상태값 변경
const updateReqStatus = async ({ ids = [], status = "" }) => {
  const allow = ["대기", "진행중", "완료", "취소"];
  if (!allow.includes(status))
    return { ok: false, msg: "허용되지 않는 상태값" };
  const csv = (ids || []).map(String).filter(Boolean).join(",");
  if (!csv) return { ok: false, affected: 0, msg: "ID 없음" };
  const r = await mariadb.query("reqUpdateStatusByIdsCsv", [status, csv]);
  const affected = Array.isArray(r?.[0])
    ? r[0][0]?.affected || 0
    : r?.affectedRows || r?.[0]?.affected || 0;
  return { ok: true, affected };
};


/* LOT/창고/출하 */
const lotSelect = async () => mariadb.query("lotSelect");
const wrNameSelect = async () => mariadb.query("wrNameSelect");
const shipSelect = async () => mariadb.query("shipSelect");
=======
// 출하이력  조회
const shipSelect = async () => {
  let list = await mariadb.query("shipSelect");
  return list;
};

// 거래처 삭제
async function deleteAccount(id) {
  try {
    const result = await mariadb.query("deleteAccount", [id]);
    return result;
  } catch (e) {
    console.error(e);
    return { error: e };
  }
};

module.exports = {
  addAccount,
  inboundList,
  inboundInsert,
  getNextLotNo,
  inboundSearch,
  getAccountList,
  getItemList,
  addOrder,
  lotSelect,
  wrNameSelect,
  shipSelect,
  reqCusModal,
  reqPrdModal,
  reqInsert,
  reqDetailInsert,
  reqSelect,
  updateReqStatus,
  deleteAccount,
};
