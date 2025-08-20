// 새 설비코드
const nextFacilityId = `
  SELECT GetNextFAC_ID() AS FAC_ID
`;

// 공통코드
const codeByGroup = `
  SELECT code AS code, code_name AS code_name, sort_order AS sort_order
  FROM code_master
  WHERE group_code = ?
    AND (use_yn IS NULL OR use_yn IN ('Y','1'))
  ORDER BY COALESCE(sort_order, 9999), code_name
`;

// 설비 목록
const facilitySelect = `
  SELECT
    f.FAC_ID,
    f.FAC_NAME,
    f.FAC_TYPE,
    cm.code_name AS FAC_TYPE_NM,
    f.FAC_USE,
    f.FAC_COMPANY,
    f.FAC_MDATE,
    f.FAC_IDATE,
    f.FAC_CHECKDAY,
    f.PR_ID,
    f.MANAGER
  FROM FACILITY AS f
  LEFT JOIN code_master AS cm
    ON cm.group_code = 'FC'
   AND cm.code = f.FAC_TYPE
  ORDER BY f.FAC_ID
`;

// 설비 등록
const facilityInsert = `
  INSERT INTO FACILITY
    (FAC_ID, FAC_NAME, FAC_TYPE, FAC_USE, FAC_COMPANY,
     FAC_MDATE, FAC_IDATE, FAC_CHECKDAY, PR_ID, MANAGER)
  VALUES (
    GetNextFAC_ID(),
    ?, ?, ?, ?, ?, ?, ?,
    COALESCE(
      (SELECT p.PRC_CODE
         FROM PROCESS AS p
        WHERE REPLACE(p.FAC_TYPE,' ','') = REPLACE(?, ' ','')
        ORDER BY p.PRC_CODE LIMIT 1),
      (SELECT p.PRC_CODE
         FROM PROCESS AS p
        WHERE REPLACE(p.FAC_TYPE,' ','') = REPLACE((
                SELECT cm.code_name
                  FROM code_master AS cm
                 WHERE cm.group_code='FC'
                   AND cm.code=?
              ), ' ','')
        ORDER BY p.PRC_CODE LIMIT 1),
      (SELECT p.PRC_CODE
         FROM PROCESS AS p
        WHERE REPLACE(p.FAC_TYPE,' ','') = REPLACE((
                SELECT TRIM(REPLACE(cm.code_name,'설비',''))
                  FROM code_master AS cm
                 WHERE cm.group_code='FC'
                   AND cm.code=?
              ), ' ','')
        ORDER BY p.PRC_CODE LIMIT 1),
      (SELECT p.PRC_CODE FROM PROCESS AS p ORDER BY p.PRC_CODE LIMIT 1)
    ),
    ?
  )
`;

// 설비 수정

const facilityUpdate = `
  UPDATE FACILITY
     SET FAC_NAME     = ?,
         FAC_TYPE     = ?,
         FAC_USE      = ?,
         FAC_COMPANY  = ?,
         FAC_MDATE    = ?,
         FAC_IDATE    = ?,
         FAC_CHECKDAY = ?,
         PR_ID = COALESCE(
           (SELECT p.PRC_CODE
              FROM PROCESS AS p
             WHERE REPLACE(p.FAC_TYPE,' ','') = REPLACE(?, ' ','')
             ORDER BY p.PRC_CODE LIMIT 1),
           (SELECT p.PRC_CODE
              FROM PROCESS AS p
             WHERE REPLACE(p.FAC_TYPE,' ','') = REPLACE((
                     SELECT cm.code_name
                       FROM code_master AS cm
                      WHERE cm.group_code='FC'
                        AND cm.code=?
                   ), ' ','')
             ORDER BY p.PRC_CODE LIMIT 1),
           (SELECT p.PRC_CODE
              FROM PROCESS AS p
             WHERE REPLACE(p.FAC_TYPE,' ','') = REPLACE((
                     SELECT TRIM(REPLACE(cm.code_name,'설비',''))
                       FROM code_master AS cm
                      WHERE cm.group_code='FC'
                        AND cm.code=?
                   ), ' ','')
             ORDER BY p.PRC_CODE LIMIT 1),
           (SELECT p.PRC_CODE FROM PROCESS AS p ORDER BY p.PRC_CODE LIMIT 1)
         ),
         MANAGER = ?
   WHERE FAC_ID = ?
`;

// 설비 삭제

const facilityDelete = `
  DELETE FROM FACILITY WHERE FAC_ID = ?
`;

// 공정

const processList = `
  SELECT PRC_CODE, PRC_NAME, PRC_RDATE, PRC_WRITER, PRC_NOTE, FAC_TYPE
  FROM PROCESS
  ORDER BY FAC_TYPE, PRC_CODE
`;

const processFacTypes = `
  SELECT DISTINCT FAC_TYPE
  FROM PROCESS
  WHERE FAC_TYPE IS NOT NULL AND FAC_TYPE <> ''
  ORDER BY FAC_TYPE
`;

const facilitySelectByFacType = `
  SELECT
    f.FAC_ID,
    f.FAC_NAME,
    f.FAC_TYPE,
    cm.code_name AS FAC_TYPE_NM,
    f.FAC_USE,
    f.FAC_COMPANY,
    f.FAC_MDATE,
    f.FAC_IDATE,
    f.FAC_CHECKDAY,
    f.PR_ID,
    f.MANAGER
  FROM FACILITY AS f
  LEFT JOIN code_master AS cm
    ON cm.group_code='FC'
   AND cm.code=f.FAC_TYPE
  WHERE (
    REPLACE(cm.code_name,' ','') = REPLACE(?, ' ','')
    OR REPLACE(TRIM(REPLACE(cm.code_name,'설비','')), ' ','') = REPLACE(?, ' ','')
  )
  ORDER BY f.FAC_ID
`;

// 설비 상태 목록

const facilityStatusList = `
  WITH latest AS (
    SELECT s.*,
           ROW_NUMBER() OVER (
             PARTITION BY s.FAC_ID
             ORDER BY COALESCE(s.DOWN_STARTDAY,'0000-00-00 00:00:00') DESC,
                      CAST(SUBSTRING(s.FS_ID,3) AS UNSIGNED) DESC
           ) AS rn
    FROM FACILITY_STATUS AS s
  )
  SELECT
    f.FAC_ID,
    f.FAC_NAME,
    f.FAC_TYPE,
    f.PR_ID,
    cm_fc.code_name AS FAC_TYPE_NM,
    s.FS_ID,
    s.FS_STATUS,
    s.FS_REASON,
    s.FS_TYPE,
    cm_rr.code_name AS FS_TYPE_NM,
    s.DOWN_STARTDAY,
    s.DOWN_ENDDAY,
    s.FS_CHECKDAY,
    s.FS_NEXTDAY,
    COALESCE(s.MANAGER, f.MANAGER) AS MANAGER
  FROM FACILITY AS f
  LEFT JOIN latest AS s
    ON s.FAC_ID = f.FAC_ID
   AND s.rn = 1
  LEFT JOIN code_master AS cm_fc
    ON cm_fc.group_code='FC'
   AND cm_fc.code=f.FAC_TYPE
  LEFT JOIN code_master AS cm_rr
    ON cm_rr.group_code='RR'
   AND cm_rr.code=s.FS_TYPE
  ORDER BY f.FAC_ID
`;

// 상태

// const facilityStatusInsert = `
//   INSERT INTO FACILITY_STATUS
//     (FS_ID, FAC_ID, FS_STATUS, FS_REASON, FS_TYPE,
//      DOWN_STARTDAY, DOWN_ENDDAY, FS_CHECKDAY, FS_NEXTDAY, MANAGER)
//   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// `;

const facilityStatusUpdateToDown = `
  UPDATE FACILITY_STATUS
     SET FS_STATUS    = ?,
         FS_REASON    = ?,
         FS_TYPE      = ?,
         DOWN_STARTDAY= ?,
         FS_CHECKDAY  = ?,
         FS_NEXTDAY   = ?,
         MANAGER      = ?
   WHERE FS_ID = ?
`;

const facilityStatusEndDowntime = `
  UPDATE FACILITY_STATUS
     SET DOWN_ENDDAY = ?,
         FS_STATUS   = ?,
         FS_CHECKDAY = ?,
         MANAGER     = COALESCE(?, MANAGER)
   WHERE FS_ID = ?
`;

// 수리내역 목록(전체/설비별)

const facilityRepairList = `
  SELECT
    r.FR_ID,
    r.FS_ID,
    r.FAC_ID,
    f.FAC_NAME,
    f.FAC_TYPE,
    cm_fc.code_name AS FAC_TYPE_NM,
    COALESCE(r.FR_TYPE, s.FS_TYPE) AS FR_TYPE,
    cm_rr.code_name AS FR_TYPE_NM,
    r.FR_CONTENT,
    r.FR_NOTE,
    COALESCE(r.MANAGER, f.MANAGER) AS MANAGER,
    COALESCE(r.FR_STARTDAY, s.DOWN_STARTDAY) AS REPAIR_STARTDAY,
    COALESCE(r.FR_ENDDAY,   s.DOWN_ENDDAY)   AS REPAIR_ENDDAY
  FROM FACILITY_REPAIR AS r
  LEFT JOIN FACILITY_STATUS AS s ON s.FS_ID = r.FS_ID
  LEFT JOIN FACILITY        AS f ON f.FAC_ID = r.FAC_ID
  LEFT JOIN code_master AS cm_fc ON cm_fc.group_code='FC' AND cm_fc.code=f.FAC_TYPE
  LEFT JOIN code_master AS cm_rr ON cm_rr.group_code='RR' AND cm_rr.code=COALESCE(r.FR_TYPE, s.FS_TYPE)
  ORDER BY r.FR_ID DESC
`;

const facilityRepairByFacId = `
  SELECT
    r.FR_ID,
    r.FS_ID,
    r.FAC_ID,
    f.FAC_NAME,
    f.FAC_TYPE,
    cm_fc.code_name AS FAC_TYPE_NM,
    COALESCE(r.FR_TYPE, s.FS_TYPE) AS FR_TYPE,
    cm_rr.code_name AS FR_TYPE_NM,
    r.FR_CONTENT,
    r.FR_NOTE,
    COALESCE(r.MANAGER, f.MANAGER) AS MANAGER,
    COALESCE(r.FR_STARTDAY, s.DOWN_STARTDAY) AS REPAIR_STARTDAY,
    COALESCE(r.FR_ENDDAY,   s.DOWN_ENDDAY)   AS REPAIR_ENDDAY
  FROM FACILITY_REPAIR AS r
  LEFT JOIN FACILITY_STATUS AS s ON s.FS_ID = r.FS_ID
  LEFT JOIN FACILITY        AS f ON f.FAC_ID = r.FAC_ID
  LEFT JOIN code_master AS cm_fc ON cm_fc.group_code='FC' AND cm_fc.code=f.FAC_TYPE
  LEFT JOIN code_master AS cm_rr ON cm_rr.group_code='RR' AND cm_rr.code=COALESCE(r.FR_TYPE, s.FS_TYPE)
  WHERE r.FAC_ID = ?
  ORDER BY r.FR_ID DESC
`;

// 현재 비가동(고장) 중인 설비

const facilityOpenRepairs = `
  WITH latest AS (
    SELECT s.*,
           ROW_NUMBER() OVER (
             PARTITION BY s.FAC_ID
             ORDER BY COALESCE(s.DOWN_STARTDAY,'0000-00-00 00:00:00') DESC,
                      CAST(SUBSTRING(s.FS_ID,3) AS UNSIGNED) DESC
           ) AS rn
    FROM FACILITY_STATUS AS s
  )
  SELECT
    s.FS_ID,
    s.FAC_ID,
    f.FAC_NAME,
    s.FS_TYPE,
    cm.code_name AS FS_TYPE_NM,
    s.DOWN_STARTDAY,
    COALESCE(s.MANAGER, f.MANAGER) AS MANAGER
  FROM latest AS s
  JOIN FACILITY AS f ON f.FAC_ID = s.FAC_ID
  LEFT JOIN code_master AS cm ON cm.group_code='RR' AND cm.code=s.FS_TYPE
  WHERE s.rn=1
    AND s.FS_STATUS=1
    AND s.FS_REASON='고장'
  ORDER BY s.DOWN_STARTDAY DESC
`;

// 기간/설비 필터

const facilityStatusFilter = `
  SELECT
    s.*,
    f.FAC_NAME,
    f.PR_ID,
    cm.code_name AS FS_TYPE_NM
  FROM FACILITY_STATUS AS s
  JOIN FACILITY AS f ON f.FAC_ID = s.FAC_ID
  LEFT JOIN code_master AS cm ON cm.group_code='RR' AND cm.code=s.FS_TYPE
  WHERE ( ? IS NULL OR s.FAC_ID = ? )
    AND ( ? IS NULL OR s.DOWN_STARTDAY >= ? )
    AND ( ? IS NULL OR COALESCE(s.DOWN_ENDDAY, NOW()) <= ? )
  ORDER BY s.DOWN_STARTDAY DESC
`;

// 설비별 최신 1건

const facilityStatusCurrentByFac = `
  SELECT s.*
  FROM FACILITY_STATUS AS s
  WHERE s.FAC_ID = ?
  ORDER BY COALESCE(s.DOWN_STARTDAY, '0000-00-00 00:00:00') DESC,
           CAST(SUBSTRING(s.FS_ID, 3) AS UNSIGNED) DESC
  LIMIT 1
`;

// 수리내역 생성(비가동 종료 시)

const facilityRepairInsertFromStatus = `
  INSERT INTO FACILITY_REPAIR
    (FR_TYPE, FR_CONTENT, FR_NOTE, MANAGER, FS_ID, FAC_ID, FR_STARTDAY, FR_ENDDAY)
  SELECT s.FS_TYPE, ?, ?, COALESCE(?, s.MANAGER), s.FS_ID, s.FAC_ID, ?, ?
  FROM FACILITY_STATUS AS s
  WHERE s.FS_ID = ?
`;

// 점검 대상(현재 비가동 + 사유=점검)

const facilityOpenInspections = `
  WITH latest AS (
    SELECT s.*,
           ROW_NUMBER() OVER (
             PARTITION BY s.FAC_ID
             ORDER BY COALESCE(s.DOWN_STARTDAY,'0000-00-00 00:00:00') DESC,
                      CAST(SUBSTRING(s.FS_ID,3) AS UNSIGNED) DESC
           ) AS rn
    FROM FACILITY_STATUS AS s
  )
  SELECT
    s.FS_ID,
    s.FAC_ID,
    f.PR_ID AS PR_ID,
    f.FAC_NAME,
    f.FAC_TYPE,
    cm_fc.code_name AS FAC_TYPE_NM,
    s.FS_REASON,
    s.FS_TYPE,
    cm_rr.code_name AS FS_TYPE_NM,
    s.DOWN_STARTDAY,
    s.FS_CHECKDAY,
    s.FS_NEXTDAY,
    COALESCE(s.MANAGER, f.MANAGER) AS MANAGER
  FROM latest AS s
  JOIN FACILITY AS f ON f.FAC_ID = s.FAC_ID
  LEFT JOIN code_master AS cm_fc ON cm_fc.group_code='FC' AND cm_fc.code=f.FAC_TYPE
  LEFT JOIN code_master AS cm_rr ON cm_rr.group_code='RR' AND cm_rr.code=s.FS_TYPE
  WHERE s.rn=1
    AND s.FS_STATUS=1
    AND s.FS_REASON='점검'
  ORDER BY s.DOWN_STARTDAY DESC
`;

// 점검 종료(상태 + 점검일 + 다음점검일 동시 업데이트)

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
    s.FS_ID,
    s.FAC_ID,
    f.FAC_NAME,
    f.FAC_TYPE,
    cm_fc.code_name AS FAC_TYPE_NM,
    COALESCE(s.DOWN_STARTDAY, s.FS_CHECKDAY) AS INSPECT_START,
    s.FS_CHECKDAY AS INSPECT_DONE,
    c.FC_NEXTDAY  AS NEXT_INSPECT,
    c.FC_CONTENT  AS INSPECT_CONTENT,
    c.FC_SUIT     AS FIT,
    c.FC_SUIT_REASON AS NG_REASON,
    COALESCE(s.MANAGER, f.MANAGER) AS MANAGER
  FROM FACILITY_STATUS AS s
  JOIN FACILITY_CHECK  AS c ON c.FS_ID = s.FS_ID
  JOIN FACILITY        AS f ON f.FAC_ID = s.FAC_ID
  LEFT JOIN code_master AS cm_fc ON cm_fc.group_code='FC' AND cm_fc.code=f.FAC_TYPE
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
  codeByGroup,
  facilitySelect,
  facilityInsert,
  facilityUpdate,
  facilityDelete,
  processList,
  processFacTypes,
  facilitySelectByFacType,
  facilityStatusList,

  facilityStatusUpdateToDown,
  facilityStatusEndDowntime,
  facilityRepairList,
  facilityRepairByFacId,
  facilityOpenRepairs,
  facilityStatusFilter,
  facilityStatusCurrentByFac,
  facilityRepairInsertFromStatus,
  facilityOpenInspections,
  facilityStatusEndInspection,
  facilityInspectionHistory,
  facilityCheckInsert,
};
