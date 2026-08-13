const fs = require('fs');
const path = require('path');
const os = require('os');

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
  if (inMemoryData) return inMemoryData;

  // Try primary DB file
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

let isMongoConnected = false;

const connectDB = async () => {
  if (!mongoose) {
    console.log(`[Database] Mongoose package not loaded. Using JSON database storage engine.`);
    isMongoConnected = false;
    return;
  }
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.log(`[Database] MONGO_URI environment variable not defined. Using JSON database storage engine.`);
    isMongoConnected = false;
    return;
  }
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    isMongoConnected = true;
    console.log(`[Database] MongoDB Connected Successfully: ${mongoose.connection.host}`);
  } catch (err) {
    isMongoConnected = false;
    console.log(`[Database] MongoDB connection bypassed (${err.message}). Using JSON database engine.`);
  }
};

const getStorage = () => {
  return {
    isMongoConnected,
    PRIMARY_DB_FILE,
    readJSONDB: () => loadInitialData(),
    writeJSONDB: (data) => safeWriteDB(data)
  };
};

module.exports = { connectDB, getStorage };
