// 새 설비 ID 생성
const nextFacilityId = `
  SELECT GetNextFAC_ID() AS FAC_ID
`;

// 공정 목록 조회
const processList = `
  SELECT PRC_CODE, PRC_NAME, FAC_TYPE, PRC_RDATE, PRC_WRITER, PRC_NOTE
  FROM PROCESS
  ORDER BY PRC_CODE
`;

// 설비 전체 목록 조회
const facilitySelect = `
  SELECT FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
         FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER
    FROM FACILITY
   ORDER BY FAC_ID
`;

// 설비 단건 조회
const facilityById = `
  SELECT FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
         FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER
    FROM FACILITY
   WHERE FAC_ID = ?
`;

// 설비 등록
const facilityInsert = `
  INSERT INTO FACILITY(
    FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
    FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

// 설비 수정
const facilityUpdate = `
  UPDATE FACILITY

     SET FAC_NAME = ?, FAC_TYPE = ?, FAC_USE = ?, FAC_COMPANY = ?,
         FAC_MDATE = ?, FAC_IDATE = ?, FAC_CHECKDAY = ?, PR_ID = ?, MANAGER = ?

   WHERE FAC_ID = ?
`;

// 설비 삭제
const facilityDelete = `
  DELETE FROM FACILITY WHERE FAC_ID = ?
`;

// 설비 유형별 조회
const facilitySelectByFacType = `
  SELECT FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
         FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER
    FROM FACILITY
   WHERE ( ? IS NULL OR FAC_TYPE = ? )
   ORDER BY FAC_ID
`;

// 공통 코드 조회
const codeByGroup = `
  SELECT code, code_name
    FROM code_master
   WHERE group_code = ?
     AND (use_yn IS NULL OR use_yn IN ('Y','1'))
   ORDER BY COALESCE(sort_order, 9999), code_name
`;


// 설비상태
const facilityStatusList = `
  SELECT f.FAC_ID, f.FAC_NAME, f.FAC_TYPE, f.FAC_USE, f.PR_ID, f.FAC_COMPANY, f.MANAGER,
         f.FAC_MDATE, f.FAC_IDATE, f.FAC_CHECKDAY,
         s.FS_ID, s.FS_SEQ, s.FS_STATUS, s.FS_REASON, s.FS_TYPE,
         s.DOWN_STARTDAY, s.DOWN_ENDDAY, s.FS_CHECKDAY, s.FS_NEXTDAY,
         s.MANAGER AS STATUS_MANAGER
    FROM FACILITY f
    LEFT JOIN (
      SELECT t.*
        FROM FACILITY_STATUS t
        JOIN (
          SELECT FAC_ID, MAX(FS_SEQ) AS FS_SEQ
            FROM FACILITY_STATUS
           GROUP BY FAC_ID
        ) m
          ON m.FAC_ID = t.FAC_ID  
         AND m.FS_SEQ = t.FS_SEQ  
    ) s ON s.FAC_ID = f.FAC_ID
   ORDER BY f.FAC_ID

`;

// 설비 상태 신규 등록
const facilityStatusInsert = `
  INSERT INTO FACILITY_STATUS(
    FS_ID, FAC_ID, FS_STATUS, FS_REASON, FS_TYPE,
    DOWN_STARTDAY, DOWN_ENDDAY, FS_CHECKDAY, FS_NEXTDAY, MANAGER
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;


// 설비 상태 업데이트(고장/점검 설정)

const facilityStatusUpdateToDown = `
  UPDATE FACILITY_STATUS
     SET FS_STATUS = ?, FS_REASON = ?, FS_TYPE = ?,
         DOWN_STARTDAY = ?, FS_CHECKDAY = ?, FS_NEXTDAY = ?, MANAGER = ?
   WHERE FS_ID = ?
`;

// 비가동 종료 처리
const facilityStatusEndDowntime = `
  UPDATE FACILITY_STATUS
     SET DOWN_ENDDAY = ?, FS_STATUS = ?, FS_CHECKDAY = ?,
         MANAGER = COALESCE(?, MANAGER)
   WHERE FS_ID = ?
`;

// 특정 설비 최신 상태 조회
const facilityStatusCurrentByFac = `

  SELECT * FROM FACILITY_STATUS
   WHERE FAC_ID = ?
   ORDER BY FS_SEQ DESC
   LIMIT 1
`;

// 설비 상태 이력 조회
const facilityStatusFilter = `
  SELECT s.*, f.FAC_NAME, f.PR_ID
    FROM FACILITY_STATUS s
    JOIN FACILITY f ON f.FAC_ID = s.FAC_ID
   WHERE ( ? IS NULL OR s.FAC_ID = ? )
     AND ( ? IS NULL OR s.DOWN_STARTDAY >= ? )
     AND ( ? IS NULL OR COALESCE(s.DOWN_ENDDAY, NOW()) < DATE_ADD(?, INTERVAL 1 DAY) )
   ORDER BY s.DOWN_STARTDAY DESC, s.FS_SEQ DESC

`;

// 수리 내역 전체 조회
const facilityRepairList = `

  SELECT
    r.FR_ID, r.FS_ID, r.FAC_ID,
    r.FR_TYPE, r.FR_CONTENT, r.FR_NOTE,
    r.FR_STARTDAY,               
    r.FR_ENDDAY,                 
    r.MANAGER
  FROM FACILITY_REPAIR r
  ORDER BY r.FR_ID DESC

`;

// 설비별 수리 내역 조회
const facilityRepairByFacId = `

  SELECT
    r.FR_ID, r.FS_ID, r.FAC_ID,
    r.FR_TYPE, r.FR_CONTENT, r.FR_NOTE,
    r.FR_STARTDAY,              
    r.FR_ENDDAY,                
    r.MANAGER
  FROM FACILITY_REPAIR r
  WHERE r.FAC_ID = ?
  ORDER BY r.FR_ID DESC
`;
// 상태 기반 수리 내역 등록

const facilityRepairInsertByFsId = `
  INSERT INTO FACILITY_REPAIR(
    FR_TYPE, FR_CONTENT, FR_NOTE, FR_STARTDAY, MANAGER, FS_ID, FAC_ID
  )
  SELECT
    s.FS_TYPE, ?, ?, COALESCE(s.DOWN_STARTDAY, NOW()), ?, s.FS_ID, s.FAC_ID
  FROM FACILITY_STATUS AS s
  WHERE s.FS_ID = ?
`;
const facilityRepairFinishByFsId = `
  UPDATE FACILITY_REPAIR
     SET FR_ENDDAY = ?
   WHERE FS_ID = ?
     AND FR_ENDDAY IS NULL
   ORDER BY FR_ID DESC
   LIMIT 1
`;

// 진행중 점검 목록 조회
const facilityOpenInspections = `

  SELECT s.FS_ID, s.FS_SEQ, s.FAC_ID, f.PR_ID, f.FAC_NAME, f.FAC_TYPE,
         s.FS_REASON, s.FS_TYPE, s.DOWN_STARTDAY, s.FS_CHECKDAY, s.FS_NEXTDAY,
         COALESCE(s.MANAGER, f.MANAGER) AS MANAGER
    FROM FACILITY_STATUS s
    JOIN FACILITY f ON f.FAC_ID = s.FAC_ID
   WHERE s.FS_REASON = '점검'
     AND s.FS_STATUS = 1
     AND s.DOWN_ENDDAY IS NULL
   ORDER BY COALESCE(s.DOWN_STARTDAY, s.FS_CHECKDAY) DESC, s.FS_SEQ DESC

`;

// 점검 종료 처리
const facilityStatusEndInspection = `
  UPDATE FACILITY_STATUS
     SET DOWN_ENDDAY = ?, FS_STATUS = ?, FS_CHECKDAY = ?, FS_NEXTDAY = ?,
         MANAGER = COALESCE(?, MANAGER)
   WHERE FS_ID = ?
`;

// 점검 이력 조회
const facilityInspectionHistory = `
  SELECT
    s.FS_ID,
    s.FAC_ID,

    f.FAC_NAME,
    f.FAC_TYPE,
    cm_fc.code_name AS FAC_TYPE_NM,
    c.FC_STARTDAY AS INSPECT_START,   
    c.FC_ENDDAY   AS INSPECT_DONE,   

    c.FC_NEXTDAY  AS NEXT_INSPECT,
    c.FC_CONTENT  AS INSPECT_CONTENT,
    c.FC_SUIT     AS FIT,
    c.FC_SUIT_REASON AS NG_REASON,

    COALESCE(c.MANAGER, s.MANAGER, f.MANAGER) AS MANAGER

  FROM FACILITY_STATUS s
  JOIN FACILITY_CHECK  c ON c.FS_ID = s.FS_ID
  JOIN FACILITY        f ON f.FAC_ID = s.FAC_ID
  LEFT JOIN code_master cm_fc

         ON cm_fc.group_code='FC' AND cm_fc.code = f.FAC_TYPE

  WHERE s.FS_REASON = '점검'
    AND ( ? IS NULL OR s.FAC_ID = ? )
    AND ( ? IS NULL OR DATE(c.FC_ENDDAY) >= DATE(?) )
    AND ( ? IS NULL OR DATE(c.FC_ENDDAY) <= DATE(?) )
  ORDER BY COALESCE(c.FC_ENDDAY, c.FC_STARTDAY) DESC, c.FC_ID DESC
`;

// 점검 결과 등록
const facilityCheckInsert = `
  INSERT INTO FACILITY_CHECK(
    FC_NEXTDAY, FC_SUIT, FC_SUIT_REASON,
    FC_CONTENT, MANAGER, FS_ID, FAC_ID, FC_STARTDAY
  ) VALUES (?, ?, ?, ?, ?, ?, ?,
            (SELECT DOWN_STARTDAY FROM FACILITY_STATUS WHERE FS_ID = ?))
`;
// 점검 종료
const facilityCheckFinishByFsId = `
  UPDATE FACILITY_CHECK
     SET FC_ENDDAY = ?
   WHERE FS_ID = ?
     AND FC_ENDDAY IS NULL
   ORDER BY FC_ID DESC
   LIMIT 1
`;

module.exports = {
  nextFacilityId,
  processList,
  facilitySelect,
  facilityById,
  facilityInsert,
  facilityUpdate,
  facilityDelete,
  facilitySelectByFacType,
  codeByGroup,
  facilityStatusList,
  facilityStatusInsert,
  facilityStatusUpdateToDown,
  facilityStatusEndDowntime,
  facilityStatusFilter,
  facilityStatusCurrentByFac,
  facilityRepairFinishByFsId,
  facilityRepairList,
  facilityRepairByFacId,
  facilityRepairInsertByFsId,
  facilityOpenInspections,
  facilityStatusEndInspection,
  facilityInspectionHistory,
  facilityCheckFinishByFsId,
  facilityCheckInsert,
};
