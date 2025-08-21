// server/sqls/marketing.js
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
  order by cus_id desc
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

const getNextLotNo = `SELECT generate_lot_number()`;
const inboundInsert = `INSERT INTO PRODUCT_RECEIPT( RECEIVED_QTY, RECEIVED_DATE, PRD_CERT_ID,PRD_CODE,PRD_TYPE, PRD_NAME, PRD_LOT )
VALUES(?,now(),?,?,?,?,?);`;

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

/* 주문서 등록 모달(거래처/제품) */
const reqCusModal = `SELECT CUS_ID, CUS_NAME, CUS_MANAGER FROM CUSTOMERS
WHERE CUS_TYPE ='고객사'`;
const reqPrdModal = `SELECT PRD_CODE, PRD_NAME,PRD_TYPE,PRD_UNIT,PRD_SIZE FROM PRODUCT`;

/* 주문서 등록전 함수호출 */
const getNextPrd = `select GetNextREQ_ID()`;

/* 주문서 등록(헤더) — REQ_ID를 파라미터로 받음 */
const reqInsert = `
  INSERT INTO CUSTOMER_REQUEST
    (REQ_ID, CUS_ID, REQ_DATE, REQ_DDAY, WRITER, REQ_STATUS)
  VALUES (?,?,?,?,?, '대기')
`;

/* 주문서 등록(상세) */
const reqDetailInsert = `
  INSERT INTO REQUEST_DETAIL (REQ_ID, REQ_QTY, PRD_CODE)
  VALUES (?,?,?)
`;

/* LOT 조회 */
const lotSelect = `SELECT 
    T1.RECEIVED_NO,
    T1.RECEIVED_QTY,
    T1.RECEIVED_DATE,
    T1.PRD_CERT_ID,
    T1.PRD_CODE, 
    T1.PRD_NAME,
    T1.PRD_TYPE, 
    T1.PRD_LOT,
    COALESCE(SUM(T2.QTY), 0) AS TOTAL_SHIPPED_QTY,
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

/* 주문서 조회 — 주문수량/출하/미납 + 제품유형 */
const reqSelect = `
SELECT 
    c.REQ_ID,
    DATE_FORMAT(c.REQ_DATE, '%Y-%m-%d') AS REQ_DATE,
    cus.CUS_NAME,
    d.PRD_CODE,
    p.PRD_NAME,
    p.PRD_TYPE AS PRODUCT_TYPE,                  -- ✅ 제품유형
    d.REQ_QTY,                                   -- 주문수량(REQ_ID+PRD_CODE 합계)
    COALESCE(s.SHIP_QTY, 0) AS SHIP_QTY,         -- 출하수량 합
    (d.REQ_QTY - COALESCE(s.SHIP_QTY, 0)) AS YET_QTY, -- 미납수량
    DATE_FORMAT(c.REQ_DDAY, '%Y-%m-%d') AS REQ_DDAY,
    s.LAST_SHIP_DATE,
    c.REQ_STATUS
FROM CUSTOMER_REQUEST c
JOIN CUSTOMERS cus ON c.CUS_ID = cus.CUS_ID
JOIN (
  SELECT REQ_ID, PRD_CODE, SUM(REQ_QTY) AS REQ_QTY
  FROM REQUEST_DETAIL
  GROUP BY REQ_ID, PRD_CODE
) d ON d.REQ_ID = c.REQ_ID
JOIN PRODUCT p ON p.PRD_CODE = d.PRD_CODE
LEFT JOIN (
  SELECT REQ_ID, PRD_CODE, SUM(QTY) AS SHIP_QTY, MAX(SHIP_DATE) AS LAST_SHIP_DATE
  FROM SHIPMENT
  GROUP BY REQ_ID, PRD_CODE
) s ON s.REQ_ID = c.REQ_ID AND s.PRD_CODE = d.PRD_CODE
ORDER BY c.REQ_DATE DESC
`;

const wrNameSelect = `SELECT WR_NAME FROM WAREHOUSE`;

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

// 주문서 상태 일괄 변경
const reqUpdateStatusByIdsCsv = `
   UPDATE CUSTOMER_REQUEST
   SET REQ_STATUS = ?
   WHERE FIND_IN_SET(REQ_ID, ?)
 `;


// 거래처 삭제
const deleteAccount = `
  DELETE FROM CUSTOMERS
  WHERE CUS_ID=?

`;


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
  reqCusModal,
  reqPrdModal,
  getNextPrd,
  reqInsert,
  reqDetailInsert,
  reqSelect,
  reqUpdateStatusByIdsCsv,
  deleteAccount,

};
