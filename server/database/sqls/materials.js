// table명 : matarials

// 각 변수별로 SQL문을 등록할 떄 백틱(``)을 사용하는 이유는 줄바꿈 허용을 허용하기 떄문.
// ( 따옴표는 줄을 바꿀 경우 값이 깨지면서 에러발생 )

// 자재 조회 (모달)
const materialsAllSelect = `SELECT MAT_CODE, MAT_NAME, MAT_TYPE, MAT_UNIT, MAT_SIZE, MAT_SAFEQT, MAT_DATE, MAT_NOTE, MAT_WRITER
FROM MATERIALS`;

// 자재발주서 insert
const materialOrder = `INSERT INTO PURCHASE_ORDER (PO_NO, SUPPLYER, ORDER_DATE, PO_DDAY, MANAGER, PO_STATUS)
VALUES (?, ?, ?, ?, ?, ?)`;

// 자재발주서 상세 insert
const materialOrderDetail = `INSERT INTO PURCHASE_DETAIL (MAT_CODE, RECEIPT_QTY, PO_NO)
VALUES (?, ?, ?)`;

// 발행번호 프로시저 호출
const GetNextPoNo = `CALL GetNextPO_NO()`;

// 자재발주서 조회
const orderSelect = `SELECT O.PO_NO,
       O.SUPPLYER,
       D.MAT_CODE,
       M.MAT_NAME,
       M.MAT_TYPE,
       M.MAT_SIZE,
       M.MAT_UNIT,
       O.ORDER_DATE,
       O.PO_DDAY,
       O.MANAGER,
       D.RECEIPT_QTY,
       O.PO_STATUS,
       D.UPDATE_QTY
FROM PURCHASE_ORDER AS O 
LEFT JOIN PURCHASE_DETAIL AS D
  ON O.PO_NO = D.PO_NO
LEFT JOIN MATERIALS AS M
  ON D.MAT_CODE = M.MAT_CODE
  ORDER BY O.PO_NO DESC`;

// 자재발주서 조회 검색
const orderSearch = `SELECT O.PO_NO,
       O.SUPPLYER,
       D.MAT_CODE,
       M.MAT_NAME,
       M.MAT_TYPE,
       M.MAT_SIZE,
       M.MAT_UNIT,
       O.ORDER_DATE,
       O.PO_DDAY,
       O.MANAGER,
       D.RECEIPT_QTY,
       O.PO_STATUS,
       D.UPDATE_QTY
FROM PURCHASE_ORDER AS O 
LEFT JOIN PURCHASE_DETAIL AS D
  ON O.PO_NO = D.PO_NO
LEFT JOIN MATERIALS AS M
  ON D.MAT_CODE = M.MAT_CODE
WHERE ( ? IS NULL OR O.PO_NO LIKE CONCAT('%', ?, '%') )
  AND ( ? IS NULL OR M.MAT_NAME LIKE CONCAT('%', ?, '%') )
  AND ( ? IS NULL OR M.MAT_CODE LIKE CONCAT('%', ?, '%') )
  AND ( ? IS NULL OR O.MANAGER LIKE CONCAT('%', ?, '%') )
  AND ( ? IS NULL OR DATE(O.ORDER_DATE) = ? )
  AND ( ? IS NULL OR DATE(O.PO_DDAY) = ? )
  AND ( ? IS NULL OR O.PO_STATUS = ? )
ORDER BY PO_NO DESC`;

// 자재발주서 발주수량 및 상태 조회
const qtyAndStatus = `SELECT D.RECEIPT_QTY, D.UPDATE_QTY, O.PO_STATUS
FROM PURCHASE_ORDER AS O
JOIN PURCHASE_DETAIL AS D
  ON O.PO_NO = D.PO_NO
WHERE O.PO_NO = ? AND D.MAT_CODE = ?`;

// 누적 입고량 업데이트
const updatePURCHASEDETAIL = `UPDATE PURCHASE_DETAIL
SET UPDATE_QTY = ?
WHERE PO_NO = ? AND MAT_CODE = ?`;

// 상태 변경
const updatePURCHASEORDER = `UPDATE PURCHASE_ORDER
SET PO_STATUS = ?
WHERE PO_NO = ?`;

// 임시 입고 등록
const tmpMaterialInsert = `INSERT INTO MAT_IN_TMP (RECEIPT_NO, PO_NO, RECEIPT_DATE, SUPPLYER, MAT_CODE, RECEIPT_QTY, RECEIVED_QTY, TMP_STATUS, MANAGER)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// 입고번호 프로시저 호출
const GetNextPeceiptNo = `CALL GetNextReceipt_NO()`;

// 임시 입고 조회
const tmpSelect = `SELECT TMP.RECEIPT_NO,
       TMP.RECEIPT_DATE,
       TMP.SUPPLYER,
       TMP.MAT_CODE,
       TMP.RECEIPT_QTY,
       TMP.RECEIVED_QTY,
       TMP.TMP_STATUS,
       TMP.MANAGER,
       M.MAT_NAME,
       M.MAT_SIZE,
       M.MAT_UNIT,
       M.MAT_TYPE
FROM MAT_IN_TMP AS TMP JOIN MATERIALS AS M
ON TMP.MAT_CODE = M.MAT_CODE
ORDER BY RECEIPT_NO DESC`;

// 임시 입고 검색
const tmpSearch = `SELECT TMP.RECEIPT_NO,
       TMP.RECEIPT_DATE,
       TMP.SUPPLYER,
       TMP.MAT_CODE,
       TMP.RECEIPT_QTY,
       TMP.RECEIVED_QTY,
       TMP.TMP_STATUS,
       TMP.MANAGER,
       M.MAT_NAME,
       M.MAT_SIZE,
       M.MAT_UNIT,
       M.MAT_TYPE
FROM MAT_IN_TMP AS TMP JOIN MATERIALS AS M
ON TMP.MAT_CODE = M.MAT_CODE
WHERE 1=1
  AND ( ? IS NULL OR M.MAT_NAME LIKE CONCAT('%', ?, '%') )
  AND ( ? IS NULL OR M.MAT_CODE LIKE CONCAT('%', ?, '%') )
  AND ( ? IS NULL OR M.MAT_TYPE = ? )
  AND ( ? IS NULL OR DATE(TMP.RECEIVED_QTY) = ? )
  AND ( ? IS NULL OR TMP.TMP_STATUS = ? )
  ORDER BY RECEIPT_NO DESC`;

// 불량품 조회
const failMaterials = `SELECT 
    RM.RJT_MAT_ID,
    RM.RECEIPT_NO,
    RM.MAT_CODE,
    RM.RJT_REASON,
    RM.Q_CHECKED_DATE,
    RM.TOTAL_QTY,
    RM.MAT_STATUS,
    RM.CREATED_BY,
    M.MAT_NAME,
    M.MAT_SIZE,
    M.MAT_UNIT
FROM REJECTED_MATERIAL AS RM JOIN MATERIALS AS M
ON RM.MAT_CODE = M.MAT_CODE`;

// 자재반품요청서 INSERT
const reMaterialInsert = `INSERT INTO RETURN_REQUEST (RR_NO, CREATED_DATE, RR_DATE, MANAGER, RE_STATUS)
VALUES (?, ?, ?, ?, ?)`;

// 자재반품요청서 상세 isnert
const reMaterialInsertDetail = `INSERT INTO RETURN_REQUEST_DETAIL (RR_NO, RE_QTY, MAT_CODE)
VALUES (?, ?, ?)`;

// 자재반품요청서 요청서번호 프로시저 호출
const GetNextRRNO = `CALL GetNextRR_NO()`;

// 반품요청서 처리 후 불량품 테이블 상태 업데이트
const reMaterialUpdate = `UPDATE REJECTED_MATERIAL SET MAT_STATUS = ? WHERE RECEIPT_NO = ?`;

// 자재반품요청서 목록조회
const reMaterialSelect = `SELECT RR.RR_NO,
	   RR.CREATED_DATE,
       RR.RR_DATE,
       RR.MANAGER,
       RR.RE_STATUS,
       RRD.MAT_CODE,
       RRD.RE_QTY,
       M.MAT_NAME,
       M.MAT_UNIT,
       M.MAT_SIZE
FROM   RETURN_REQUEST AS RR JOIN RETURN_REQUEST_DETAIL RRD
ON     RR.RR_NO = RRD.RR_NO
JOIN MATERIALS AS M
ON   RRD.MAT_CODE = M.MAT_CODE`;

// 자재반품요청서 기간 지난 후 상태 변경
const reMaterialSelectUpdate = `UPDATE RETURN_REQUEST
SET RE_STATUS = '완료'
WHERE RR_DATE < CURDATE()
AND RE_STATUS != '완료';`;

// 원자재 합격품 조회(모달)
const materialsPass = `SELECT MC.MAT_CERT_ID,
       MC.RECEIPT_NO,
       MC.TOTAL_QTY,
       MC.MAT_CODE,
       TMP.RECEIPT_QTY,
       TMP.RECEIVED_QTY,
       M.MAT_NAME,
       M.MAT_SIZE,
       M.MAT_UNIT
FROM MATERIAL_CERTIFICATE AS MC
JOIN MAT_IN_TMP AS TMP
    ON MC.RECEIPT_NO = TMP.RECEIPT_NO
JOIN MATERIALS AS M
    ON MC.MAT_CODE = M.MAT_CODE
WHERE NOT EXISTS (
    SELECT 1
    FROM MATERIAL_RECEIPT MR
    WHERE MR.RECEIPT_NO = MC.RECEIPT_NO
      AND MR.MAT_CODE = MC.MAT_CODE
)
ORDER BY MC.RECEIPT_NO DESC`;

// 원자재 LOT 등록
const LOTInsert = `INSERT INTO MATERIAL_RECEIPT 
      (LOT_NO, MAT_CODE, MANAGER, MAT_QTY, RECEIPT_NO, RECEIVED_DATE)
  VALUES (generate_lot_MAT(), ?, ?, ?, ?, ?)`;

// LOT 등록 시 입고 번호 상태 변경
const updateTMP = `UPDATE MAT_IN_TMP
SET TMP_STATUS = ?
WHERE RECEIPT_NO = ?`;

// 재고 조회 (현재 재고만 반환, 소수점 제거) //0820 이동섭 작업
const stockSelect = `
SELECT 
  M.MAT_CODE,
  M.MAT_NAME,
  M.MAT_TYPE,
  M.MAT_UNIT,
  M.MAT_SIZE,
  M.MAT_NOTE,
  ROUND( IFNULL(SUM(R.MAT_QTY),0) - IFNULL(RES.reservedQty,0), 0 ) AS MAT_QTY
FROM MATERIALS M
LEFT JOIN MATERIAL_RECEIPT R
  ON M.MAT_CODE = R.MAT_CODE
LEFT JOIN (
  SELECT mat_code, SUM(reserved_qty) AS reservedQty
  FROM production_mat_reserve
  WHERE status = 'ACTIVE'
  GROUP BY mat_code
) RES
  ON RES.mat_code = M.MAT_CODE
WHERE M.MAT_TYPE = ?
GROUP BY 
  M.MAT_CODE, M.MAT_NAME, M.MAT_TYPE, M.MAT_UNIT, M.MAT_SIZE, M.MAT_NOTE
ORDER BY M.MAT_CODE;
`;
//

// 입출고 조회
const stockStatus = `SELECT 
    MR.LOT_NO,
    MR.MAT_CODE,
    M.MAT_NAME,
    M.MAT_SIZE,
    M.MAT_TYPE,
    M.MAT_UNIT,
    MR.MAT_QTY AS QTY,
    MR.RECEIVED_DATE AS DATE,
    '입고' AS TYPE
FROM MATERIAL_RECEIPT MR
JOIN MATERIALS M
    ON MR.MAT_CODE = M.MAT_CODE

UNION ALL

SELECT 
    MS.LOT_NO,
    MS.MAT_CODE,
    M.MAT_NAME,
    M.MAT_SIZE,
    M.MAT_TYPE,
    M.MAT_UNIT,
    MS.SHIPMENT_QTY AS QTY,
    MS.SHIPPED_DATE AS DATE,
    '출고' AS TYPE
FROM MATERIAL_SHIPMENT MS
JOIN MATERIALS M
    ON MS.MAT_CODE = M.MAT_CODE

ORDER BY DATE DESC`;

module.exports = {
  materialsAllSelect,
  materialOrder,
  materialOrderDetail,
  GetNextPoNo,
  orderSelect,
  orderSearch,
  tmpMaterialInsert,
  GetNextPeceiptNo,
  qtyAndStatus,
  updatePURCHASEDETAIL,
  updatePURCHASEORDER,
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
