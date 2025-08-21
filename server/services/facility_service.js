// services/facility_service.js
const mariadb = require("../database/mapper.js");


// ====================== 설비 ======================

// 설비 목록 조회
const facilitySelect = async () => {
  const list = await mariadb.query("facilitySelect");
  return list;
};

// 설비 단건 조회
const facilityById = async ({ FAC_ID }) => {
  const row = await mariadb.query("facilityById", [FAC_ID]);
  return row;
};

// 다음 설비 ID 조회
const getNextFacilityId = async () => {
  const first = (await mariadb.query("nextFacilityId"))?.[0];
  return first?.FAC_ID;
};

// 설비 등록 (신규 ID 생성 후 INSERT)

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

  ]);
  return newId;
};

// 설비 수정
const facilityUpdate = async (d) => {
  const result = await mariadb.query("facilityUpdate", [
    d.FAC_NAME,
    d.FAC_TYPE,
    d.FAC_USE ?? 1,
    d.FAC_COMPANY ?? null,
    d.FAC_MDATE ?? null,
    d.FAC_IDATE ?? null,
    d.FAC_CHECKDAY ?? null,
    d.PR_ID ?? null,
    d.MANAGER ?? null,
    d.FAC_ID,
  ]);
  return result;
};

// 설비 삭제
const facilityDelete = async ({ FAC_ID }) => {
  const result = await mariadb.query("facilityDelete", [FAC_ID]);
  return result;
};

// 설비 유형별 조회
const facilitySelectByFacType = async (facType) => {
  const list = await mariadb.query("facilitySelectByFacType", [
    facType,
    facType,
  ]);
  return list;
};

// ====================== 설비 상태 ======================

// 상태 목록 조회
const facilityStatusList = async () => {
  const list = await mariadb.query("facilityStatusList");
  return list;
};

// 특정 설비의 현재 상태 조회
const facilityStatusCurrentByFac = async (facId) => {
  const row = await mariadb.query("facilityStatusCurrentByFac", [facId]);
  return row;
};

// (서버 생성) FS_ID 생성 유틸
const genFsId = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `FS${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(
    d.getHours()
  )}${p(d.getMinutes())}${p(d.getSeconds())}${ms}`;
};

// 상태 신규 등록
const facilityStatusInsert = async (data) => {
  const FS_ID = genFsId();
  await mariadb.query("facilityStatusInsert", [
    FS_ID,

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

  ]);
  return FS_ID;
};

// 상태 비가동/진행 업데이트
const facilityStatusUpdateToDown = async (d) => {
  const result = await mariadb.query("facilityStatusUpdateToDown", [
    d.FS_STATUS ?? 1,
    d.FS_REASON ?? null,
    d.FS_TYPE ?? null,
    d.DOWN_STARTDAY ?? null,
    d.FS_CHECKDAY ?? null,
    d.FS_NEXTDAY ?? null,
    d.MANAGER ?? null,
    d.FS_ID,
  ]);
  return result;
};

// 상태 종료(비가동 종료 + 필요 시 수리 생성/종료)

const facilityStatusEndDowntime = async ({
  FS_ID,
  endTime,
  restoreStatus = 0,
  checkTime = null,
  MANAGER = null,
}) => {

  // 상태 종료
  await mariadb.query("facilityStatusEndDowntime", [
    endTime,
    restoreStatus,
    checkTime,
    MANAGER,
    FS_ID,
  ]);

  // 수리 내용이 있으면 수리 등록
  const hasRepairContent =
    (repairContent && String(repairContent).trim() !== "") ||
    (repairNote && String(repairNote).trim() !== "");

  if (hasRepairContent) {
    await mariadb.query("facilityRepairInsertByFsId", [
      repairContent ?? null,
      repairNote ?? null,
      MANAGER ?? null,
      FS_ID,
    ]);
  }

  // 수리 종료시간 동기화
  await mariadb.query("facilityRepairFinishByFsId", [endTime, FS_ID]);

  return true;

};

// 상태 이력 조회(필터)
const facilityStatusFilter = async ({
  facId = null,
  startDate = null,
  endDate = null,
}) => {

  const list = await mariadb.query("facilityStatusFilter", [
    facId,
    facId,
    startDate,
    startDate,
    endDate,
    endDate,
  ]);
  return list;
};

// ====================== 설비 수리 ======================

// 수리 목록 조회
const facilityRepairList = async () => {
  const list = await mariadb.query("facilityRepairList");
  return list;
};

// 설비별 수리 목록 조회
const facilityRepairByFacId = async (facId) => {
  const list = await mariadb.query("facilityRepairByFacId", [facId]);
  return list;
};

// ====================== 설비 점검 ======================

// 미완료 점검 목록 조회
const facilityOpenInspections = async () => {
  const list = await mariadb.query("facilityOpenInspections");
  return list;
};

// 점검 결과 등록

const facilityCheckInsert = async ({
  FS_ID,
  FAC_ID,
  FC_NEXTDAY,
  FC_SUIT,
  FC_SUIT_REASON,
  FC_CONTENT,
  MANAGER,
}) => {

  const result = await mariadb.query("facilityCheckInsert", [

    FC_NEXTDAY ?? null,
    FC_SUIT ?? null,
    FC_SUIT_REASON ?? null,
    FC_CONTENT ?? null,
    MANAGER ?? null,
    FS_ID,
    FAC_ID,

    FS_ID,
  ]);
  return result;
};

// 점검 종료 처리(상태/다음 점검일 등 반영)


// 점검 종료
const facilityStatusEndInspection = async ({
  FS_ID,
  endTime,
  restoreStatus = 0,
  checkTime = null,
  nextCheck = null,
  MANAGER = null,
}) => {

  const now = endTime ?? new Date();

  // 1) STATUS 종료
  await mariadb.query("facilityStatusEndInspection", [
    now,
    restoreStatus,
    checkTime ?? now,
    nextCheck ?? null,
    MANAGER ?? null,
    FS_ID,
  ]);


  // 2) CHECK 종료시간 업데이트
  await mariadb.query("facilityCheckFinishByFsId", [now, FS_ID]);

  return true;
};

// 점검 이력 조회(필터)
const facilityInspectionHistory = async ({
  facId = null,
  startDate = null,
  endDate = null,
}) => {

  const list = await mariadb.query("facilityInspectionHistory", [
    facId,
    facId,
    startDate,
    startDate,
    endDate,
    endDate,
  ]);
  return list;
};

// ====================== 공통 코드 / 공정 ======================

// 공통 코드 조회
const getCodesByGroup = async (group) => {
  const list = await mariadb.query("codeByGroup", [group]);
  return list;
};

// 공정 목록 조회
const getProcessList = async () => {
  const list = await mariadb.query("processList");
  return list;
};

module.exports = {
  // 설비

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
  facilityStatusInsert,
  facilityStatusUpdateToDown,
  facilityStatusEndDowntime,
  facilityStatusFilter,

  // 수리
  facilityRepairList,
  facilityRepairByFacId,


  // 점검
  facilityOpenInspections,
  facilityCheckInsert,
  facilityStatusEndInspection,
  facilityInspectionHistory,


  // 코드/공정
  getCodesByGroup,
  getProcessList,

};
