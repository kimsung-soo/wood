// database/sqls/facility.js
const nextFacilityId = `
  SELECT GetNextFAC_ID() AS FAC_ID
`;

const processList = `
  SELECT PRC_CODE, PRC_NAME, FAC_TYPE, PRC_RDATE, PRC_WRITER, PRC_NOTE
  FROM PROCESS
  ORDER BY PRC_CODE
`;

const facilitySelect = `
  SELECT
    FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
    FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER
  FROM FACILITY
  ORDER BY FAC_ID
`;

const facilityById = `
  SELECT
    FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
    FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER
  FROM FACILITY
  WHERE FAC_ID = ?
`;

const facilityInsert = `
  INSERT INTO FACILITY(
    FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
    FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const facilityUpdate = `
  UPDATE FACILITY
     SET FAC_NAME = ?,
         FAC_TYPE = ?,
         FAC_USE  = ?,
         FAC_COMPANY = ?,
         FAC_MDATE   = ?,
         FAC_IDATE   = ?,
         FAC_CHECKDAY= ?,
         PR_ID   = ?,
         MANAGER = ?
   WHERE FAC_ID = ?
`;

const facilityDelete = `
  DELETE FROM FACILITY
  WHERE FAC_ID = ?
`;

const facilitySelectByFacType = `
  SELECT
    FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
    FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER
  FROM FACILITY
  WHERE ( ? IS NULL OR FAC_TYPE = ? )
  ORDER BY FAC_ID
`;

// 공통코드
const codeByGroup = `
  SELECT code, code_name
  FROM code_master
  WHERE group_code = ?
    AND (use_yn IS NULL OR use_yn IN ('Y','1'))
  ORDER BY COALESCE(sort_order, 9999), code_name
`;

// 설비 + 최신상태(1건)
const facilityStatusList = `
  SELECT
    f.FAC_ID, f.FAC_NAME, f.FAC_TYPE, f.PR_ID, f.FAC_COMPANY, f.MANAGER, f.FAC_MDATE, f.FAC_IDATE, f.FAC_CHECKDAY,
    s.FS_ID, s.FS_STATUS, s.FS_REASON, s.FS_TYPE,
    s.DOWN_STARTDAY, s.DOWN_ENDDAY, s.FS_CHECKDAY, s.FS_NEXTDAY, s.MANAGER AS STATUS_MANAGER
  FROM FACILITY f
  LEFT JOIN FACILITY_STATUS s
    ON s.FAC_ID = f.FAC_ID
   AND CAST(SUBSTRING(s.FS_ID, 3) AS UNSIGNED) = (
      SELECT MAX(CAST(SUBSTRING(FS_ID, 3) AS UNSIGNED))
      FROM FACILITY_STATUS
      WHERE FAC_ID = f.FAC_ID
   )
  ORDER BY f.FAC_ID
`;

// 상태 신규
const facilityStatusInsert = `
  INSERT INTO FACILITY_STATUS(
    FS_ID, FAC_ID, FS_STATUS, FS_REASON, FS_TYPE,
    DOWN_STARTDAY, DOWN_ENDDAY, FS_CHECKDAY, FS_NEXTDAY, MANAGER
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

// 상태 업데이트(비가동/점검 설정)
const facilityStatusUpdateToDown = `
  UPDATE FACILITY_STATUS
     SET FS_STATUS     = ?,
         FS_REASON     = ?,
         FS_TYPE       = ?,
         DOWN_STARTDAY = ?,
         FS_CHECKDAY   = ?,
         FS_NEXTDAY    = ?,
         MANAGER       = ?
   WHERE FS_ID = ?
`;

// 비가동 종료
const facilityStatusEndDowntime = `
  UPDATE FACILITY_STATUS
     SET DOWN_ENDDAY = ?,
         FS_STATUS   = ?,
         FS_CHECKDAY = ?,
         MANAGER     = COALESCE(?, MANAGER)
   WHERE FS_ID = ?
`;

// 특정 설비 최신 상태 1건
const facilityStatusCurrentByFac = `
  SELECT *
  FROM FACILITY_STATUS
  WHERE FAC_ID = ?
  ORDER BY CAST(SUBSTRING(FS_ID, 3) AS UNSIGNED) DESC
  LIMIT 1
`;

// 상태 이력 (간단필터)
const facilityStatusFilter = `
  SELECT s.*, f.FAC_NAME, f.PR_ID
  FROM FACILITY_STATUS s
  JOIN FACILITY f ON f.FAC_ID = s.FAC_ID
  WHERE ( ? IS NULL OR s.FAC_ID = ? )
    AND ( ? IS NULL OR DATE(s.DOWN_STARTDAY) >= DATE(?) )
    AND ( ? IS NULL OR DATE(COALESCE(s.DOWN_ENDDAY, NOW())) <= DATE(?) )
  ORDER BY s.DOWN_STARTDAY DESC, s.FS_ID DESC
`;

// 수리 목록/삽입
const facilityRepairList = `
  SELECT FR_ID, FS_ID, FAC_ID, FR_TYPE, FR_CONTENT, FR_NOTE, MANAGER
  FROM FACILITY_REPAIR
  ORDER BY FR_ID DESC
`;
const facilityRepairByFacId = `
  SELECT FR_ID, FS_ID, FAC_ID, FR_TYPE, FR_CONTENT, FR_NOTE, MANAGER
  FROM FACILITY_REPAIR
  WHERE FAC_ID = ?
  ORDER BY FR_ID DESC
`;
const facilityRepairInsertByFsId = `
  INSERT INTO FACILITY_REPAIR
    (FR_TYPE, FR_CONTENT, FR_NOTE, MANAGER, FS_ID, FAC_ID)
  SELECT s.FS_TYPE, ?, ?, ?, s.FS_ID, s.FAC_ID
  FROM FACILITY_STATUS AS s
  WHERE s.FS_ID = ?
`;

// 진행중 점검(설비와 조인해서 이름/유형/공정코드까지 전달)
const facilityOpenInspections = `
  SELECT
    s.FS_ID, s.FAC_ID, f.PR_ID, f.FAC_NAME, f.FAC_TYPE,
    s.FS_REASON, s.FS_TYPE,
    s.DOWN_STARTDAY, s.FS_CHECKDAY, s.FS_NEXTDAY,
    COALESCE(s.MANAGER, f.MANAGER) AS MANAGER
  FROM FACILITY_STATUS s
  JOIN FACILITY f ON f.FAC_ID = s.FAC_ID
  WHERE s.FS_REASON = '점검'
    AND s.FS_STATUS = 1
    AND s.DOWN_ENDDAY IS NULL
  ORDER BY COALESCE(s.DOWN_STARTDAY, s.FS_CHECKDAY) DESC, s.FS_ID DESC
`;

// 점검 종료/이력/등록
const facilityStatusEndInspection = `
  UPDATE FACILITY_STATUS
     SET DOWN_ENDDAY = ?,
         FS_STATUS   = ?,
         FS_CHECKDAY = ?,
         FS_NEXTDAY  = ?,
         MANAGER     = COALESCE(?, MANAGER)
   WHERE FS_ID = ?
`;
const facilityInspectionHistory = `
  SELECT
    s.FS_ID, s.FAC_ID,
    COALESCE(s.DOWN_STARTDAY, s.FS_CHECKDAY) AS INSPECT_START,
    s.FS_CHECKDAY AS INSPECT_DONE,
    c.FC_NEXTDAY  AS NEXT_INSPECT,
    c.FC_CONTENT  AS INSPECT_CONTENT,
    c.FC_SUIT     AS FIT,
    c.FC_SUIT_REASON AS NG_REASON,
    COALESCE(s.MANAGER, c.MANAGER) AS MANAGER
  FROM FACILITY_STATUS s
  JOIN FACILITY_CHECK  c ON c.FS_ID = s.FS_ID
  WHERE s.FS_REASON = '점검'
    AND s.DOWN_ENDDAY IS NOT NULL
    AND ( ? IS NULL OR s.FAC_ID = ? )
    AND ( ? IS NULL OR DATE(s.FS_CHECKDAY) >= DATE(?) )
    AND ( ? IS NULL OR DATE(s.FS_CHECKDAY) <= DATE(?) )
  ORDER BY s.FS_CHECKDAY DESC, s.FS_ID DESC
`;
const facilityCheckInsert = `
  INSERT INTO FACILITY_CHECK
    (FC_NEXTDAY, FC_SUIT, FC_SUIT_REASON, FC_CONTENT, MANAGER, FS_ID, FAC_ID)
  VALUES (?, ?, ?, ?, ?, ?, ?)
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

  facilityRepairList,
  facilityRepairByFacId,
  facilityRepairInsertByFsId,

  facilityOpenInspections,
  facilityStatusEndInspection,
  facilityInspectionHistory,
  facilityCheckInsert,
};
