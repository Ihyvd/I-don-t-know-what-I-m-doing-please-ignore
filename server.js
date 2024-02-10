// Importing necessary modules and packages
import express from 'express'; // Express framework for building web applications
import fetch from 'node-fetch'; // Node.js Fetch API for making HTTP requests
import i18next from 'i18next'; // Internationalization framework for localization
import middleware from 'i18next-http-middleware'; // Middleware for i18next to handle HTTP requests
import Backend from 'i18next-fs-backend'; // Backend for i18next to load translations from the filesystem
import sqlite3pkg from 'sqlite3'; // SQLite3 package for SQLite database management
import path from 'path'; // Path module to work with file and directory paths
import { fileURLToPath } from 'url'; // Utility to convert URL to path
import bcrypt from 'bcrypt'; // Bcrypt for hashing passwords
import session from 'express-session'; // Session middleware for Express
import dotenv from 'dotenv'; // Dotenv to load environment variables from .env file
import rateLimit from 'express-rate-limit'; // Express middleware for rate limiting requests
import fs from 'fs'; // File System module to interact with the file system
import http from 'http'; // HTTP module to create HTTP server
import WebSocket, { WebSocketServer } from 'ws'; // WebSocket and its server for real-time communication

// Load environment variables from .env file
dotenv.config();

// Constants and Utility Functions
// Enabling verbose logging for sqlite3 for detailed logging
const { verbose } = sqlite3pkg;
const sqlite3 = verbose();
// Determine the current file and directory name using ES module meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URLs for fetching student data in different languages
const studentDataUrls = [
  "https://schale.gg/data/en/students.json",
  "https://schale.gg/data/cn/students.json",
  "https://schale.gg/data/jp/students.json",
  "https://schale.gg/data/kr/students.json",
  "https://schale.gg/data/th/students.json",
  "https://schale.gg/data/tw/students.json",
  "https://schale.gg/data/vi/students.json",
  "https://schale.gg/data/zh/students.json"
];

// Function to log access attempts to the server with IP and message
function logAccess(ip, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - IP: ${ip} - ${message}\n`;
  fs.appendFileSync(path.join(__dirname, 'access.log'), logMessage);
}

// Middleware to check if a user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(401).send(`Unauthorized`);
  }
}

// Function to ensure the 'image_path' column exists in the 'students' table
function ensureImagePathColumnExists() {
  db.run(`
    ALTER TABLE students ADD COLUMN image_path TEXT;
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('The column image_path already exists.');
      } else {
        console.error('Error adding the image_path column:', err);
      }
    } else {
      console.log('The column image_path was added successfully.');
    }
  });
}

// Function to validate input data against a simple regex pattern
function isValidData(data) {
  return data && /^[\w\s]+$/.test(data);
}

// Initialize Express App
const app = express();

// Middleware Setup
// Parsing JSON bodies of requests
app.use(express.json());
// Serving static files from 'public' directory
app.use(express.static(`public`));
// Session middleware setup with secret from .env and other options
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Note: In production (when I make this online), set secure: true for HTTPS
}));
// i18next middleware for handling localization
app.use(middleware.handle(i18next));

// Rate Limiting for login attempts to prevent brute-force attacks I guess
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5 // limit each IP to 5 login attempts per windowMs
});

// i18next Initialization for localization
i18next
  .use(Backend) // Filesystem backend
  .use(middleware.LanguageDetector) // Language detector
  .init({
    fallbackLng: `en`, // Default language
    backend: {
      loadPath: path.join(__dirname, `/locales/{{lng}}/translation.json`), // Path to translations
    },
  });

// SQLite Database Setup
const db = new sqlite3.Database('./pvp-tracker.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the pvp-tracker database.');
});

// Database Table Creation for storing student data
db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY,
    language_code TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_cn TEXT,
    name_jp TEXT,
    name_kr TEXT,
    name_th TEXT,
    name_tw TEXT,
    name_vi TEXT,
    name_zh TEXT,
    bullet_type TEXT NOT NULL,
    UNIQUE(name_en)
  );
`, (err) => {
    if (err) {
      console.error(`Error creating table:`, err);
      return;
    }
    importStudentData(); // Importing student data after table creation
  });
});

// Endpoint Handlers
// Login endpoint with rate limiting
app.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = process.env.USER_PASSWORD; // Hashed password from .env

  // Authentication check
  if (username === process.env.USER_NAME && bcrypt.compareSync(password, hashedPassword)) {
    req.session.authenticated = true; // Setting session as authenticated
    logAccess(req.ip, `Login successful`);
    res.send(`Logged in successfully.`);
  } else {
    logAccess(req.ip, `Login failed`);
    res.status(401).send(`Login failed`);
  }
});

// Protected endpoint requiring authentication
app.get('/protected', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'protected.html'));
});

// Endpoint to create PvP records table
app.get('/create-pvp-table', (req, res) => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS pvp_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Date TEXT NOT NULL,
      Attacker TEXT NOT NULL,
      Defender TEXT NOT NULL,
      A1 TEXT,
      A2 TEXT,
      A3 TEXT,
      A4 TEXT,
      ASupport1 TEXT,
      ASupport2 TEXT,
      Result TEXT NOT NULL,
      D1 TEXT,
      D2 TEXT,
      D3 TEXT,
      D4 TEXT,
      DSupport1 TEXT,
      DSupport2 TEXT,
      Comments TEXT
    );
  `;

  db.run(createTableSql, function (err) {
    if (err) {
      console.error('Error creating pvp_records table:', err);
      return res.status(500).send('Error creating pvp_records table');
    }

    console.log('Successfully created pvp_records table');
    res.send('Successfully created pvp_records table');
  });
});

// Endpoint to import PvP data from a JSON file
app.get('/import-json', (req, res) => {
  const jsonPath = path.join(__dirname, 'pvp_records.json');

  fs.readFile(jsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).send('Error reading JSON file');
    }

    const entries = JSON.parse(data);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO pvp_records (
          Date, Attacker, Defender, A1, A2, A3, A4, ASupport1, ASupport2, Result, 
          D1, D2, D3, D4, DSupport1, DSupport2, Comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      entries.forEach((entry, index) => {
        insertStmt.run([
          entry.Date, entry.Attacker, entry.Defender, entry.A1, entry.A2,
          entry.A3, entry.A4, entry.ASupport1, entry.ASupport2, entry.Result,
          entry.D1, entry.D2, entry.D3, entry.D4, entry.DSupport1,
          entry.DSupport2, entry.Comments
        ], function (err) {
          if (err) {
            console.error('Error inserting data:', err);
            db.run('ROLLBACK');
            return;
          }
          if (index === entries.length - 1) {
            insertStmt.finalize();
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                res.status(500).send('Error importing JSON data');
              } else {
                console.log('Successfully imported JSON data');
                res.send('Successfully imported JSON data');
              }
            });
          }
        });
      });
    });
  });
});

// API endpoint to get PvP data
app.get('/api/data', (req, res) => {
  db.all("SELECT Date, Attacker, Defender, Result, A1, A2, A3, A4, D1, D2, D3, D4 FROM pvp_records", [], (err, rows) => {
    if (err) {
      console.error('Error fetching PvP data:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(rows);
    }
  });
});

// API endpoint to post new PvP data
app.post('/api/data', (req, res) => {
  const matchData = req.body;
  
  // Validation for match data
  if (!isValidData(matchData.player) || !isValidData(matchData.result)) {
      return res.status(400).json({ error: 'Invalid match data' });
  }

  // Placeholder for actually recording the match data in the database I think
  res.json({ success: 'Match data has been recorded' });
});

// Endpoint to get student data with images
app.get('/students', isAuthenticated, (req, res) => {
  const languageCode = req.query.language || `en`; // Default to English if not specified
  db.all(`SELECT *, image_path FROM students WHERE language_code = ?`, [languageCode], (err, rows) => {
    if (err) {
      res.status(500).json({ error: `Internal server error` });
      return;
    }
    // Mapping over rows to include the full image URL
    const studentsWithImages = rows.map(student => ({
      ...student,
      imageUrl: `/path/to/images/${student.image_path}` // Placeholder for actual image URL
    }));
    res.json({ students: studentsWithImages });
  });
});

// WebSocket Setup for real-time communication
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket event handlers
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('message', (message) => {
        console.log('Received message:', message);
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Data Import Functions
// Asynchronously import student data from URLs
async function importStudentData() {
  for (const url of studentDataUrls) {
    try {
      const response = await fetch(url);
      const students = await response.json();
      const languageCode = url.match(/\/(\w+)\/students\.json/)[1]; // Extracting language code from URL

      students.forEach(student => {
        const studentData = {
          language_code: languageCode,
          name_en: student.Name,
          bullet_type: student.BulletType,
        };

        insertStudentData(studentData);
      });
    } catch (error) {
      console.error(`Failed to import student data:`, error);
    }
  }
}

function insertOrUpdateStudentData(studentData) {
  // Constructing SQL query for inserting or updating student data
  const fields = Object.keys(studentData).join(', ');
  const placeholders = Object.keys(studentData).fill('?').join(', ');
  const updates = Object.keys(studentData)
    .filter(key => key !== 'bullet_type') // Excluding 'bullet_type' from updates
    .map(key => `${key} = excluded.${key}`).join(', ');

    const query = `
        INSERT INTO students (${fields}) 
        VALUES (${placeholders})
        ON CONFLICT(name_en) DO UPDATE SET ${updates};
    `;
  
    db.run(query, [...Object.values(studentData)], function (err) {
      if (err) {
        console.error('Error inserting data:', err);
      }
    });
  }
  
  function insertStudentData(studentData) {
    // Similar to insertOrUpdateStudentData but for new inserts only
    const columns = Object.keys(studentData).join(', ');
    const placeholders = Object.keys(studentData).fill('?').join(', ');
    const values = Object.values(studentData);
  
    const query = `
        INSERT INTO students (${columns}) 
        VALUES (${placeholders})
        ON CONFLICT(name_en) DO UPDATE SET
          name_cn = excluded.name_cn,
          name_jp = excluded.name_jp,
          name_kr = excluded.name_kr,
          name_th = excluded.name_th,
          name_tw = excluded.name_tw,
          name_vi = excluded.name_vi,
          name_zh = excluded.name_zh,
          bullet_type = excluded.bullet_type;
    `;
  
    db.run(query, values, function (err) {
      if (err) {
        console.error('Error inserting data:', err);
      }
    });
  }
  
  // Ensuring 'image_path' column exists upon application initialization
  ensureImagePathColumnExists();
  
  // Function to update student image paths in the database
  function updateStudentImagePaths() {
    // Looping through each student to update their image path
    db.each("SELECT id FROM students", [], (err, row) => {
      if (err) {
        console.error('Error fetching students:', err);
        return;
      }
  
      const imageFilename = row.id + '.webp'; // Assuming .webp format for images
      const imagePath = '/downloaded_images/' + imageFilename; // Constructing image path

      // Updating the database with the new image path
      db.run("UPDATE students SET image_path = ? WHERE id = ?", [imagePath, row.id], (updateErr) => {
        if (updateErr) {
          console.error('Error updating student image path:', updateErr);
        }
      });
    });
  }
  
  updateStudentImagePaths(); // Calling the function to update image paths after setup
  
  // Starting the server
  const PORT = process.env.PORT || 3000; // Server port with fallback to 3000 if not defined
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
