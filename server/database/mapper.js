const mariadb = require("mariadb");
const sqlList = require("./sqlList.js");
const connectionPool = mariadb.createPool({
  host: process.env.HOST,
  port: process.env.PORT,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  connectionLimit: process.env.LIMIT,

  insertIdAsNumber: true,
  bigIntAsNumber: true,
  permitSetMultiParamEntries: true,
  logger: {
    query: console.log,
    error: console.log,
  },
});

const query = async (alias, values) => {
  let conn = null;
  try {
    conn = await connectionPool.getConnection();
    let exeuteSql = sqlList[alias];
    let result = await conn.query(exeuteSql, values);

    return result;
  } catch (e) {
    console.log(e);
  } finally {
    conn.release();
  }
};

module.exports = {
  query,
};
