// 로그인 할 이메일 기준으로 정보 조회
const loginEmail = `SELECT EMAIL,
       REPLACE(EMP_HDATE, '-', '') AS PASSWORD
FROM   EMPLOYEES`;

module.exports = {
  loginEmail,
};
