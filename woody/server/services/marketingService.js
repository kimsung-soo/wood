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
  for (const row of rows) {
    console.log(row);
    const params = [
      row.RECEIVED_QTY,
      row.RECEIVED_DATE,
      row.PRD_CERT_ID,
      row.PRD_LOT,
      row.PRD_CODE,
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


// 주문서 목록 조회
const getOrderList = async () => {
  try {
    const result = await mariadb.query("selectOrderList");
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
  getOrderList,
};
