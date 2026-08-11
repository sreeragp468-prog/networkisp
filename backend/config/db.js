const fs = require('fs');
const path = require('path');

let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (e) {
  // Mongoose package optional check
}

const DB_FILE = path.join(__dirname, '..', 'data', 'network_db.json');

// Ensure fallback data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial sample records if JSON file doesn't exist
if (!fs.existsSync(DB_FILE)) {
  const initialData = [
    {
      _id: "net_001",
      ispName: "AetherNet Global",
      userName: "admin_user_01",
      contactPhone: "+1 (555) 019-2834",
      serviceAddress: "128 Gigabit Ave, Tech District",
      portNumber: 8080,
      location: "Server Rack B",
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: "net_002",
      ispName: "FiberX Speednet",
      userName: "network_master",
      contactPhone: "+1 (555) 048-9102",
      serviceAddress: "404 Router Way, Silicon Hub",
      portNumber: 4430,
      location: "Main Switch Node A",
      status: "Active",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: "net_003",
      ispName: "Quantum Connect",
      userName: "ops_lead",
      contactPhone: "+1 (555) 091-7733",
      serviceAddress: "77 Cyber Boulevard",
      portNumber: 9090,
      location: "Data Hall 3",
      status: "Maintenance",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    }
  ];
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

let isMongoConnected = false;

const connectDB = async () => {
  if (!mongoose) {
    console.log(`[Database] Mongoose package not loaded. Using local JSON database storage engine.`);
    isMongoConnected = false;
    return;
  }
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/networking_db';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(`[Database] MongoDB Connected Successfully: ${mongoose.connection.host}`);
  } catch (err) {
    isMongoConnected = false;
    console.log(`[Database] MongoDB connection bypassed (${err.message}). Using local JSON database engine.`);
  }
};

const getStorage = () => {
  return {
    isMongoConnected,
    DB_FILE,
    readJSONDB: () => {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    },
    writeJSONDB: (data) => {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }
  };
};

module.exports = { connectDB, getStorage };
