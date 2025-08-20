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
const inboundList = `SELECT r.RECEIVED_NO,c.PRD_CERT_ID, c.PRD_CODE,c.PRD_NAME, r.RECEIVED_DATE ,c.TOTAL_QTY, r.PRD_LOT
  FROM PRODUCT_RECEIPT AS r RIGHT JOIN PRODUCT_CERTIFICATE AS c
                ON r.PRD_CERT_ID = c.PRD_CERT_ID
                `;

// LOT넘버 생성
const getNextLotNo = `SELECT generate_lot_number()`;
const inboundInsert = `INSERT INTO PRODUCT_RECEIPT( RECEIVED_QTY, RECEIVED_DATE, PRD_CERT_ID, PRD_LOT, PRD_CODE)
VALUES(?,?,?,?,?);`;

// 날짜 조건 검색
const inboundSearch = `SELECT r.RECEIVED_NO,
                              c.PRD_CERT_ID,
                              c.PRD_CODE,
                              c.PRD_NAME,
                                c.Q_CHECKED_DATE,
                                c.TOTAL_QTY,
                                r.PRD_LOT
                        FROM PRODUCT_RECEIPT AS r RIGHT JOIN PRODUCT_CERTIFICATE AS c
                        ON r.PRD_CERT_ID = c.PRD_CERT_ID
                        WHERE r.RECEIVED_DATE >= ? AND r.RECEIVED_DATE <= ?`;

// 출하 이력 조회 (미완성 주문날짜, 랏번호 안들어감)
const outboundList = `SELECT SHIP_NO,
 REQ_ID, 
 PRD_NAME,
 CUS_NAME, 
 SHIP_QTY, 
 DELIVERY,
 SHIP_DATE, 
 CAR_NO, 
 SHIP_MANAGER,
 SHIP_STATUS
 FROM REQUSET_SHIPMENT;`;

// 출하지시서 등록 모달2(입고 조회)

const shipPrdSelect = `SELECT r.RECEIVED_NO,
                              c.PRD_CODE,
                              c.PRD_NAME,
                              c.Q_CHECKED_DATE,
                              c.TOTAL_QTY, 
                              r.PRD_LOT
FROM PRODUCT_RECEIPT AS r RIGHT JOIN PRODUCT_CERTIFICATE AS c
						   ON r.PRD_CERT_ID = c.PRD_CERT_ID`;




const selectOrderList = `
  select 
    REQ_DATE,       
    REQ_ID,     
    PRD_CODE,    
    PRD_NAME,  
    REQ_QTY,    
    CUS_NAME,     
    REQ_DDAY,   
    REQ_NOTE   
  from CUSTOMERS
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
  outboundList,
  shipPrdSelect,
};
