// 합격/불합격 원자재 조회
const materialSelect = `
SELECT M.MAT_CERT_ID,
       M.RECEIPT_NO,
	   M.MAT_CODE,
       M.TOTAL_QTY,
       M.Q_CHECKED_DATE,
       R.RJT_REASON
       FROM MATERIAL_CERTIFICATE M
       LEFT JOIN REJECTED_MATERIAL R
       ON M.RECEIPT_NO = R.RECEIPT_NO
`;

// 원자재검수관리 조회
const matManagement = `
SELECT RECEIPT_NO, RECEIPT_DATE, SUPPLYER, MAT_CODE, RECEIVED_QTY, TMP_STATUS
FROM MAT_IN_TMP
WHERE TMP_STATUS = '검수대기'
`;

// 합격원자재 등록
const passMat = `
INSERT INTO MATERIAL_CERTIFICATE
  (MAT_CERT_ID, Q_STD_ID, MAT_CODE, MAT_NAME, TOTAL_QTY, Q_CHECKED_DATE, MAT_STATUS, CREATED_BY, RECEIPT_NO)
VALUES (GetNextMAT_CERT_ID(), ?, ?, ?, ?, ?, ?, ?, ?)
`;

// 불합격원자재 등록
const rejactMat = `
INSERT INTO REJECTED_MATERIAL
  (RJT_MAT_ID, RECEIPT_NO, MAT_CODE, RJT_REASON, Q_CHECKED_DATE, TOTAL_QTY, MAT_STATUS, CREATED_BY)
VALUES
  (GetNextMAT_CERT_ID(), ?, ?, ?, ?, ?, '등록', ?)
`;

// 제품공정조회
const taskPrd = `
SELECT q.id, q.wo_id, q.finished_at, q.qty,
       w.wo_no, w.product_code, w.product_name, w.product_type, w.writer, w.status
  FROM production_done_queue q
  JOIN work_orders w ON w.id = q.wo_id
 WHERE q.picked = 0
 ORDER BY q.finished_at DESC
`;

// 합격제품등록
const passPrd = `
INSERT INTO PRODUCT_CERTIFICATE
 (PRD_CERT_ID, TP_ID, Q_STD_ID, PRD_CODE, PRD_NAME, TOTAL_QTY, PRD_TYPE, Q_CHECKED_DATE, PRD_STATUS, CREATED_BY)
VALUES
 (getNextPRD_CERT_ID(), ?, ?, ?, ?, ?, ?, ?, '합격', ?)
`;

// 불합격제품등록

// 합격불합격_세부항목등록
// const prdDetail = `

// `;

// 제품성적서조회
const selectProductCertificate = `SELECT PRD_CERT_ID, PRD_ID, PRD_NAME, Q_CHECKED_DATE, PRD_STATUS
FROM PRODUCT_CERTIFICATE`;

// 품질기준조회
const selectQStandard = `SELECT STD_NAME, STD_TYPE, ALLOWED_VALUE 
                         FROM QUALITY_STANDARD`;
// 원자재 검수 관리

// 품질공통코드
const qcStatus = `
SELECT code, code_name
FROM code_master
WHERE group_code = 'DD';
`;

// 원자재 입고공통코드
const receiveStatus = `
SELECT code, code_name
FROM code_master
WHERE group_code = 'YY'
`;

module.exports = {
  materialSelect,
  matManagement,
  passMat,
  rejactMat,
  taskPrd,
  passPrd,
  selectProductCertificate,
  selectQStandard,
  qcStatus,
  receiveStatus,
};
