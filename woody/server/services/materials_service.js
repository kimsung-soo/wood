const mariadb = require("../database/mapper.js");

// 자재 조회 모달창
const materialsSelect = async () => {
  let list = await mariadb.query("materialsAllSelect");
  return list;
};

// 자재발주서 등록
const materialOrder = async (data) => {
  const params = [
    data.PO_NO,
    data.SUPPLYER,
    data.ORDER_DATE,
    data.PO_DDAY,
    data.MANAGER,
    data.PO_STATUS,
  ];
  let result = await mariadb.query("materialOrder", params);
  return result;
};
const materialOrderDetail = async (data) => {
  const params = [data.MAT_CODE, data.RECEIPT_QTY, data.PO_NO];
  let result = await mariadb.query("materialOrderDetail", params);
  return result;
};
// 다음 발주 번호 가져오기 (프로시저 호출)
const getNextPONo = async () => {
  const [poResult] = await mariadb.query("GetNextPoNo");
  return poResult[0].PO_NO;
};

const getMaterialOrders = async () => {
  const result = await mariadb.query("orderSelect");
  return result;
};

// 자재발주서 목록 검색
const orderSearch = async (data) => {
  const params = [
    data.poNo,
    data.poNo,
    data.matName,
    data.matName,
    data.matCode,
    data.matCode,
    data.manager,
    data.manager,
    data.orderDate,
    data.orderDate,
    data.dueDate,
    data.dueDate,
    data.status,
    data.status,
  ];

  const result = await mariadb.query("orderSearch", params);
  return result;
};

// 임시 입고 등록
const tmpMaterialInsert = async (dataArray) => {
  const results = [];

  for (const row of dataArray) {
    // 1. 발주서에서 현재 남은 수량, 누적 입고량, 상태 조회
    const [order] = await mariadb.query("qtyAndStatus", [
      row.PO_NO,
      row.MAT_CODE,
    ]);

    const remainingQty = order.RECEIPT_QTY - row.RECEIVED_QTY; // 발주 - 입고 = 입고되어야 할 남은 수량
    console.log(remainingQty);
    const newUpdateQty =
      (order.UPDATE_QTY || 0) + Number(row.RECEIVED_QTY || 0); // 누적 입고량.

    console.log("입력 입고수량:", row.RECEIVED_QTY);
    console.log("발주수량:", order.RECEIPT_QTY);
    console.log("누적 입고량:", newUpdateQty);

    // 3. 임시 입고 테이블에 insert
    const params = [
      row.RECEIPT_NO,
      row.PO_NO,
      row.RECEIPT_DATE,
      row.SUPPLYER,
      row.MAT_CODE,
      row.RECEIPT_QTY,
      row.RECEIVED_QTY,
      row.TMP_STATUS,
      row.MANAGER,
    ];
    const result = await mariadb.query("tmpMaterialInsert", params);
    results.push(result);

    // 4. PURCHASE_DETAIL UPDATE_QTY 누적
    await mariadb.query("updatePURCHASEDETAIL", [
      newUpdateQty,
      row.PO_NO,
      row.MAT_CODE,
    ]);

    // 5. PURCHASE_ORDER 상태 변경
    const newStatus = order.RECEIPT_QTY - newUpdateQty <= 0 ? "완료" : "진행중";
    await mariadb.query("updatePURCHASEORDER", [newStatus, row.PO_NO]);
  }

  return results;
};
// 다음 입고 번호 가져오기 (프로시저 호출)
const GetNextPeceiptNo = async () => {
  const [peResult] = await mariadb.query("GetNextPeceiptNo");
  return peResult[0].RECEIPT_NO;
};

// 임시 입고 목록 조회
const tmpSelect = async () => {
  const result = await mariadb.query("tmpSelect");
  return result;
};

// 임시 입고 목록 검색
const tmpSearch = async (data) => {
  // data: { MAT_NAME, MAT_CODE, MAT_TYPE, RECEIPT_DATE, PO_STATUS }
  const params = [
    data.MAT_NAME,
    data.MAT_NAME,
    data.MAT_CODE,
    data.MAT_CODE,
    data.MAT_TYPE,
    data.MAT_TYPE,
    data.RECEIPT_DATE,
    data.RECEIPT_DATE,
    data.PO_STATUS,
    data.PO_STATUS,
  ];

  const result = await mariadb.query("tmpSearch", params);
  return result;
};

// 불량품 조회
const failMaterials = async () => {
  const result = await mariadb.query("failMaterials");
  return result;
};

// 자재반품요청서 등록
const reMaterialInsert = async (data) => {
  const params = [
    data.RR_NO,
    data.CREATED_DATE,
    data.RR_DATE,
    data.MANAGER,
    data.RE_STATUS,
  ];
  let result = await mariadb.query("reMaterialInsert", params);
  return result;
};

// 자재반품요청서 상세 등록
const reMaterialInsertDetail = async (data) => {
  const params = [data.RR_NO, data.RE_QTY, data.MAT_CODE];
  let result = await mariadb.query("reMaterialInsertDetail", params);
  return result;
};

// 다음 RR_NO 가져오기 (프로시저 호출)
const GetNextRRNO = async () => {
  const [rrResult] = await mariadb.query("GetNextRRNO");
  return rrResult[0].RR_NO;
};

// 자재반품요청서 등록 후 불량품 테이블 상태 업데이트
const reMaterialUpdate = async (receiptNo, status) => {
  let result = await mariadb.query("reMaterialUpdate", [status, receiptNo]);
  return result;
};

// 자재반품요청서 목록 조회
const reMaterialSelect = async () => {
  const result = await mariadb.query("reMaterialSelect");
  return result;
};

// 자재반품요청서 기간 지난 후 상태 변경
const reMaterialSelectUpdate = async () => {
  let result = await mariadb.query("reMaterialSelectUpdate");
  return result;
};

// 원자재 합격품 조회
const materialsPass = async () => {
  const list = await mariadb.query("materialsPass");
  return list;
};

// LOT 등록
const LOTInsert = async (data) => {
  const params = [
    data.MAT_CODE,
    data.MANAGER,
    data.MAT_QTY,
    data.RECEIPT_NO,
    data.RECEIVED_DATE,
  ];
  let result = await mariadb.query("LOTInsert", params);
  return result;
};

// LOT 등록시 입고 번호 상태 변경
const updateTMP = async (receiptNo, status) => {
  const result = await mariadb.query("updateTMP", [status, receiptNo]);
  return result;
};

// 자재 조회
const stockSelect = async (matType) => {
  try {
    const rows = await mariadb.query("stockSelect", [matType]);
    // rows가 배열인지 확인
    console.log("stockSelect rows:", rows);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.error("stockSelect Error:", err);
    throw err;
  }
};

const stockStatus = async (req, res) => {
  let list = await mariadb.query("stockStatus");
  return list;
};

module.exports = {
  materialsSelect,
  materialOrder,
  materialOrderDetail,
  getNextPONo,
  getMaterialOrders,
  orderSearch,
  tmpMaterialInsert,
  GetNextPeceiptNo,
  tmpSelect,
  tmpSearch,
  failMaterials,
  reMaterialInsert,
  reMaterialInsertDetail,
  GetNextRRNO,
  reMaterialUpdate,
  reMaterialSelect,
  reMaterialSelectUpdate,
  materialsPass,
  LOTInsert,
  updateTMP,
  stockSelect,
  stockStatus,
};
