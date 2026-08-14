const requestListener = require('../backend/server');
const { connectDB } = require('../backend/config/db');

module.exports = async (req, res) => {
  await connectDB();
  return requestListener(req, res);
};
