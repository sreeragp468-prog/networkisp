let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (e) {}

if (mongoose) {
  const networkConfigSchema = new mongoose.Schema(
    {
      ispName: {
        type: String,
        required: [true, 'ISP Name is required'],
        trim: true
      },
      userName: {
        type: String,
        required: [true, 'User Name is required'],
        trim: true
      },
      contactPhone: {
        type: String,
        required: [true, 'Contact Phone is required'],
        trim: true
      },
      serviceAddress: {
        type: String,
        required: [true, 'Service Address is required'],
        trim: true
      },
      portNumber: {
        type: Number,
        required: [true, 'Port Number is required'],
        min: [1, 'Port Number must be at least 1'],
        max: [65535, 'Port Number cannot exceed 65535']
      },
      location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
      },
      status: {
        type: String,
        enum: ['Active', 'Maintenance', 'Inactive'],
        default: 'Active'
      }
    },
    {
      timestamps: true
    }
  );

  module.exports = mongoose.models.NetworkConfig || mongoose.model('NetworkConfig', networkConfigSchema);
} else {
  module.exports = null;
}
