const fs = require('fs');
const path = require('path');
const os = require('os');

// Load environment variables from .env files
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
} catch (e) {
  // Dotenv loading optional
}

let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (e) {
  // Mongoose package optional check
}

const PRIMARY_DB_FILE = path.join(__dirname, '..', 'data', 'network_db.json');
const TMP_DB_FILE = path.join(os.tmpdir(), 'network_db.json');

let inMemoryData = null;

// Helper to initialize memory data
const loadInitialData = () => {
  // Try primary DB file first
  try {
    if (fs.existsSync(PRIMARY_DB_FILE)) {
      const raw = fs.readFileSync(PRIMARY_DB_FILE, 'utf8');
      inMemoryData = JSON.parse(raw);
      return inMemoryData;
    }
  } catch (e) {
    // Ignore primary read error
  }

  // Try fallback TMP DB file
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, 'utf8');
      inMemoryData = JSON.parse(raw);
      return inMemoryData;
    }
  } catch (e) {
    // Ignore tmp read error
  }

  if (inMemoryData) return inMemoryData;

  // Initial sample data if no file is present
  inMemoryData = [
    {
      _id: "net_001",
      ispName: "Kerala Vision",
      userName: "sreerag",
      contactPhone: "8590616299",
      serviceAddress: "kuttiadi",
      portNumber: 10,
      location: "kayakkodi",
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  return inMemoryData;
};

// Safe write function that handles read-only file systems (EROFS) gracefully
const safeWriteDB = (data) => {
  inMemoryData = data;

  // Try writing to primary DB file
  try {
    const dataDir = path.dirname(PRIMARY_DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_DB_FILE, JSON.stringify(data, null, 2));
    return;
  } catch (err) {
    console.warn(`[Database Warning] Read-only environment detected (${err.code || err.message}). Switching to /tmp fallback.`);
  }

  // Try writing to /tmp directory (writable in Vercel / serverless environments)
  try {
    fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2));
  } catch (tmpErr) {
    console.warn(`[Database Warning] Could not write to /tmp file system (${tmpErr.message}). Data retained in-memory.`);
  }
};

let connectPromise = null;

const connectDB = async () => {
  if (!mongoose) {
    console.log(`[Database] Mongoose package not loaded. Using JSON database storage engine.`);
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) {
    console.log(`[Database] MONGO_URI environment variable not defined. Using JSON database storage engine.`);
    return false;
  }

  if (connectPromise) {
    try {
      await connectPromise;
      return mongoose.connection.readyState === 1;
    } catch (e) {
      return false;
    }
  }

  try {
    mongoose.set('strictQuery', false);
    connectPromise = mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000
    });
    await connectPromise;
    console.log(`[Database] MongoDB Connected Successfully: ${mongoose.connection.host}`);
    return true;
  } catch (err) {
    connectPromise = null;
    console.log(`[Database] MongoDB connection bypassed (${err.message}). Using JSON database engine.`);
    return false;
  }
};

const getStorage = () => {
  const isConnected = Boolean(mongoose && mongoose.connection.readyState === 1);
  return {
    isMongoConnected: isConnected,
    PRIMARY_DB_FILE,
    readJSONDB: () => loadInitialData(),
    writeJSONDB: (data) => safeWriteDB(data)
  };
};

module.exports = { connectDB, getStorage };
