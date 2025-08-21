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

// 주문서 등록 모달(거래처)
const reqCusModal = `SELECT CUS_ID, CUS_NAME, CUS_MANAGER FROM CUSTOMERS
WHERE CUS_TYPE ='고객사'`;

// 주문서 등록 모달(제품)
const reqPrdModal = `SELECT PRD_CODE, PRD_NAME,PRD_TYPE,PRD_UNIT,PRD_SIZE FROM PRODUCT`;

// 주문서 등록전 함수호출
const getNextPrd = `select GetNextREQ_ID()`;

// 주문서 등록(주문서 테이블)
const reqInsert = `INSERT INTO CUSTOMER_REQUEST(REQ_ID,
                                                CUS_ID,
                                                REQ_DATE,
                                                REQ_DDAY,
                                                WRITER)
                  VALUES(GetNextREQ_ID(),?,?,?,?);`;

// 주문서 등록(상세 테이블)
const reqDetailInsert = `INSERT INTO REQUEST_DETAIL(REQ_ID,REQ_QTY,PRD_CODE)
VALUES(?,?,?);`;
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

// 주문서 조회
const reqSelect = `SELECT c.REQ_ID,
                          c.REQ_DATE, 
                          cus.CUS_NAME,                        
                          r.PRD_CODE,
                          p.PRD_NAME,
                          r.REQ_QTY,
                          COALESCE(SUM(s.QTY), 0) AS SHIP_QTY,  
                          r.REQ_QTY - COALESCE(SUM(s.QTY), 0) AS YET_QTY,
                          c.REQ_DDAY, 
                          MAX(s.SHIP_DATE) AS LAST_SHIP_DATE,   
                          c.REQ_STATUS
                  FROM CUSTOMER_REQUEST c
                  JOIN CUSTOMERS cus 
                      ON c.CUS_ID = cus.CUS_ID
                  JOIN REQUEST_DETAIL r 
                      ON c.REQ_ID = r.REQ_ID
                  JOIN PRODUCT p 
                      ON r.PRD_CODE = p.PRD_CODE
                  LEFT JOIN SHIPMENT s 
                      ON c.REQ_ID = s.REQ_ID 
                    AND r.PRD_CODE = s.PRD_CODE   -- 주문서ID + 제품코드 기준 매칭
                  GROUP BY 
                      c.REQ_ID, c.REQ_DATE, cus.CUS_NAME, r.PRD_CODE, p.PRD_NAME,
                      r.REQ_QTY, c.REQ_DDAY, c.REQ_STATUS
                  ORDER BY c.REQ_DATE DESC`;

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
  reqCusModal,
  reqPrdModal,
  getNextPrd,
  reqInsert,
  reqDetailInsert,
  reqSelect,
};
