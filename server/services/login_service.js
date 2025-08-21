const mariadb = require("../database/mapper.js");

const loginByEmail = async (loginInfo) => {
  let list = await mariadb.query("loginEmail", [loginInfo.email]);

  let userInfo = null;
  if (list.length == 1) {
    // 해당 회원 정보 존재
    let info = list[0];
    if (info.pwd == loginInfo.password) {
      userInfo = info;
    }
  }
  return {
    result: userInfo != null,
    userInfo,
  };
};
module.exports = { loginByEmail };
