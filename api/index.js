const requestListener = require('../backend/server');

module.exports = (req, res) => {
  return requestListener(req, res);
};
