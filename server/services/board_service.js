const mariadb = require("../database/mapper.js");

// 연결 쿼리 테스트
const findAll = async () => {
  let list = await mariadb.query("selectBoardList");
  return list;
};

const findBOM = async () => {
  let list = await mariadb.query("bom");
  return list;
};

module.exports = {
  findAll,
  findBOM,
};
