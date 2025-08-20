// 사원 조회
const masterEmpSelect = ` SELECT EMP_NO,
                                EMP_NAME, 
                                EMP_HDATE, 
                                ADDR,  
                                PHONE, 
                                EMAIL, 
                                DEPT_NAME, 
                                AUTH, 
                                EMP_EDATE,
                                EMP_STATUS
                         FROM EMPLOYEES `;

// 공통코드 조회
const commonDept = `SELECT code_name 
from code_master
where group_code = 'AA'`;
const commonAuth = `SELECT code_name 
from code_master
where group_code = 'BB'`;

// 사원 등록
const masterEmpInsert = `
                         INSERT INTO EMPLOYEES (
                                     EMP_NO,
                                     EMP_NAME,
                                     PHONE,
                                     EMAIL,
                                     DEPT_NAME,
                                     AUTH,
                                     ADDR,
                                     EMP_STATUS,
                                     EMP_HDATE,
                                     EMP_EDATE)
VALUES (GetNextEmp_NO(),?,?,?,?,?,?,?,?,?) `;

// 사원 정보 수정
const masterEmpUpdate = `UPDATE EMPLOYEES
                         SET  EMP_NAME = ?, 
                              PHONE = ?,  
                              EMAIL = ? , 
                              DEPT_NAME = ?, 
                              AUTH = ?, 
                              ADDR = ?,  
                              EMP_STATUS = ?,
                              EMP_HDATE = ?,
                              EMP_EDATE = ?
                         WHERE EMP_NO = ? `;

// 사원 삭제
const masterEmpDelete = `DELETE FROM EMPLOYEES
                         WHERE EMP_NO = ? `;

// 사원 검색

const masterEmpSelectName = ` SELECT EMP_NO,
                                EMP_NAME, 
                                EMP_HDATE, 
                                ADDR,  
                                PHONE, 
                                EMAIL, 
                                DEPT_NAME, 
                                AUTH, 
                                EMP_EDATE,
                                EMP_STATUS
                         FROM EMPLOYEES 
                         WHERE EMP_NAME LIKE CONCAT('%', ?, '%')`;

// 제품관리 - 조회

const masterPrdSelect = `select PRD_CODE, 
                              PRD_NAME, 
                              PRD_TYPE, 
                              PRD_UNIT, 
                              PRD_SIZE, 
                              PRD_SAFEQT, 
                              PRD_WRITER, 
                              PRD_DATE, 
                              PRD_NOTE  
                         from PRODUCT`;

// 제품 관리 - 모달(규격)
const masterPrdModal = `SELECT group_code, code_name, use_yn
                         FROM code_master
                         WHERE group_code = 'SZ'`;

// 제품관리 - 유형
const masterPrdType = `SELECT code_name FROM code_master 
WHERE group_code = 'CC'
AND code In('01','02');`;

// 제품관리 - 단위
const masterPrdUnit = `SELECT code_name FROM code_master 
WHERE group_code = 'UN'`;

// 제품관리 - 저장버튼(등록)
const masterPrdInsert = `INSERT INTO PRODUCT(PRD_CODE, 
                                             PRD_NAME, 
                                             PRD_TYPE,
                                             PRD_UNIT, 
                                             PRD_SIZE, 
                                             PRD_SAFEQT, 
                                             PRD_WRITER, 
                                             PRD_DATE, 
                                             PRD_NOTE)
                    VALUES(GetNextPrd_Code(), ?,?,?,?,?,?,?,?)`;

// 제품관리 - 저장버튼(수정)
const masterPrdUpdate = `UPDATE PRODUCT
                         SET PRD_NAME = ?, 
                              PRD_TYPE = ?,
                              PRD_UNIT = ?, 
                              PRD_SIZE = ?, 
                              PRD_SAFEQT = ?, 
                              PRD_WRITER = ?, 
                              PRD_DATE = ?, 
                              PRD_NOTE = ?
                         WHERE PRD_CODE = ?`;

// 제품관리 - 다중삭제
const masterPrdDelete = `CALL delete_process_for_product(?)`;

// 제품관리 - 검색
const masterPrdSearch = `SELECT
                              PRD_CODE, 
                              PRD_NAME, 
                              PRD_TYPE, 
                              PRD_UNIT, 
                              PRD_SIZE, 
                              PRD_SAFEQT, 
                              PRD_WRITER, 
                              PRD_DATE, 
                              PRD_NOTE
                      FROM PRODUCT
                      WHERE PRD_NAME LIKE CONCAT('%', ?, '%')`;

// 자재목록
const masterMatSelect = `SELECT MAT_CODE, MAT_NAME, MAT_TYPE, MAT_UNIT, MAT_SIZE, MAT_SAFEQT, MAT_DATE, MAT_WRITER, MAT_NOTE FROM MATERIALS`;

// 자재 모달
const masterMatModal = `SELECT group_code, code_name, use_yn
                         FROM code_master
                         WHERE group_code = 'MT'
                         or group_code ='BT'`;

// 자재 유형
const masterMatType = `SELECT code_name FROM code_master 
WHERE group_code = 'CC'
AND code In('04','05');`;

// 자재관리 - 저장버튼(등록)
const masterMatInsert = `INSERT INTO MATERIALS(MAT_CODE, MAT_NAME, MAT_TYPE, MAT_UNIT, MAT_SIZE, MAT_SAFEQT, MAT_DATE, MAT_NOTE, MAT_WRITER)
                    VALUES(GetNextMat_Code(), ?,?,?,?,?,?,?,?)`;

// 자재관리 - 저장버튼(수정)
const masterMatUpdate = `UPDATE MATERIALS
                         SET MAT_NAME = ? ,
                         MAT_TYPE = ?,
                         MAT_UNIT = ?,
                         MAT_SIZE =?,
                         MAT_SAFEQT =?,
                         MAT_DATE =?, 
                         MAT_NOTE =?, 
                         MAT_WRITER =?
                         WHERE MAT_CODE = ?`;

// 자재관리 - 단위
const masterMatUnit = `SELECT code_name FROM code_master 
WHERE group_code = 'UN'`;

// 재공품 목록
const masterWIPSelect = `SELECT WIP_CODE, WIP_NAME, WIP_TYPE, WIP_SIZE,WIP_UNIT, WIP_WRITER,WIP_DATE, WIP_NOTE FROM WIP;`;

// 재공품 모달
const masterWIPModal = `SELECT group_code, code_name, use_yn
                         FROM code_master
                         WHERE group_code = 'WP'`;

// 재공품 유형
const masterWIPType = `SELECT code_name FROM code_master 
WHERE group_code = 'WS'`;

// 재공품관리 - 저장버튼(등록)
const masterWIPInsert = `INSERT INTO WIP(WIP_CODE, WIP_NAME, WIP_TYPE, WIP_UNIT, WIP_SIZE, WIP_DATE, WIP_NOTE, WIP_WRITER)
                    VALUES(GetNextWIP_Code(), ?,?,?,?,?,?,?)`;

// 재공품관리 - 저장버튼(수정)
const masterWIPUpdate = `UPDATE WIP
                         SET WIP_NAME = ? ,
                         WIP_TYPE = ?,
                         WIP_UNIT = ?,
                         WIP_SIZE =?,
                         WIP_DATE =?, 
                         WIP_NOTE =?, 
                         WIP_WRITER =?
                         WHERE WIP_CODE = ?`;

// 재공품관리 - 단위
const masterWIPUnit = `SELECT code_name FROM code_master 
WHERE group_code = 'UN'`;

// 공정 목록
const masterPrcSelect = `SELECT PRC_CODE, PRC_NAME, PRC_RDATE, PRC_WRITER, PRC_NOTE, FAC_TYPE FROM PROCESS;`;

// 공정 모달(설비유형)
const masterPrcModal = `SELECT group_code, code_name, use_yn
                         FROM code_master
                         WHERE group_code = 'FC'`;

// 공정 유형
const masterPrcType = `SELECT code_name FROM code_master 
WHERE group_code = 'WS'`;

// 공정관리 - 저장버튼(등록)
const masterPrcInsert = `INSERT INTO PROCESS(PRC_CODE, PRC_NAME,FAC_TYPE,PRC_WRITER, PRC_RDATE,PRC_NOTE)
                    VALUES(GetNextPrc_Code(), ?,?,?,?,?)`;

// 공정관리 - 저장버튼(수정)
const masterPrcUpdate = `UPDATE PROCESS
                         SET PRC_NAME = ? ,
                         FAC_TYPE = ?,
                         PRC_WRITER =?,
                         PRC_RDATE =?,
                         PRC_NOTE =?
                         WHERE PRC_CODE = ?`;

// BOM 관리에서 제품조회
const BOMprdSelect = `SELECT p.PRD_NAME,
                             p.PRD_CODE,
                             p.PRD_TYPE,  
                             p.PRD_DATE, 
                             p.PRD_WRITER
                      FROM PRODUCT AS p`;

// BOM관리 제품 클릭시 제품에 대한 BOM 조회
const BOMbomSelect = `SELECT b.BOM_NO, 
                             b.BOM_CODE,
                             p.PRD_NAME,
                             b.BOM_WRITER,
                             b.USE_YN,
                             b.BOM_RDATE,
                             b.BOM_VER
                      FROM BOM AS b LEFT JOIN PRODUCT AS p
                            ON b.PRD_CODE = p.PRD_CODE
                      WHERE b.PRD_CODE = ?
                      ORDER BY BOM_NO DESC`;
//BOM관리 자재 조회 모달
const BOMmodalSelect = `SELECT MAT_CODE,
                              MAT_NAME,
                              MAT_TYPE,
                              MAT_SIZE,
                              MAT_UNIT
                        FROM MATERIALS `;

// 모달 확인 클릭
const BOMmodalConfirm = `INSERT INTO BOM_DETAIL(BOM_CODE,
                                               MAT_CODE,
                                               MAT_NAME,
                                               MAT_TYPE,
                                               UNIT,
                                               BOM_VER)
                         VALUES(?,?,?,?,?,?)`;

// BOM_DETAIL 조회
const BOM_detailSelect = `SELECT MAT_CODE,
                              MAT_NAME,
                              MAT_TYPE,
                              QTY,
                              UNIT
                         FROM BOM_DETAIL
                         WHERE BOM_CODE = ?
                         AND BOM_VER = ? `;

// BOM 추가버튼
const BOMInsert = `INSERT INTO BOM(BOM_CODE,
                                   PRD_CODE,
                                   BOM_WRITER,
                                   BOM_VER,
                                   USE_YN)
                   VALUES(?,?,?,GetNextBom_Ver(?),'Y')`;
// 추가버튼 기능 bom_code 생성
const nextBOm = `SELECT GetNextBOM_Code(?) AS code`;
// 추가버튼 기능2 전버젼 사용유무 변경
const bomUpdate = `UPDATE BOM
                   SET USE_YN = 'N'
                   WHERE PRD_CODE = ?
                   AND BOM_VER = (
                         SELECT BOM_VER
                         FROM BOM
                         WHERE PRD_CODE = ? AND BOM_VER = ?);`;

//BOM관리 삭제 버튼
const bomDelete = `DELETE FROM BOM_DETAIL
                   WHERE BOM_CODE = ?
                   AND MAT_CODE = ?`;

//BOM관리 자재 수량변경후 저장
const bomMatUpdate = `CALL update_bom_detail_bulk(?, ?, ?)`;

//BOM 제품 검색
const bomSearch = `SELECT p.PRD_NAME,
                             p.PRD_CODE,
                             p.PRD_TYPE,  
                             p.PRD_DATE, 
                             p.PRD_WRITER
                      FROM PRODUCT AS p
                      WHERE PRD_NAME LIKE CONCAT('%', ?, '%')`;

// 공정흐름도 - 제품 조회
const diaPrdList = `SELECT 
    p.PRD_NAME,
    p.PRD_CODE,
    p.PRD_TYPE,
    (SELECT d.DIA_CODE 
       FROM DIAGRAM d 
      WHERE d.PRD_CODE = p.PRD_CODE
      LIMIT 1) AS DIA_CODE,   
    p.PRD_WRITER,
    p.PRD_DATE
FROM PRODUCT p`;

// 공정흐름도 - 모달 조회
const diaModalList = `SELECT PRC_CODE, 
                              PRC_NAME,
                              FAC_TYPE,
                              PRC_RDATE
                      FROM PROCESS`;

// 공정흐름도 - 공정 조회
const prcList = `SELECT PRC_ORDER, PRC_CODE, PRC_NAME, FAC_TYPE 
                  FROM DIAGRAM_DETAIL
                  WHERE DIA_CODE = ?
                  ORDER BY PRC_ORDER`;
// 공정흐름도 순서변경
const updateProcessOrder = `CALL update_process_order(?)`;

// 공정흐름도 추가
const diaInsert = `INSERT INTO DIAGRAM(DIA_CODE,
                                        PRD_CODE,
                                        DIA_WRITER, 
                                        DIA_DATE
                                        )
                    VALUES (GetNextDIA_Code(), ?, ?, ?)`;

// 공정흐름도 - 모달에서 공정추가
const prcModalConfirm = `INSERT INTO DIAGRAM_DETAIL(DIA_CODE,
                                                      PRC_ORDER,
                                                      PRC_CODE,
                                                      PRC_NAME,
                                                      FAC_TYPE)
                        VALUE(?,GetNextPrc_Order(?),?,?,?)`;

// 공정흐름도 - 삭제
const prcDelete = `CALL delete_process_for_dia(?,?)`;

// 창고 정보 모달조회
const wrModalSelect = `SELECT WR_NO, WR_NAME, WR_ADDR FROM WAREHOUSE`;

// 창고 정보 조회
const wrSelect = `SELECT WR_AREANO, 
                         WR_SECTION,
                         WR_PRD_ID,
                         WR_TYPE
                 FROM WR_DETAIL
                 WHERE WR_NO = ?`;

module.exports = {
  masterEmpSelect,
  masterEmpInsert,
  masterEmpUpdate,
  masterEmpDelete,
  masterEmpSelectName,
  BOMprdSelect,
  BOMbomSelect,
  BOMmodalSelect,
  BOMmodalConfirm,
  BOM_detailSelect,
  BOMInsert,
  nextBOm,
  bomUpdate,
  bomDelete,
  bomMatUpdate,
  bomSearch,
  diaPrdList,
  diaModalList,
  prcList,
  prcDelete,
  prcModalConfirm,
  commonDept,
  commonAuth,
  masterPrdSelect,
  masterPrdModal,
  masterPrdType,
  masterPrdUnit,
  masterPrdInsert,
  masterPrdUpdate,
  masterPrdDelete,
  masterPrdSearch,
  wrModalSelect,
  wrSelect,
  diaInsert,
  updateProcessOrder,
  masterMatModal,
  masterMatSelect,
  masterMatType,
  masterMatUnit,
  masterMatInsert,
  masterMatUpdate,
  masterWIPModal,
  masterWIPSelect,
  masterWIPType,
  masterWIPUnit,
  masterWIPInsert,
  masterWIPUpdate,
  masterPrcSelect,
  masterPrcModal,
  masterPrcInsert,
  masterPrcUpdate,
};
