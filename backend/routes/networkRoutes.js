const express = require('express');
const router = express.Router();
const {
  getAllConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig
} = require('../controllers/networkController');

// Route: /api/networks
router.route('/')
  .get(getAllConfigs)
  .post(createConfig);

// Route: /api/networks/:id
router.route('/:id')
  .get(getConfigById)
  .put(updateConfig)
  .delete(deleteConfig);

module.exports = router;
