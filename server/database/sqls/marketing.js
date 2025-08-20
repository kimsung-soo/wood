// marketing.js

const insertAccount = `
  insert into CUSTOMERS (cus_id, cus_type, cus_name, cus_manager, cus_use, cus_note)
  values (nextCode("acc"), ?, ?, ?, ?, ?);
`;

const selectAccountList = `
  select 
    cus_id       as cusId,
    cus_type     as cusType,
    cus_name     as cusName,
    cus_manager  as cusManager,
    cus_use      as cusUse,
    cus_note     as cusNote,
    created_at   as createdAt,
    updated_at   as updatedAt
  from CUSTOMERS
  where cus_use = 1
`;

const selectItemList = `
  select 
    prd_code   as prdCode,
    prd_name   as prdName,
    prd_type   as prdType,
    prd_unit   as prdUnit,
    prd_size   as prdSize,
    prd_safeqt as prdSafeqt,
    prd_writer as prdWriter,
    prd_date   as prdDate,
    prd_note   as prdNote
  from PRODUCT
`;

const insertOrder = `
  call insertOrder(?, ?, ?, ?)
`;

// 태완 작업.
const inboundList = `SELECT PRD_CERT_ID, PRD_CODE, PRD_NAME, TOTAL_QTY, PRD_TYPE, Q_CHECKED_DATE,CREATED_BY FROM PRODUCT_CERTIFICATE ORDER BY CERT_NO DESC`;

// LOT넘버 생성
const getNextLotNo = `SELECT generate_lot_number()`;
const inboundInsert = `INSERT INTO PRODUCT_RECEIPT( RECEIVED_QTY, RECEIVED_DATE, PRD_CERT_ID,PRD_CODE,PRD_TYPE, PRD_NAME, PRD_LOT )
VALUES(?,now(),?,?,?,?,?);`;

// 날짜 조건 검색
const inboundSearch = `SELECT PRD_CERT_ID, 
 PRD_CODE,
 PRD_NAME,
 TOTAL_QTY,
 PRD_TYPE, 
 Q_CHECKED_DATE,
 CREATED_BY 
 FROM PRODUCT_CERTIFICATE 
 WHERE Q_CHECKED_DATE >= ? AND Q_CHECKED_DATE <= ?
 ORDER BY CERT_NO DESC`;

// LOT 조회
const lotSelect = `SELECT 
    T1.RECEIVED_NO,
    T1.RECEIVED_QTY,
    T1.RECEIVED_DATE,
    T1.PRD_CERT_ID,
    T1.PRD_CODE, 
    T1.PRD_NAME,
    T1.PRD_TYPE, 
    T1.PRD_LOT,
    -- 총 출하 수량 계산. 출하 이력이 없으면 0으로 처리
    COALESCE(SUM(T2.QTY), 0) AS TOTAL_SHIPPED_QTY,
    -- 남은 수량 계산 = 입고 수량 - 총 출하 수량
    (T1.RECEIVED_QTY - COALESCE(SUM(T2.QTY), 0)) AS REMAINING_QTY
FROM PRODUCT_RECEIPT T1
LEFT JOIN SHIPMENT T2
    ON T1.PRD_LOT = T2.PRD_LOT
GROUP BY
    T1.RECEIVED_NO,
    T1.RECEIVED_QTY,
    T1.RECEIVED_DATE,
    T1.PRD_CERT_ID,
    T1.PRD_CODE, 
    T1.PRD_NAME,
    T1.PRD_TYPE, 
    T1.PRD_LOT
ORDER BY T1.RECEIVED_NO DESC`;
// 출하지시서 창고명
const wrNameSelect = `SELECT WR_NAME FROM WAREHOUSE`;

// 출하이력 조회
const shipSelect = `SELECT SHIP_NO, 
                          REQ_ID, 
                          CUS_ID, 
                          D_DAY, 
                          PRD_LOT, 
                          PRD_NAME, 
                          QTY,
                          DELIVERY,
                          CAR_NO, 
                          SHIP_DATE,
                          SHIP_STATUS,
                          NOTE
                    FROM SHIPMENT
                    ORDER BY ROWNUM DESC`;

module.exports = {
  insertAccount,
  selectAccountList,
  selectItemList,
  insertOrder,
  inboundList,
  getNextLotNo,
  inboundInsert,
  inboundSearch,
  lotSelect,
  wrNameSelect,
  shipSelect,
};
