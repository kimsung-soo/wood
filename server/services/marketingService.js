// marketingService.js

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

// 거래처 목록 조회
const getAccountList = async () => {
  try {
    const result = await mariadb.query("selectAccountList");
    return result;
  } catch (e) {
    console.error(e);
    return { error: e };
  }
};

// 제품 목록 조회
const getItemList = async () => {
  try {
    const result = await mariadb.query("selectItemList");
    return result;
  } catch (e) {
    console.error(e);
    return { error: e };
  }
};

// 주문 등록
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

// 태완 -입고 조회
const inboundList = async () => {
  let list = await mariadb.query("inboundList");
  return list;
};

//등록전 lot번호 생성
const getNextLotNo = async () => {
  let result = await mariadb.query("getNextLotNo");
  return result;
};

// 입고 - 등록
const inboundInsert = async (rows) => {
  const lot = await getNextLotNo();
  const lotNo = lot[0]["generate_lot_number()"];
  console.log("lot번호 :", lot);
  for (const row of rows) {
    console.log(row);
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

// 검색
const inboundSearch = async (data) => {
  console.log(data);
  const params = [data.startDate, data.endDate];
  let result = await mariadb.query("inboundSearch", params);
  return result;
};

// LOT 조회
const lotSelect = async () => {
  let list = await mariadb.query("lotSelect");
  return list;
};

// 출하지시서 - 창고 조회
const wrNameSelect = async () => {
  let list = await mariadb.query("wrNameSelect");
  return list;
};

// 출하이력  조회
const shipSelect = async () => {
  let list = await mariadb.query("shipSelect");
  return list;
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
};
