// services/facility_service.js
const mariadb = require("../database/mapper.js");

// 설비
const facilitySelect = async () => mariadb.query("facilitySelect");
const facilityById = async ({ FAC_ID }) =>
  mariadb.query("facilityById", [FAC_ID]);
const getNextFacilityId = async () =>
  (await mariadb.query("nextFacilityId"))?.[0]?.FAC_ID;
const facilityInsert = async (data) => {
  const newId = await getNextFacilityId();
  await mariadb.query("facilityInsert", [
    newId,
    data.FAC_NAME,
    data.FAC_TYPE,
    data.FAC_USE ?? 1,
    data.FAC_COMPANY ?? null,
    data.FAC_MDATE ?? null,
    data.FAC_IDATE ?? null,
    data.FAC_CHECKDAY ?? null,
    data.PR_ID ?? null,
    data.MANAGER ?? null,
  ]);
  return newId;
};
const facilityUpdate = async (d) =>
  mariadb.query("facilityUpdate", [
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
const facilityDelete = async ({ FAC_ID }) =>
  mariadb.query("facilityDelete", [FAC_ID]);
const facilitySelectByFacType = async (facType) =>
  mariadb.query("facilitySelectByFacType", [facType, facType]);

// 상태 목록/단건
const facilityStatusList = async () => mariadb.query("facilityStatusList");
const facilityStatusCurrentByFac = async (facId) =>
  mariadb.query("facilityStatusCurrentByFac", [facId]);

// 상태 신규(서버에서 FS_ID 생성)
const genFsId = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `FS${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(
    d.getHours()
  )}${p(d.getMinutes())}${p(d.getSeconds())}${ms}`;
};
const facilityStatusInsert = async (data) => {
  const FS_ID = genFsId();
  await mariadb.query("facilityStatusInsert", [
    FS_ID,
    data.FAC_ID,
    data.FS_STATUS ?? 1,
    data.FS_REASON ?? null,
    data.FS_TYPE ?? null,
    data.DOWN_STARTDAY ?? null,
    data.DOWN_ENDDAY ?? null,
    data.FS_CHECKDAY ?? null,
    data.FS_NEXTDAY ?? null,
    data.MANAGER ?? null,
  ]);
  return FS_ID;
};

// 상태 변경/종료
const facilityStatusUpdateToDown = async (d) =>
  mariadb.query("facilityStatusUpdateToDown", [
    d.FS_STATUS ?? 1,
    d.FS_REASON ?? null,
    d.FS_TYPE ?? null,
    d.DOWN_STARTDAY ?? null,
    d.FS_CHECKDAY ?? null,
    d.FS_NEXTDAY ?? null,
    d.MANAGER ?? null,
    d.FS_ID,
  ]);

const facilityStatusEndDowntime = async ({
  FS_ID,
  endTime,
  restoreStatus = 0,
  checkTime = null,
  MANAGER = null,
  repairContent = null,
  repairNote = null,
}) => {
  await mariadb.query("facilityStatusEndDowntime", [
    endTime,
    restoreStatus,
    checkTime,
    MANAGER,
    FS_ID,
  ]);
  if (
    (repairContent && String(repairContent).trim() !== "") ||
    (repairNote && String(repairNote).trim() !== "")
  ) {
    await mariadb.query("facilityRepairInsertByFsId", [
      repairContent ?? null,
      repairNote ?? null,
      MANAGER ?? null,
      FS_ID,
    ]);
  }
  return true;
};

const facilityStatusFilter = async ({
  facId = null,
  startDate = null,
  endDate = null,
}) =>
  mariadb.query("facilityStatusFilter", [
    facId,
    facId,
    startDate,
    startDate,
    endDate,
    endDate,
  ]);

// 수리
const facilityRepairList = async () => mariadb.query("facilityRepairList");
const facilityRepairByFacId = async (facId) =>
  mariadb.query("facilityRepairByFacId", [facId]);

// 점검
const facilityOpenInspections = async () =>
  mariadb.query("facilityOpenInspections");
const facilityCheckInsert = async ({
  FS_ID,
  FAC_ID,
  FC_NEXTDAY,
  FC_SUIT,
  FC_SUIT_REASON,
  FC_CONTENT,
  MANAGER,
}) =>
  mariadb.query("facilityCheckInsert", [
    FC_NEXTDAY ?? null,
    FC_SUIT ?? null,
    FC_SUIT_REASON ?? null,
    FC_CONTENT ?? null,
    MANAGER ?? null,
    FS_ID,
    FAC_ID,
  ]);

const facilityStatusEndInspection = async ({
  FS_ID,
  endTime,
  restoreStatus = 0,
  checkTime = null,
  nextCheck = null,
  MANAGER = null,
}) =>
  mariadb.query("facilityStatusEndInspection", [
    endTime,
    restoreStatus,
    checkTime,
    nextCheck,
    MANAGER,
    FS_ID,
  ]);

const facilityInspectionHistory = async ({
  facId = null,
  startDate = null,
  endDate = null,
}) =>
  mariadb.query("facilityInspectionHistory", [
    facId,
    facId,
    startDate,
    startDate,
    endDate,
    endDate,
  ]);

// 코드/공정
const getCodesByGroup = async (group) => mariadb.query("codeByGroup", [group]);
const getProcessList = async () => mariadb.query("processList");

module.exports = {
  facilitySelect,
  facilityById,
  getNextFacilityId,
  facilityInsert,
  facilityUpdate,
  facilityDelete,
  facilitySelectByFacType,

  facilityStatusList,
  facilityStatusCurrentByFac,
  facilityStatusInsert, // ← 추가/내보내기
  facilityStatusUpdateToDown,
  facilityStatusEndDowntime,
  facilityStatusFilter,

  facilityRepairList,
  facilityRepairByFacId,

  facilityOpenInspections,
  facilityCheckInsert,
  facilityStatusEndInspection,
  facilityInspectionHistory,

  getCodesByGroup,
  getProcessList,
};
