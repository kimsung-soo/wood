// 합격/불합격 원자재 조회
const materialSelect = `
SELECT
    T.RECEIPT_NO,
    T.MAT_CODE,
    T.RECEIPT_QTY,
    
    CASE
        WHEN R.RJT_MAT_ID IS NOT NULL THEN '불합격'
        WHEN A.MAT_CERT_ID IS NOT NULL THEN '합격'
        ELSE '처리중'
    END AS MAT_STATUS,

    CASE
        WHEN A.MAT_CERT_ID IS NOT NULL THEN A.MAT_CERT_ID
        ELSE R.RJT_MAT_ID
    END AS MAT_CERT_ID,

    CASE
        WHEN A.TOTAL_QTY IS NOT NULL THEN A.TOTAL_QTY
        ELSE R.TOTAL_QTY
    END AS TOTAL_QTY,

    CASE
        WHEN A.Q_CHECKED_DATE IS NOT NULL THEN A.Q_CHECKED_DATE
        ELSE R.Q_CHECKED_DATE
    END AS Q_CHECKED_DATE,
    
    R.RJT_REASON
FROM
    MAT_IN_TMP T
LEFT JOIN
    MATERIAL_CERTIFICATE A ON T.RECEIPT_NO = A.RECEIPT_NO
LEFT JOIN
    REJECTED_MATERIAL R ON T.RECEIPT_NO = R.RECEIPT_NO
WHERE
    A.MAT_CERT_ID IS NOT NULL OR R.RJT_MAT_ID IS NOT NULL;
`;

// 원자재검수관리 조회
const matManagement = `
SELECT RECEIPT_NO, RECEIPT_DATE, SUPPLYER, MAT_CODE, RECEIVED_QTY, TMP_STATUS
FROM MAT_IN_TMP
WHERE TMP_STATUS = '검수 대기'
`;

// 합격원자재 등록
const passMat = `
INSERT INTO MATERIAL_CERTIFICATE
  (MAT_CERT_ID, RECEIPT_NO, MAT_CODE, TOTAL_QTY, Q_CHECKED_DATE, CREATED_BY)
VALUES (GetNextMAT_CERT_ID(), ?, ?, ?, ?, ?)
`;

// 불합격원자재 등록
const rejectMat = `
INSERT INTO REJECTED_MATERIAL
  (RJT_MAT_ID, RECEIPT_NO, MAT_CODE, RJT_REASON, Q_CHECKED_DATE, TOTAL_QTY, MAT_STATUS, CREATED_BY)
VALUES
  (GetNextRJT_MAT_ID(), ?, ?, ?, ?, ?, '등록', ?)
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
 (PRD_CERT_ID, TP_ID, PRD_CODE, PRD_NAME, TOTAL_QTY, PRD_TYPE, Q_CHECKED_DATE, PRD_STATUS, CREATED_BY)
VALUES
 (GetNextPRD_CERT_ID(), ?, ?, ?, ?, ?, ?, '불합격', ?)
`;

// 불합격제품등록
const rejectPrd = `
    INSERT INTO PRODUCT_CERTIFICATE
      (PRD_CERT_ID, TP_ID, PRD_CODE, PRD_NAME, TOTAL_QTY, PRD_TYPE, Q_CHECKED_DATE, PRD_STATUS, CREATED_BY)
    VALUES
      (GetNextPRD_CERT_ID(), ?, ?, ?, ?, ?, ?, '불합격', ?)
`;

// 불합격제품 세부사항
const rejectPrdDetail = `
  INSERT INTO REJECTED_PRODUCT
      (RJT_PRD_ID, PRD_CERT_ID, PRD_CODE, RJT_CODE, RJT_REASON)
  VALUES
      (GetNextRJT_PRD_ID(), ?, ?, GetNextRJT_CODE(), ?)  
`;

// 제품성적서조회
const selectProductCertificate = `SELECT PRD_CERT_ID, PRD_CODE, PRD_NAME, Q_CHECKED_DATE, PRD_TYPE
FROM PRODUCT_CERTIFICATE;`;

// 제품성적서 단건조회
const selectPrdCertReport = `
SELECT
  pc.PRD_CERT_ID,
  pc.PRD_CODE,
  pc.PRD_NAME,
  pc.TOTAL_QTY,
  pc.Q_CHECKED_DATE,
  CASE
    WHEN pc.PRD_STATUS IS NOT NULL THEN pc.PRD_STATUS
    WHEN rp.PRD_CERT_ID IS NOT NULL THEN '불합격'
    ELSE '합격'
  END AS 결과상태,
  rp.RJT_CODE,
  rp.RJT_REASON
FROM PRODUCT_CERTIFICATE pc
LEFT JOIN REJECTED_PRODUCT rp
  ON pc.PRD_CERT_ID = rp.PRD_CERT_ID;
`;

// 제품성적서 품질기준조회 및 수치값
// const prdCertValue = `

// `;

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
  rejectMat,
  taskPrd,
  passPrd,
  rejectPrd,
  rejectPrdDetail,
  selectProductCertificate,
  selectPrdCertReport,
  selectQStandard,
  qcStatus,
  receiveStatus,
};
