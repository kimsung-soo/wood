const boards = require("./sqls/boards.js");
const boms = require("./sqls/product.js");
const materials = require("./sqls/materials.js");
const production = require("./sqls/production.js");
const quality = require("./sqls/quality.js");
const master = require("./sqls/master.js");
const facility = require("./sqls/facility.js");
const marketing = require("./sqls/marketing.js");
const login = require("./sqls/user.js");

module.exports = {
  ...boards,
  ...boms,
  ...materials,
  ...production,
  ...quality,
  ...master,
  ...facility,
  ...marketing,
  ...login,
};
