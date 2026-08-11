const NetworkConfig = require('../models/NetworkConfig');
const { getStorage } = require('../config/db');

/**
 * @desc    Get all network configurations with optional search and status filter
 * @route   GET /api/networks
 * @access  Public
 */
const getAllConfigs = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const { isMongoConnected, readJSONDB } = getStorage();

    if (isMongoConnected) {
      let query = {};
      if (status && status !== 'All') {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { ispName: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { serviceAddress: { $regex: search, $options: 'i' } }
        ];
      }
      const configs = await NetworkConfig.find(query).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: configs.length,
        data: configs
      });
    } else {
      // JSON Storage Fallback
      let data = readJSONDB();
      if (status && status !== 'All') {
        data = data.filter(item => item.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(item => 
          item.ispName.toLowerCase().includes(q) ||
          item.userName.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.serviceAddress.toLowerCase().includes(q) ||
          String(item.portNumber).includes(q)
        );
      }
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({
        success: true,
        count: data.length,
        data: data
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single network configuration by ID
 * @route   GET /api/networks/:id
 * @access  Public
 */
const getConfigById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isMongoConnected, readJSONDB } = getStorage();

    if (isMongoConnected) {
      const config = await NetworkConfig.findById(id);
      if (!config) {
        return res.status(404).json({ success: false, message: 'Network configuration not found' });
      }
      return res.status(200).json({ success: true, data: config });
    } else {
      const data = readJSONDB();
      const item = data.find(i => String(i._id) === String(id));
      if (!item) {
        return res.status(404).json({ success: false, message: 'Network configuration not found' });
      }
      return res.status(200).json({ success: true, data: item });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new network configuration
 * @route   POST /api/networks
 * @access  Public
 */
const createConfig = async (req, res, next) => {
  try {
    const { ispName, userName, contactPhone, serviceAddress, portNumber, location, status } = req.body;

    // Validation
    if (!ispName || !userName || !contactPhone || !serviceAddress || !portNumber || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (ISP Name, User Name, Contact Phone, Address, Port, Location)'
      });
    }

    const { isMongoConnected, readJSONDB, writeJSONDB } = getStorage();

    if (isMongoConnected) {
      const newConfig = await NetworkConfig.create({
        ispName,
        userName,
        contactPhone,
        serviceAddress,
        portNumber: Number(portNumber),
        location,
        status: status || 'Active'
      });
      return res.status(201).json({
        success: true,
        message: 'Network configuration created successfully',
        data: newConfig
      });
    } else {
      const data = readJSONDB();
      const newConfig = {
        _id: 'net_' + Date.now(),
        ispName,
        userName,
        contactPhone,
        serviceAddress,
        portNumber: Number(portNumber),
        location,
        status: status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.unshift(newConfig);
      writeJSONDB(data);
      return res.status(201).json({
        success: true,
        message: 'Network configuration created successfully',
        data: newConfig
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update network configuration
 * @route   PUT /api/networks/:id
 * @access  Public
 */
const updateConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ispName, userName, contactPhone, serviceAddress, portNumber, location, status } = req.body;
    const { isMongoConnected, readJSONDB, writeJSONDB } = getStorage();

    if (isMongoConnected) {
      let config = await NetworkConfig.findById(id);
      if (!config) {
        return res.status(404).json({ success: false, message: 'Network configuration not found' });
      }

      config = await NetworkConfig.findByIdAndUpdate(
        id,
        {
          ispName,
          userName,
          contactPhone,
          serviceAddress,
          portNumber: portNumber ? Number(portNumber) : config.portNumber,
          location,
          status
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Network configuration updated successfully',
        data: config
      });
    } else {
      let data = readJSONDB();
      const index = data.findIndex(i => String(i._id) === String(id));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Network configuration not found' });
      }

      data[index] = {
        ...data[index],
        ispName: ispName || data[index].ispName,
        userName: userName || data[index].userName,
        contactPhone: contactPhone || data[index].contactPhone,
        serviceAddress: serviceAddress || data[index].serviceAddress,
        portNumber: portNumber ? Number(portNumber) : data[index].portNumber,
        location: location || data[index].location,
        status: status || data[index].status,
        updatedAt: new Date().toISOString()
      };

      writeJSONDB(data);
      return res.status(200).json({
        success: true,
        message: 'Network configuration updated successfully',
        data: data[index]
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete network configuration
 * @route   DELETE /api/networks/:id
 * @access  Public
 */
const deleteConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isMongoConnected, readJSONDB, writeJSONDB } = getStorage();

    if (isMongoConnected) {
      const config = await NetworkConfig.findById(id);
      if (!config) {
        return res.status(404).json({ success: false, message: 'Network configuration not found' });
      }
      await config.deleteOne();
      return res.status(200).json({
        success: true,
        message: 'Network configuration deleted successfully',
        id: id
      });
    } else {
      let data = readJSONDB();
      const index = data.findIndex(i => String(i._id) === String(id));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Network configuration not found' });
      }
      data.splice(index, 1);
      writeJSONDB(data);
      return res.status(200).json({
        success: true,
        message: 'Network configuration deleted successfully',
        id: id
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig
};
