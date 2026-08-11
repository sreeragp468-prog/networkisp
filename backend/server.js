const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { connectDB, getStorage } = require('./config/db');
const {
  getAllConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig
} = require('./controllers/networkController');

// Initialize Database connection
connectDB();

const PORT = process.env.PORT || 5000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontent');

// Helper to send JSON response
const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
};

// Helper to serve static files
const serveStatic = (res, filePath, contentType) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
};

// Helper to parse JSON body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
};

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS Preflight OPTIONS
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // Create Express-like req/res wrappers for MVC Controller compatibility
  req.query = parsedUrl.query;
  
  const reqResAdapter = (handler, params = {}) => {
    req.params = params;
    
    const mockRes = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        sendJSON(res, this.statusCode, data);
      }
    };

    const next = (err) => {
      console.error('[Error]', err);
      sendJSON(res, 500, { success: false, message: err.message || 'Internal Server Error' });
    };

    return handler(req, mockRes, next);
  };

  try {
    // API Routes (/api/networks)
    if (pathname === '/api/networks' || pathname === '/api/networks/') {
      if (method === 'GET') {
        return reqResAdapter(getAllConfigs);
      } else if (method === 'POST') {
        req.body = await parseBody(req);
        return reqResAdapter(createConfig);
      }
    }

    // Dynamic Route: /api/networks/:id
    const networkIdMatch = pathname.match(/^\/api\/networks\/([a-zA-Z0-9_\-]+)$/);
    if (networkIdMatch) {
      const id = networkIdMatch[1];
      if (method === 'GET') {
        return reqResAdapter(getConfigById, { id });
      } else if (method === 'PUT') {
        req.body = await parseBody(req);
        return reqResAdapter(updateConfig, { id });
      } else if (method === 'DELETE') {
        return reqResAdapter(deleteConfig, { id });
      }
    }

    // Health Check
    if (pathname === '/api/health') {
      return sendJSON(res, 200, { status: 'OK', message: 'Networking MVC API Server active' });
    }

    // Static File Serving
    let fileRelPath = pathname === '/' ? 'table.html' : pathname.substring(1);
    let targetFile = path.join(FRONTEND_DIR, fileRelPath);

    // Prevent Directory Traversal
    if (!targetFile.startsWith(FRONTEND_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Forbidden');
    }

    const ext = path.extname(targetFile).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'text/plain';
    return serveStatic(res, targetFile, contentType);

  } catch (err) {
    console.error('[Request Handling Error]', err);
    sendJSON(res, 500, { success: false, message: 'Server processing error' });
  }
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Networking MVC API Server running on port ${PORT}`);
  console.log(`📊 Table View: http://localhost:${PORT}/table.html`);
  console.log(`📝 Form Entry: http://localhost:${PORT}/app.html`);
  console.log(`=================================================`);
});
