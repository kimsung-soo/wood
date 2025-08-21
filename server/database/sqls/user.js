// 로그인 할 이메일 기준으로 정보 조회
const loginEmail = `SELECT email,
       REPLACE(EMP_HDATE, '-', '') AS password,
       emp_name AS name,
       auth
FROM   EMPLOYEES
WHERE  email = ?`;

module.exports = {
  loginEmail,
};
