const mariadb = require("../database/mapper.js");

// 사원 조회
const masterEmpSelect = async () => {
  let list = await mariadb.query("masterEmpSelect");
  return list;
};

// 공통코드조회
const commonDept = async () => {
  let list = await mariadb.query("commonDept");
  return list;
};

const commonAuth = async () => {
  let list = await mariadb.query("commonAuth");
  return list;
};
// 사원 검색
const masterEmpSelectName = async (empName) => {
  const params = [empName];
  let list = await mariadb.query("masterEmpSelectName", params);
  return list;
};
// 사원 등록
const masterEmpInsert = async (data) => {
  const params = [
    data.EMP_NAME,
    data.PHONE,
    data.EMAIL,
    data.DEPT_NAME,
    data.AUTH,
    data.ADDR,
    data.EMP_STATUS,
    data.EMP_HDATE,
    data.EMP_EDATE || null,
  ];
  let result = await mariadb.query("masterEmpInsert", params);
  return result;
};

// 사원 수정
const masterEmpUpdate = async (data) => {
  const params = [
    data.EMP_NAME,
    data.PHONE,
    data.EMAIL,
    data.DEPT_NAME,
    data.AUTH,
    data.ADDR,
    data.EMP_STATUS,
    data.EMP_HDATE || null,
    data.EMP_EDATE || null,
    data.EMP_NO,
  ];
  let result = await mariadb.query("masterEmpUpdate", params);
  return result;
};

// 사원 삭제
const masterEmpDelete = async (EMP_NO) => {
  const params = [EMP_NO];
  let result = await mariadb.query("masterEmpDelete", params);
  return result;
};

// 제품관리 - 조회
const masterPrdSelect = async () => {
  let list = await mariadb.query("masterPrdSelect");
  return list;
};

// 제품관리 - 모달조회
const masterPrdModal = async () => {
  let list = await mariadb.query("masterPrdModal");
  return list;
};

// 제품관리 - 유형
const masterPrdType = async () => {
  let list = await mariadb.query("masterPrdType");
  return list;
};

// // 제품관리 - 단위
const masterPrdUnit = async () => {
  let list = await mariadb.query("masterPrdUnit");
  return list;
};

// 제품관리 - 등록
const masterPrdInsert = async (data) => {
  const params = [
    data.PRD_NAME,
    data.PRD_TYPE,
    data.PRD_UNIT,
    data.PRD_SIZE,
    data.PRD_SAFEQT,
    data.PRD_WRITER,
    data.PRD_DATE,
    data.PRD_NOTE || null,
  ];
  let result = await mariadb.query("masterPrdInsert", params);
  return result;
};

// 제품관리 - 수정
const masterPrdUpdate = async (data) => {
  const params = [
    data.PRD_NAME,
    data.PRD_TYPE,
    data.PRD_UNIT,
    data.PRD_SIZE,
    data.PRD_SAFEQT,
    data.PRD_WRITER,
    data.PRD_DATE,
    data.PRD_NOTE || null,
    data.PRD_CODE,
  ];
  let result = await mariadb.query("masterPrdUpdate", params);
  return result;
};

// 제품관리 - 삭제

const masterPrdDelete = async (data) => {
  const prdJSON = JSON.stringify(data.prdCode);
  const params = [prdJSON];
  let result = await mariadb.query("masterPrdDelete", params);
  return result;
};

// 제품관리 - 검색
const masterPrdSearch = async (data) => {
  const params = [data.PRD_NAME];
  let result = await mariadb.query("masterPrdSearch", params);
  return result;
};

// 자재관리 - 조회
const masterMatSelect = async () => {
  let list = await mariadb.query("masterMatSelect");
  return list;
};

// 자재관리 - 모달조회
const masterMatModal = async () => {
  let list = await mariadb.query("masterMatModal");
  return list;
};

// 자재관리 - 유형
const masterMatType = async () => {
  let list = await mariadb.query("masterMatType");
  return list;
};

//  자재관리 - 단위
const masterMatUnit = async () => {
  let list = await mariadb.query("masterMatUnit");
  return list;
};

// 자재관리 - 등록
const masterMatInsert = async (data) => {
  const params = [
    data.MAT_NAME,
    data.MAT_TYPE,
    data.MAT_UNIT,
    data.MAT_SIZE,
    data.MAT_SAFEQT,
    data.MAT_DATE,
    data.MAT_NOTE || null,
    data.MAT_WRITER,
  ];
  let result = await mariadb.query("masterMatInsert", params);
  return result;
};

// 자재관리 - 수정
const masterMatUpdate = async (data) => {
  const params = [
    data.MAT_NAME,
    data.MAT_TYPE,
    data.MAT_UNIT,
    data.MAT_SIZE,
    data.MAT_SAFEQT,
    data.MAT_DATE,
    data.MAT_NOTE || null,
    data.MAT_WRITER,
    data.MAT_CODE,
  ];
  let result = await mariadb.query("masterMatUpdate", params);
  return result;
};

// 재공품관리 - 조회
const masterWIPSelect = async () => {
  let list = await mariadb.query("masterWIPSelect");
  return list;
};

// 재공품관리 - 모달조회
const masterWIPModal = async () => {
  let list = await mariadb.query("masterWIPModal");
  return list;
};

// 재공품관리 - 유형
const masterWIPType = async () => {
  let list = await mariadb.query("masterWIPType");
  return list;
};

// 공정관리 - 단위
const masterWIPUnit = async () => {
  let list = await mariadb.query("masterWIPUnit");
  return list;
};

// 공정관리 - 조회
const masterPrcSelect = async () => {
  let list = await mariadb.query("masterPrcSelect");
  return list;
};

// 공정관리 - 모달조회
const masterPrcModal = async () => {
  let list = await mariadb.query("masterPrcModal");
  return list;
};

// 공정관리 - 등록
const masterPrcInsert = async (data) => {
  const params = [
    data.PRC_NAME,
    data.FAC_TYPE,
    data.PRC_WRITER,
    data.PRC_RDATE,
    data.PRC_NOTE || null,
  ];
  let result = await mariadb.query("masterPrcInsert", params);
  return result;
};

// 공정관리 - 수정
const masterPrcUpdate = async (data) => {
  const params = [
    data.PRC_NAME,
    data.PRC_TYPE,
    data.PRC_WRITER,
    data.PRC_RDATE,
    data.PRC_NOTE || null,
    data.PRC_CODE,
  ];
  let result = await mariadb.query("masterPrcUpdate", params);
  return result;
};

// 재공품관리 - 등록
const masterWIPInsert = async (data) => {
  const params = [
    data.WIP_NAME,
    data.WIP_TYPE,
    data.WIP_UNIT,
    data.WIP_SIZE,
    data.WIP_DATE,
    data.WIP_NOTE || null,
    data.WIP_WRITER,
  ];
  let result = await mariadb.query("masterWIPInsert", params);
  return result;
};

// 재공품관리 - 수정
const masterWIPUpdate = async (data) => {
  const params = [
    data.WIP_NAME,
    data.WIP_TYPE,
    data.WIP_UNIT,
    data.WIP_SIZE,
    data.WIP_DATE,
    data.WIP_NOTE || null,
    data.WIP_WRITER,
    data.WIP_CODE,
  ];
  let result = await mariadb.query("masterWIPUpdate", params);
  return result;
};

// BOM관리에서 제품 조회
const BOMprdSelect = async () => {
  let list = await mariadb.query("BOMprdSelect");
  return list;
};

// BOM관리에서 제품클릭시 BOM 조회
const BOMbomSelect = async (prdName) => {
  const params = [prdName];
  let list = await mariadb.query("BOMbomSelect", params);
  return list;
};

//BOM 자재 모달
const BOMmodalSelect = async () => {
  let list = await mariadb.query("BOMmodalSelect");
  return list;
};

// BOM 모달 확인
const BOMmodalConfirm = async (data) => {
  const params = [
    data.BOM_CODE,
    data.MAT_CODE,
    data.MAT_NAME,
    data.MAT_TYPE,
    data.UNIT,
    data.BOM_VER,
  ];
  let result = await mariadb.query("BOMmodalConfirm", params);
  return result;
};

// BOM_DETAIL (자재)조회
const BOM_detailSelect = async (data) => {
  const params = [data.BOM_CODE, data.BOM_VER];
  let list = await mariadb.query("BOM_detailSelect", params);
  return list;
};

// BOM 추가버튼
const BOMInsert = async (data) => {
  const [rows] = await mariadb.query("nextBOm", [data.PRD_CODE]);
  console.log("rows:", rows);
  const newBomCode = rows.code;

  const insertparams = [newBomCode, data.PRD_CODE, data.BOM_WRITER, newBomCode];
  await mariadb.query("bomUpdate", [
    data.PRD_CODE,
    data.PRD_CODE,
    data.BOM_VER,
  ]);
  let result = await mariadb.query("BOMInsert", insertparams);
  console.log(data);

  return result;
};

// BOM 삭제 버튼
const bomDelete = async (data) => {
  const params = [data.BOM_CODE, data.MAT_CODE];
  let result = await mariadb.query("bomDelete", params);
  return result;
};

// BOM 저장 버튼
const bomMatUpdate = async (data) => {
  console.log(data.bomCode);
  const matCodesJSON = JSON.stringify(data.matCodes);
  const qtysJSON = JSON.stringify(data.qtys);
  const params = [data.bomCode, matCodesJSON, qtysJSON];
  let result = await mariadb.query("bomMatUpdate", params);
  return result;
};

// BOM 검색
const bomSearch = async (data) => {
  const params = [data.PRD_NAME];
  let result = await mariadb.query("bomSearch", params);
  return result;
};

// 공정흐름도 - 제품조회
const diaPrdList = async () => {
  let list = await mariadb.query("diaPrdList");
  return list;
};
// 공정흐름도 - 모달조회
const diaModalList = async () => {
  let list = await mariadb.query("diaModalList");
  return list;
};

// 공정흐름도 - 공정조회
const prcList = async (data) => {
  const params = [data.DIA_CODE];
  let list = await mariadb.query("prcList", params);
  return list;
};

// 공정흐름도 - 흐름도 코드 insert
const diaInsert = async (data) => {
  const params = [data.제품코드, data.작성자, data.등록일];
  let result = await mariadb.query("diaInsert", params);
  return result;
};

// 공정흐름도 - 모달 확인 insert
const prcModalConfirm = async (data) => {
  const params = [
    data.DIA_CODE,
    data.DIA_CODE,
    data.PRC_CODE,
    data.PRC_NAME,
    data.FAC_TYPE,
  ];
  let result = await mariadb.query("prcModalConfirm", params);
  return result;
};

// 공정 순서 업데이트
const updateProcessOrder = async (data) => {
  const jsonData = JSON.stringify(data); // JSON 배열로 변환
  const params = [jsonData];
  let result = await mariadb.query("updateProcessOrder", params);
  return result;
};
// 공정흐름도 삭제
const prcDelete = async (data) => {
  const diaCode = data.diaCode;
  const prcJSON = JSON.stringify(data.prcCode);
  const params = [diaCode, prcJSON];
  let result = await mariadb.query("prcDelete", params);
  return result;
};

// 창고 모달 조회
const wrModalSelect = async () => {
  let list = await mariadb.query("wrModalSelect");
  return list;
};

// 창고 - 조회
const wrSelect = async (data) => {
  const params = [data.WR_NO];
  let list = await mariadb.query("wrSelect", params);
  return list;
};
// 출하 - 조회
const wrShip = async () => {
  let list = await mariadb.query("wrShip");
  return list;
};

// 출하 - 출하버튼
const wrShipUpdate = async (rows) => {
  for (const row of rows) {
    console.log(row);
    const params = [row.DELIVERY, row.CAR_NO, row.SHIP_NO];
    await mariadb.query("wrShipUpdate", params);
  }
  return { success: true };
};

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
  bomDelete,
  bomMatUpdate,
  bomSearch,
  diaPrdList,
  diaModalList,
  prcList,
  prcModalConfirm,
  prcDelete,
  commonAuth,
  commonDept,
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
  masterMatSelect,
  masterMatModal,
  masterMatType,
  masterMatUnit,
  masterMatInsert,
  masterMatUpdate,
  masterWIPSelect,
  masterWIPModal,
  masterWIPType,
  masterWIPUnit,
  masterWIPInsert,
  masterWIPUpdate,
  masterPrcUpdate,
  masterPrcInsert,
  masterPrcModal,
  masterPrcSelect,
  wrShip,
  wrShipUpdate,
};
