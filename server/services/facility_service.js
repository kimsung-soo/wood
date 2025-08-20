// services/facility_service.js
const mariadb = require("../database/mapper.js");

/* ==============================
 * FACILITY
 * ============================== */

// 설비 목록
const facilitySelect = async () => {
  return await mariadb.query("facilitySelect");
};

// 설비 단건
const facilityById = async ({ FAC_ID }) => {
  return await mariadb.query("facilityById", [FAC_ID]);
};

// 설비 등록
const facilityInsert = async (data) => {
  const params = [
    data.FAC_NAME,
    data.FAC_TYPE,
    data.FAC_USE ?? 1,
    data.FAC_COMPANY ?? null,
    data.FAC_MDATE ?? null,
    data.FAC_IDATE ?? null,
    data.FAC_CHECKDAY ?? null,

    data.FAC_TYPE,
    data.FAC_TYPE,
    data.FAC_TYPE,

    data.MANAGER ?? null,
  ];
  return await mariadb.query("facilityInsert", params);
};

// 다음 설비코드
const getNextFacilityId = async () => {
  return await mariadb.query("nextFacilityId");
};

// 설비 수정
const facilityUpdate = async (data) => {
  const params = [
    data.FAC_NAME,
    data.FAC_TYPE,
    data.FAC_USE,
    data.FAC_COMPANY,
    data.FAC_MDATE ?? null,
    data.FAC_IDATE ?? null,
    data.FAC_CHECKDAY ?? null,

    // PR_ID 재결정 후보
    data.FAC_TYPE,
    data.FAC_TYPE,
    data.FAC_TYPE,

    data.MANAGER ?? null,
    data.FAC_ID,
  ];
  return await mariadb.query("facilityUpdate", params);
};

// 설비 삭제
const facilityDelete = async ({ FAC_ID }) => {
  return await mariadb.query("facilityDelete", [FAC_ID]);
};

// 공통코드
const getCodesByGroup = async (group) => {
  return await mariadb.query("codeByGroup", [group]);
};

// 공정 목록
const processList = async () => {
  return await mariadb.query("processList");
};

// 공정 설비타입 목록
const processFacTypes = async () => {
  return await mariadb.query("processFacTypes");
};

// 설비타입별 설비 목록
const facilitySelectByFacType = async (facType) => {
  return await mariadb.query("facilitySelectByFacType", [facType, facType]);
};

// 설비별 최신 상태 목록
const facilityStatusList = async () => {
  return await mariadb.query("facilityStatusList");
};

// 특정 설비 최신 상태
const facilityStatusCurrentByFac = async (facId) => {
  return await mariadb.query("facilityStatusCurrentByFac", [facId]);
};

// // 상태 신규
// const facilityStatusInsert = async (data) => {
//   const fsId = `FS${Date.now()}`;
//   const params = [
//     fsId,
//     data.FAC_ID,
//     data.FS_STATUS ?? 1,
//     data.FS_REASON ?? null,
//     data.FS_TYPE ?? null,
//     data.DOWN_STARTDAY ?? null,
//     null, // DOWN_ENDDAY 초기값
//     data.FS_CHECKDAY ?? null,
//     data.FS_NEXTDAY ?? null,
//     data.MANAGER ?? null,
//   ];
//   await mariadb.query("facilityStatusInsert", params);
//   return fsId;
// };

// 비가동
const facilityStatusUpdateToDown = async (data) => {
  const params = [
    data.FS_STATUS,
    data.FS_REASON ?? null,
    data.FS_TYPE ?? null,
    data.DOWN_STARTDAY ?? null,
    data.FS_CHECKDAY ?? null,
    data.FS_NEXTDAY ?? null,
    data.MANAGER ?? null,
    data.FS_ID,
  ];
  return await mariadb.query("facilityStatusUpdateToDown", params);
};

// 비가동 종료
const facilityStatusEndDowntime = async ({
  FS_ID,
  endTime,
  restoreStatus = 0,
  checkTime = null,
  MANAGER = null,
}) => {
  const params = [endTime, restoreStatus, checkTime, MANAGER, FS_ID];
  return await mariadb.query("facilityStatusEndDowntime", params);
};

// 수리내역
const facilityRepairList = async () => {
  return await mariadb.query("facilityRepairList");
};

// 수리내역
const facilityRepairByFacId = async (facId) => {
  return await mariadb.query("facilityRepairByFacId", [facId]);
};

// 상태 종료 시 수리내역 생성
const facilityRepairInsertFromStatus = async ({
  fsId,
  content,
  note,
  start,
  end,
  manager,
}) => {
  const params = [
    content,
    note ?? null,
    manager ?? null,
    start ?? null,
    end ?? null,
    fsId,
  ];
  return await mariadb.query("facilityRepairInsertFromStatus", params);
};

// 현재 비가동
const facilityOpenRepairs = async () => {
  return await mariadb.query("facilityOpenRepairs");
};

const facilityStatusFilter = async ({
  facId = null,
  startDate = null,
  endDate = null,
}) => {
  const params = [facId, facId, startDate, startDate, endDate, endDate];
  return await mariadb.query("facilityStatusFilter", params);
};

// 현재 점검 대상
const facilityOpenInspections = async () => {
  return await mariadb.query("facilityOpenInspections");
};

// 점검 기록 저장
const facilityCheckInsert = async ({
  FS_ID,
  FAC_ID,
  FC_NEXTDAY,
  FC_SUIT,
  FC_SUIT_REASON,
  FC_CONTENT,
  MANAGER,
}) => {
  const params = [
    FC_NEXTDAY ?? null,
    FC_SUIT ?? null,
    FC_SUIT_REASON ?? null,
    FC_CONTENT ?? null,
    MANAGER ?? null,
    FS_ID,
    FAC_ID,
  ];
  return await mariadb.query("facilityCheckInsert", params);
};

// 점검 종료
const facilityStatusEndInspection = async ({
  FS_ID,
  endTime,
  restoreStatus = 0,
  checkTime = null,
  nextCheck = null,
  MANAGER = null,
}) => {
  const params = [endTime, restoreStatus, checkTime, nextCheck, MANAGER, FS_ID];
  return await mariadb.query("facilityStatusEndInspection", params);
};

const facilityInspectionHistory = async ({
  facId = null,
  startDate = null,
  endDate = null,
}) => {
  const params = [facId, facId, startDate, startDate, endDate, endDate];
  return await mariadb.query("facilityInspectionHistory", params);
};

module.exports = {
  // 기본
  facilitySelect,
  facilityById,
  facilityInsert,
  getNextFacilityId,
  facilityUpdate,
  facilityDelete,
  // 공통/공정
  getCodesByGroup,
  processList,
  processFacTypes,
  facilitySelectByFacType,
  // 상태
  facilityStatusList,
  facilityStatusCurrentByFac,

  facilityStatusUpdateToDown,
  facilityStatusEndDowntime,
  facilityStatusFilter,
  // 수리
  facilityRepairList,
  facilityRepairByFacId,
  facilityRepairInsertFromStatus,
  facilityOpenRepairs,
  // 점검
  facilityOpenInspections,
  facilityCheckInsert,
  facilityStatusEndInspection,
  facilityInspectionHistory,
};
