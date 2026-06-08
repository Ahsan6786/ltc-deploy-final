const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config();

const app = express();
const allowedOrigins = [
  "https://ltc-deploy-final.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 5001;
const SECRET = 'ltc-super-secret-key-for-now';

const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'ltc_db',
  password: process.env.DB_PASSWORD || 'root',
  port: parseInt(process.env.DB_PORT || '5432'),
};

if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Create test transporter or mock transporter
let transporter;
const setupMailer = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log(`Nodemailer real SMTP transporter ready (using host ${process.env.SMTP_HOST}).`);
    } catch (smtpErr) {
      console.error("Failed to initialize real SMTP transport:", smtpErr);
    }
  }

  if (!transporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("Nodemailer: Ethereal test transporter ready (real credentials not provided in .env).");
    } catch (err) {
      transporter = {
        sendMail: async (mailOptions) => {
          console.log("=== MOCK EMAIL SENT ===");
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body:\n${mailOptions.text}`);
          console.log("=======================");
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
      console.log("Nodemailer setup failed. Using fallback mock mailer.");
    }
  }
};
setupMailer();

const sendLtcBatchEmail = async (name, email) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '"LTC Administration" <no-reply@ltc.edu>',
    to: email,
    subject: 'Congratulations! You have been selected for LTC batch',
    text: `Dear ${name},

Congratulations! You have been selected to attend the upcoming LTC batch.

Please note that before your student dashboard becomes visible, you must complete the following requirements:
1. Fill out and submit your Insurance Form.
2. Complete and submit your Undertaking Form.

To complete these forms, please log in to your student dashboard. You will be automatically prompted to fill out and submit them. Once both forms are submitted, your regular student dashboard features will become fully visible.

Best regards,
LTC Administration`,
    html: `<div style="font-family: sans-serif; padding: 20px; color: #334155; line-height: 1.6;">
      <h2 style="color: #0f172a;">Congratulations!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>You have been selected to attend the upcoming LTC batch.</p>
      <p>Please note that before your student dashboard becomes visible, you must complete the following requirements:</p>
      <ol>
        <li>Fill out and submit your <strong>Insurance Form</strong>.</li>
        <li>Complete and submit your <strong>Undertaking Form</strong>.</li>
      </ol>
      <p>To complete these forms, please log in to your student dashboard. You will be automatically prompted to fill out and submit them. Once both forms are submitted, your regular student dashboard features will become fully visible.</p>
      <br/>
      <p>Best regards,<br/><strong>LTC Administration</strong></p>
    </div>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email Preview URL: ${previewUrl}`);
    }
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err);
  }
};

// Initialize database schema and Super Admin
const initDB = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100),
        semester VARCHAR(50),
        division VARCHAR(100),
        school VARCHAR(100),
        panel VARCHAR(50),
        is_primary BOOLEAN DEFAULT false,
        prn VARCHAR(100) UNIQUE,
        faculty_id VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        dob VARCHAR(50),
        gender VARCHAR(20),
        program VARCHAR(100),
        year VARCHAR(20),
        designation VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        nri BOOLEAN DEFAULT false,
        red_flag BOOLEAN DEFAULT false,
        squad VARCHAR(50),
        room VARCHAR(50),
        barcode VARCHAR(255),
        in_current_batch BOOLEAN DEFAULT false
      );
    `);

    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS in_current_batch BOOLEAN DEFAULT false;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS undertaking_submitted BOOLEAN DEFAULT false;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS undertaking_signed_name VARCHAR(255);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS undertaking_signed_date VARCHAR(50);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_squad_leader BOOLEAN DEFAULT false;");

    // Create schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        date VARCHAR(50),
        time VARCHAR(50),
        faculty_id INT,
        panel VARCHAR(50)
      );
    `);

    // Create squad_leaders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS squad_leaders (
        squad_name VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        prn VARCHAR(255),
        phone VARCHAR(255)
      );
    `);

    // Create attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        schedule_id INT,
        student_id INT,
        status VARCHAR(50)
      );
    `);

    // Create evaluations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        student_id INT,
        faculty_id INT,
        schedule_id INT,
        marks INT,
        remarks TEXT,
        report_url TEXT,
        photo_url TEXT,
        marking_scheme VARCHAR(50)
      );
    `);

    // Create documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        url TEXT,
        uploaded_by INT,
        target_role VARCHAR(50)
      );
    `);

    // Create insurance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insurance (
        id SERIAL PRIMARY KEY,
        prn VARCHAR(100) UNIQUE,
        policy_number VARCHAR(255),
        provider VARCHAR(255)
      );
    `);

    // Create feedback table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INT,
        role VARCHAR(50),
        feedback_text TEXT,
        category VARCHAR(100),
        additional_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create system_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value VARCHAR(255)
      );
    `);

    await pool.query(`
      INSERT INTO system_settings (key, value)
      VALUES ('squads_locked', 'false')
      ON CONFLICT (key) DO NOTHING;
    `);

    const adminQuery = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    if (adminQuery.rowCount === 0) {
      const hashedPassword = await bcrypt.hash('123', 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ['Super Admin', 'admin@ltc.edu', hashedPassword, 'admin']
      );
      console.log('Super Admin initialized in PostgreSQL: admin@ltc.edu (123)');
    } else {
      console.log('PostgreSQL database ready. Super Admin already exists.');
    }
  } catch (err) {
    console.error('Database Initialization Error:', err);
  }
};
initDB();

// Middleware for auth
const authMiddleware = (roles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Unauthorized role' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userQuery.rowCount === 0) return res.status(400).json({ message: 'User not found' });

    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, department: user.department, panel: user.panel },
      SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department,
        panel: user.panel,
        division: user.division,
        school: user.school,
        squad: user.squad,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Add Faculty
app.post('/api/admin/faculty', authMiddleware(['admin']), async (req, res) => {
  const { name, email, department, division, school, panel, is_primary, gender } = req.body;
  try {
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newFaculty = await pool.query(
      "INSERT INTO users (name, email, password, role, department, division, school, panel, is_primary, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, name, email, role, department, division, school, panel, is_primary, gender",
      [
        name,
        email,
        hashedPassword,
        'faculty',
        department,
        division || null,
        school || null,
        panel || null,
        is_primary === true || is_primary === 'true',
        gender || null,
      ]
    );

    res.status(201).json({
      message: 'Faculty created successfully. Default password is password123.',
      faculty: newFaculty.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'User already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin/Faculty Route: Add Student
app.post('/api/users/student', authMiddleware(['admin', 'faculty']), async (req, res) => {
  const { name, email, semester, department, division, school, panel, prn, gender } = req.body;
  try {
    const defaultPassword = 'student123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Auto-generate PRN if not supplied
    const finalPrn = prn && prn.trim() ? prn.trim() : 'PRN-STU-' + Date.now() + Math.floor(Math.random() * 1000);

    const newStudent = await pool.query(
      "INSERT INTO users (name, email, password, role, semester, department, division, school, panel, prn, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, name, email, role, semester, department, division, school, panel, prn, gender",
      [
        name,
        email,
        hashedPassword,
        'student',
        semester,
        department,
        division || null,
        school || null,
        panel || null,
        finalPrn,
        gender || null,
      ]
    );

    res.status(201).json({
      message: 'Student created successfully. Default password is student123.',
      student: newStudent.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'User already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Faculty Dashboard Routes
app.get('/api/faculty/dashboard', authMiddleware(['faculty']), async (req, res) => {
  try {
    const panels = (req.user.panel || '').split(',').map((p) => p.trim()).filter(Boolean);
    let myStudents;
    if (panels.length > 0) {
      myStudents = await pool.query(
        "SELECT id, name, email, semester, department, panel, nri, red_flag FROM users WHERE role = 'student' AND panel = ANY($1)",
        [panels]
      );
    } else {
      myStudents = await pool.query(
        "SELECT id, name, email, semester, department, panel, nri, red_flag FROM users WHERE role = 'student' AND department = $1",
        [req.user.department]
      );
    }

    // Fetch the faculty's complete profile
    const facultyUser = await pool.query(
      "SELECT id, name, email, role, department, division, school, panel, squad FROM users WHERE id = $1",
      [req.user.id]
    );
    
    let squadLeader = null;
    let squadStudents = [];
    const facultyInfo = facultyUser.rows[0];
    const squadName = facultyInfo?.squad;
    
    if (squadName) {
      const leaderRes = await pool.query("SELECT * FROM squad_leaders WHERE squad_name = $1", [squadName]);
      if (leaderRes.rowCount > 0) squadLeader = leaderRes.rows[0];
      
      const squadStudentsRes = await pool.query(
        "SELECT id, name, email, semester, department, panel, nri, red_flag, gender, prn, phone FROM users WHERE role = 'student' AND squad = $1",
        [squadName]
      );
      squadStudents = squadStudentsRes.rows;
    }

    res.json({ 
      message: 'Welcome Faculty', 
      data: myStudents.rows, 
      facultyInfo, 
      squadLeader, 
      squadStudents 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/faculty/toggle-red-flag', authMiddleware(['faculty']), async (req, res) => {
  const { student_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET red_flag = NOT COALESCE(red_flag, false) WHERE id = $1 RETURNING red_flag",
      [student_id]
    );
    res.json({ success: true, red_flag: result.rows[0].red_flag });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle red flag', error: err.message });
  }
});

// Student Dashboard Route
app.get('/api/student/dashboard', authMiddleware(['student']), async (req, res) => {
  try {
    const myData = await pool.query(
      `SELECT u.id, u.name, u.email, u.semester, u.department, u.prn, u.red_flag,
              u.in_current_batch, u.undertaking_submitted, u.undertaking_signed_name, u.undertaking_signed_date,
              (i.prn IS NOT NULL) as insured, i.policy_number, i.provider
       FROM users u
       LEFT JOIN insurance i ON u.prn = i.prn
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ message: 'Welcome Student', data: myData.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Dashboard Route
app.get('/api/admin/dashboard', authMiddleware(['admin']), async (req, res) => {
  try {
    const allFaculties = await pool.query("SELECT id, name, email, department FROM users WHERE role = 'faculty'");
    const allStudents = await pool.query("SELECT id, name, email, semester, department FROM users WHERE role = 'student'");
    res.json({ message: 'Welcome Admin', faculties: allFaculties.rows, students: allStudents.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Users Route
app.get('/api/admin/users', authMiddleware(['admin']), async (req, res) => {
  try {
    const allUsers = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.semester, 
             u.division, u.school, u.panel, u.is_primary, u.prn,
             u.squad, u.room, u.barcode, u.in_current_batch,
             u.undertaking_submitted, u.undertaking_signed_name, u.undertaking_signed_date,
             u.is_squad_leader, u.phone,
             (i.prn IS NOT NULL) as insured, i.policy_number, i.provider
      FROM users u
      LEFT JOIN insurance i ON u.prn = i.prn
      ORDER BY u.id ASC
    `);
    const squadLeadersRes = await pool.query("SELECT * FROM squad_leaders");
    res.json({ users: allUsers.rows, squadLeaders: squadLeadersRes.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/api/admin/update-panel', authMiddleware(['admin']), async (req, res) => {
  const { user_id, panel } = req.body;
  try {
    await pool.query("UPDATE users SET panel = $1 WHERE id = $2", [panel, user_id]);
    res.json({ message: 'Panel successfully updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/api/admin/update-division', authMiddleware(['admin']), async (req, res) => {
  const { user_id, division } = req.body;
  try {
    await pool.query("UPDATE users SET division = $1 WHERE id = $2", [division || null, user_id]);
    res.json({ message: 'Division successfully updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Update Insurance Status
app.put('/api/admin/insurance', authMiddleware(['admin']), async (req, res) => {
  const { user_id, insurance } = req.body;
  try {
    const userRes = await pool.query("SELECT prn FROM users WHERE id = $1", [user_id]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    const prn = userRes.rows[0].prn;
    if (!prn) return res.status(400).json({ message: 'User has no PRN assigned. Cannot update insurance.' });

    if (insurance) {
      await pool.query(
        "INSERT INTO insurance (prn, policy_number, provider) VALUES ($1, $2, $3) ON CONFLICT (prn) DO NOTHING",
        [prn, 'POLICY-' + user_id, 'LTC Provider']
      );
    } else {
      await pool.query("DELETE FROM insurance WHERE prn = $1", [prn]);
    }
    res.json({ message: 'Insurance status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Bulk Upload
app.post('/api/admin/bulk-upload', authMiddleware(['admin']), async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users)) {
    return res.status(400).json({ message: 'Users must be an array' });
  }

  try {
    const results = [];
    const errors = [];

    for (const u of users) {
      try {
        let password = 'student123';
        if (u.role === 'faculty') password = 'password123';
        else if (u.role === 'ltc_member') password = 'ltc123';
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
          `INSERT INTO users (
            name, email, password, role, department, semester, 
            division, school, panel, is_primary, prn, faculty_id, 
            phone, dob, gender, program, year, designation, status, nri
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            u.name || u.full_name,
            u.email,
            hashedPassword,
            (u.role || 'student').toLowerCase(),
            u.department || null,
            u.semester || u.year || null,
            u.division || null,
            u.school || null,
            (u.panel || '').trim().toUpperCase() || null,
            u.is_primary === 'true' || u.is_primary === true || u.role === 'primary',
            u.prn || null,
            u.faculty_id || null,
            u.phone || null,
            u.dob || null,
            u.gender || null,
            u.program || null,
            u.year || u.semester || null,
            u.designation || null,
            u.status || 'active',
            u.nri === true ||
              u.nri === 1 ||
              String(u.nri).toLowerCase().trim() === 'yes' ||
              String(u.nri).toLowerCase().trim() === 'true' ||
              String(u.nri).toLowerCase().trim() === '1',
          ]
        );
        results.push(u.email);
      } catch (err) {
        errors.push({ email: u.email, error: err.message });
      }
    }

    res.status(201).json({ message: `Successfully added ${results.length} users.`, results, errors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Auto Allocate Rooms and Squads
app.post('/api/admin/auto-allocate', authMiddleware(['admin']), async (req, res) => {
  try {
    const studentsRes = await pool.query("SELECT id, gender FROM users WHERE role = 'student'");
    let students = studentsRes.rows;

    students = students.sort(() => Math.random() - 0.5);

    let currentRoomMale = 1;
    let roomMaleCount = 0;

    let currentRoomFemale = 1;
    let roomFemaleCount = 0;

    let currentRoomUnans = 1;
    let roomUnansCount = 0;

    let currentSquad = 1;
    let squadCount = 0;

    const updatePromises = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];

      if (squadCount >= 60) {
        currentSquad++;
        squadCount = 0;
      }
      const squadName = `Squad-${currentSquad}`;
      squadCount++;

      let roomName = '';
      if (s.gender && s.gender.toLowerCase() === 'male') {
        if (roomMaleCount >= 40) {
          currentRoomMale++;
          roomMaleCount = 0;
        }
        roomName = `M-${currentRoomMale}`;
        roomMaleCount++;
      } else if (s.gender && s.gender.toLowerCase() === 'female') {
        if (roomFemaleCount >= 40) {
          currentRoomFemale++;
          roomFemaleCount = 0;
        }
        roomName = `F-${currentRoomFemale}`;
        roomFemaleCount++;
      } else {
        if (roomUnansCount >= 40) {
          currentRoomUnans++;
          roomUnansCount = 0;
        }
        roomName = `U-${currentRoomUnans}`;
        roomUnansCount++;
      }

      const barcode = `LTC-${s.id}-${Math.floor(Math.random() * 10000)}`;

      updatePromises.push(
        pool.query("UPDATE users SET squad = $1, room = $2, barcode = $3 WHERE id = $4", [
          squadName,
          roomName,
          barcode,
          s.id,
        ])
      );
    }

    await Promise.all(updatePromises);
    res.json({ message: `Successfully allocated and generated barcodes for ${students.length} students.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Bulk Upload Insurance (Supports both endpoints and body shapes)
const handleBulkInsurance = async (req, res) => {
  const data = req.body.users || req.body.insuranceData;
  if (!Array.isArray(data)) {
    return res.status(400).json({ message: 'Data must be an array of records under users or insuranceData key.' });
  }
  try {
    const results = [];
    const errors = [];
    for (const item of data) {
      try {
        const prn = String(item.prn || item.PRN || '').trim();
        if (!prn) throw new Error('Missing PRN');

        await pool.query(
          "INSERT INTO insurance (prn, policy_number, provider) VALUES ($1, $2, $3) ON CONFLICT (prn) DO UPDATE SET policy_number = EXCLUDED.policy_number, provider = EXCLUDED.provider",
          [prn, item.policy_number || item.policy || 'POLICY-BULK', item.provider || 'LTC Provider']
        );
        results.push(prn);
      } catch (err) {
        errors.push({ prn: item.prn, error: err.message });
      }
    }
    res.status(201).json({ message: `Processed ${results.length} insurance records.`, results, errors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

app.post('/api/admin/bulk-insurance', authMiddleware(['admin']), handleBulkInsurance);
app.post('/api/admin/insurance-bulk-upload', authMiddleware(['admin']), handleBulkInsurance);

// Admin Route: User by Barcode
app.get('/api/admin/user-by-barcode', authMiddleware(['admin', 'faculty', 'ltc_member']), async (req, res) => {
  const { barcode } = req.query;
  try {
    const user = await pool.query(
      `SELECT id, name, email, role, department, division, school, panel, squad, room, barcode 
       FROM users WHERE barcode = $1`,
      [barcode]
    );
    if (user.rowCount === 0) return res.status(404).json({ message: 'User not found or invalid barcode.' });
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Public verify endpoint
app.get('/api/verify', async (req, res) => {
  const { barcode } = req.query;
  try {
    const user = await pool.query(
      `SELECT id, name, email, department, squad, room, barcode 
       FROM users WHERE barcode = $1`,
      [barcode]
    );
    if (user.rowCount === 0) return res.status(404).json({ message: 'User not found or invalid barcode.' });
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Documents Management
app.post('/api/documents', authMiddleware(['admin', 'faculty']), async (req, res) => {
  const { name, url, target_role } = req.body;
  try {
    const doc = await pool.query(
      "INSERT INTO documents (name, url, uploaded_by, target_role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, url, req.user.id, target_role]
    );
    res.json({ message: 'Document uploaded', document: doc.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/documents', authMiddleware(), async (req, res) => {
  try {
    let docs;
    if (req.user.role === 'admin') {
      docs = await pool.query("SELECT * FROM documents");
    } else {
      docs = await pool.query("SELECT * FROM documents WHERE target_role = $1 OR target_role = 'all'", [req.user.role]);
    }
    res.json({ documents: docs.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Scheduling
app.post('/api/faculty/schedule', authMiddleware(['faculty']), async (req, res) => {
  const { title, date, time, panel } = req.body;
  try {
    await pool.query(
      "INSERT INTO schedules (title, date, time, faculty_id, panel) VALUES ($1, $2, $3, $4, $5)",
      [title, date, time, req.user.id, panel]
    );
    res.json({ message: 'Schedule created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.delete('/api/faculty/schedule/:id', authMiddleware(['faculty']), async (req, res) => {
  try {
    const { id } = req.params;
    const check = await pool.query("SELECT * FROM schedules WHERE id = $1 AND faculty_id = $2", [id, req.user.id]);
    if (check.rowCount === 0) return res.status(403).json({ message: 'Unauthorized or schedule not found' });

    await pool.query("DELETE FROM attendance WHERE schedule_id = $1", [id]);
    await pool.query("DELETE FROM evaluations WHERE schedule_id = $1", [id]);
    await pool.query("DELETE FROM schedules WHERE id = $1", [id]);

    res.json({ message: 'Schedule and associated records deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/schedules', authMiddleware(), async (req, res) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = await pool.query("SELECT * FROM schedules ORDER BY date DESC, time DESC");
    } else if (req.user.role === 'faculty') {
      query = await pool.query("SELECT * FROM schedules WHERE faculty_id = $1 ORDER BY date DESC, time DESC", [req.user.id]);
    } else {
      query = await pool.query("SELECT * FROM schedules WHERE panel = 'ALL' OR panel = $1", [req.user.panel || 'Unassigned']);
    }
    res.json({ schedules: query.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Evaluations
app.post('/api/faculty/evaluate', authMiddleware(['admin', 'faculty']), async (req, res) => {
  const { student_id, schedule_id, marks, remarks, report_url, photo_url, marking_scheme } = req.body;
  try {
    await pool.query(
      "INSERT INTO evaluations (student_id, faculty_id, schedule_id, marks, remarks, report_url, photo_url, marking_scheme) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [student_id, req.user.id, schedule_id, marks, remarks, report_url || null, photo_url || null, marking_scheme || null]
    );
    res.json({ message: 'Evaluation submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/faculty/evaluations', authMiddleware(['admin', 'faculty']), async (req, res) => {
  try {
    let evals;
    if (req.user.role === 'admin') {
      evals = await pool.query("SELECT * FROM evaluations");
    } else {
      evals = await pool.query("SELECT * FROM evaluations WHERE faculty_id = $1", [req.user.id]);
    }
    res.json({ evaluations: evals.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Attendance
app.get('/api/faculty/attendance_records', authMiddleware(['admin', 'faculty']), async (req, res) => {
  try {
    let att;
    if (req.user.role === 'admin') {
      att = await pool.query("SELECT * FROM attendance");
    } else {
      att = await pool.query(
        `SELECT a.* 
         FROM attendance a
         JOIN schedules s ON a.schedule_id = s.id
         WHERE s.faculty_id = $1`,
        [req.user.id]
      );
    }
    res.json({ records: att.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/faculty/attendance', authMiddleware(['admin', 'faculty']), async (req, res) => {
  const { schedule_id, student_id, status } = req.body;
  try {
    await pool.query(
      "INSERT INTO attendance (schedule_id, student_id, status) VALUES ($1, $2, $3)",
      [schedule_id, student_id, status]
    );
    res.json({ message: 'Attendance marked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Assign Student Panel
app.put('/api/faculty/assign-panel', authMiddleware(['faculty']), async (req, res) => {
  const { student_id, panel } = req.body;
  try {
    await pool.query("UPDATE users SET panel = $1 WHERE id = $2 AND role = 'student'", [panel, student_id]);
    res.json({ message: 'Panel updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Student Facing API Routes
app.get('/api/student/schedules', authMiddleware(['student']), async (req, res) => {
  try {
    const schedules = await pool.query(
      "SELECT * FROM schedules WHERE panel = 'ALL' OR panel = $1",
      [req.user.panel || 'Unassigned']
    );
    res.json({ schedules: schedules.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/student/attendance', authMiddleware(['student']), async (req, res) => {
  try {
    const att = await pool.query(
      `SELECT a.status, s.title, s.date 
       FROM attendance a 
       JOIN schedules s ON a.schedule_id = s.id 
       WHERE a.student_id = $1`,
      [req.user.id]
    );
    res.json({ attendance: att.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/student/evaluations', authMiddleware(['student']), async (req, res) => {
  try {
    const evals = await pool.query(
      `SELECT e.*, s.title as activity_title 
       FROM evaluations e
       LEFT JOIN schedules s ON e.schedule_id = s.id
       WHERE e.student_id = $1`,
      [req.user.id]
    );
    res.json({ evaluations: evals.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile Management
app.get('/api/me', authMiddleware(), async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, email, role, department, semester, division, school, panel, is_primary FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/api/me', authMiddleware(), async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = userResult.rows[0];

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required.' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect current password.' });

      const hashedNew = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET name = $1, password = $2 WHERE id = $3", [name || user.name, hashedNew, req.user.id]);
    } else {
      await pool.query("UPDATE users SET name = $1 WHERE id = $2", [name || user.name, req.user.id]);
    }
    res.json({ message: 'Profile successfully updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Feedback Routes
app.post('/api/feedback', authMiddleware(['student', 'faculty', 'ltc_member']), async (req, res) => {
  const { feedback_text, category, additional_notes } = req.body;
  try {
    await pool.query(
      "INSERT INTO feedback (user_id, role, feedback_text, category, additional_notes) VALUES ($1, $2, $3, $4, $5)",
      [req.user.id, req.user.role, feedback_text, category || 'General', additional_notes || null]
    );
    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/admin/feedback', authMiddleware(['admin']), async (req, res) => {
  const { user_id } = req.query;
  try {
    let query = `SELECT f.*, u.name, u.email 
                 FROM feedback f 
                 JOIN users u ON f.user_id = u.id`;
    let params = [];
    if (user_id) {
      query += ` WHERE f.user_id = $1`;
      params.push(user_id);
    }
    query += ` ORDER BY f.created_at DESC`;

    const feedback = await pool.query(query, params);
    res.json({ feedback: feedback.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// LTC Member Dashboard & Stats API
app.get('/api/ltc/dashboard', authMiddleware(['ltc_member']), async (req, res) => {
  try {
    const totalStudentsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
    const totalSquadsRes = await pool.query("SELECT COUNT(DISTINCT squad) FROM users WHERE role = 'student' AND squad IS NOT NULL");
    const totalRoomsRes = await pool.query("SELECT COUNT(DISTINCT room) FROM users WHERE role = 'student' AND room IS NOT NULL");
    const nriCountRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student' AND nri = true");
    const redFlagCountRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student' AND red_flag = true");

    const studentsRes = await pool.query(
      "SELECT id, name, email, semester, department, division, school, panel, squad, room, barcode, nri, red_flag, is_squad_leader, phone, prn, gender FROM users WHERE role = 'student' ORDER BY id ASC"
    );

    const docRes = await pool.query("SELECT * FROM documents WHERE target_role = 'all' OR target_role = 'faculty'");

    const squadLeadersRes = await pool.query("SELECT * FROM squad_leaders");

    res.json({
      stats: {
        totalStudents: parseInt(totalStudentsRes.rows[0].count),
        totalSquads: parseInt(totalSquadsRes.rows[0].count),
        totalRooms: parseInt(totalRoomsRes.rows[0].count),
        nriCount: parseInt(nriCountRes.rows[0].count),
        redFlagCount: parseInt(redFlagCountRes.rows[0].count),
      },
      students: studentsRes.rows,
      documents: docRes.rows,
      squadLeaders: squadLeadersRes.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Squad Leader details API
app.put('/api/ltc/squad-leader', authMiddleware(['ltc_member']), async (req, res) => {
  const { squadName, name, email, prn, phone } = req.body;
  try {
    if (!squadName) {
      return res.status(400).json({ message: 'Squad name is required.' });
    }
    await pool.query(
      `INSERT INTO squad_leaders (squad_name, name, email, prn, phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (squad_name) 
       DO UPDATE SET 
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         prn = EXCLUDED.prn,
         phone = EXCLUDED.phone`,
      [squadName, name || '', email || '', prn || '', phone || '']
    );
    res.json({ message: 'Squad leader details updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Reset Database (Wipes all data except the admin user itself)
app.post('/api/admin/reset-database', authMiddleware(['admin']), async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE role != 'admin'");
    await pool.query("DELETE FROM schedules");
    await pool.query("DELETE FROM attendance");
    await pool.query("DELETE FROM evaluations");
    await pool.query("DELETE FROM feedback");
    await pool.query("DELETE FROM documents");
    await pool.query("DELETE FROM insurance");
    await pool.query("DELETE FROM squad_leaders");
    res.json({ message: 'All student, faculty, and LTC member records have been successfully cleared from the database.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset database', error: err.message });
  }
});

// Admin Route: Get Current Batch
app.get('/api/admin/current-batch', authMiddleware(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department, u.semester, 
              u.division, u.school, u.panel, u.is_primary, u.prn,
              u.squad, u.room, u.barcode, u.in_current_batch,
              u.undertaking_submitted, u.undertaking_signed_name, u.undertaking_signed_date,
              (i.prn IS NOT NULL) as insured, i.policy_number, i.provider
       FROM users u
       LEFT JOIN insurance i ON u.prn = i.prn
       WHERE u.role = 'student' AND u.in_current_batch = true
       ORDER BY u.id ASC`
    );
    res.json({ students: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Set Current Batch from bulk upload lists (PRNs or Emails)
app.post('/api/admin/set-current-batch', authMiddleware(['admin']), async (req, res) => {
  const { identifiers, matchType } = req.body;
  if (!Array.isArray(identifiers)) {
    return res.status(400).json({ message: 'identifiers must be an array of strings' });
  }
  try {
    await pool.query("UPDATE users SET in_current_batch = false WHERE role = 'student'");

    let matchQuery;
    if (matchType === 'prn') {
      matchQuery = "SELECT id, name, email FROM users WHERE role = 'student' AND prn = ANY($1)";
    } else {
      matchQuery = "SELECT id, name, email FROM users WHERE role = 'student' AND email = ANY($1)";
    }

    const matches = await pool.query(matchQuery, [identifiers]);

    if (matches.rowCount > 0) {
      const matchedIds = matches.rows.map(r => r.id);
      await pool.query("UPDATE users SET in_current_batch = true WHERE id = ANY($1)", [matchedIds]);
      
      for (const student of matches.rows) {
        sendLtcBatchEmail(student.name, student.email);
      }
    }

    res.json({
      message: `Successfully set current LTC batch with ${matches.rowCount} students and sent notification emails.`,
      matchedCount: matches.rowCount,
      matchedList: matches.rows.map(r => r.prn || r.email)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Toggle student batch inclusion individually
app.put('/api/admin/toggle-student-batch', authMiddleware(['admin']), async (req, res) => {
  const { user_id, in_batch } = req.body;
  try {
    const userQuery = await pool.query("SELECT id, name, email, role, in_current_batch FROM users WHERE id = $1", [user_id]);
    if (userQuery.rowCount === 0) return res.status(404).json({ message: 'User not found.' });
    
    const user = userQuery.rows[0];
    
    if (in_batch && user.role === 'student' && !user.in_current_batch) {
      await pool.query("UPDATE users SET in_current_batch = true WHERE id = $1", [user_id]);
      sendLtcBatchEmail(user.name, user.email);
    } else {
      await pool.query("UPDATE users SET in_current_batch = $1 WHERE id = $2", [in_batch, user_id]);
    }
    res.json({ message: 'Batch status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Clear Current LTC Batch
app.post('/api/admin/clear-current-batch', authMiddleware(['admin']), async (req, res) => {
  try {
    await pool.query("UPDATE users SET in_current_batch = false WHERE role = 'student'");
    res.json({ message: 'All students removed from current LTC batch successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Student submission: Insurance Form
app.post('/api/student/submit-insurance', authMiddleware(['student']), async (req, res) => {
  const { policy_number, provider } = req.body;
  const studentId = req.user.id;
  try {
    const userRes = await pool.query("SELECT prn FROM users WHERE id = $1", [studentId]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    let prn = userRes.rows[0].prn;
    if (!prn) {
      prn = 'PRN-STU-' + studentId;
      await pool.query("UPDATE users SET prn = $1 WHERE id = $2", [prn, studentId]);
    }

    await pool.query(
      "INSERT INTO insurance (prn, policy_number, provider) VALUES ($1, $2, $3) ON CONFLICT (prn) DO UPDATE SET policy_number = EXCLUDED.policy_number, provider = EXCLUDED.provider",
      [prn, policy_number || 'POLICY-' + studentId, provider || 'Student Submitted']
    );
    res.json({ message: 'Insurance details submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Student submission: Undertaking Form
app.post('/api/student/submit-undertaking', authMiddleware(['student']), async (req, res) => {
  const studentId = req.user.id;
  const { signedName, signedDate } = req.body;
  try {
    await pool.query(
      "UPDATE users SET undertaking_submitted = true, undertaking_signed_name = $1, undertaking_signed_date = $2 WHERE id = $3 AND role = 'student'",
      [signedName, signedDate, studentId]
    );
    res.json({ message: 'Undertaking submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// Admin Route: Get Squad Allocation Details
app.get('/api/admin/squad-allocation-state', authMiddleware(['admin']), async (req, res) => {
  try {
    const lockCheck = await pool.query("SELECT value FROM system_settings WHERE key = 'squads_locked'");
    const isLocked = lockCheck.rowCount > 0 && lockCheck.rows[0].value === 'true';

    // Get current batch students
    const studentsRes = await pool.query(
      "SELECT id, name, email, gender, prn, squad, role, in_current_batch, is_squad_leader, phone FROM users WHERE role = 'student' AND in_current_batch = true ORDER BY name ASC"
    );

    // Get current batch faculties
    const facultyRes = await pool.query(
      "SELECT id, name, email, department, squad, role, in_current_batch FROM users WHERE role = 'faculty' AND in_current_batch = true ORDER BY name ASC"
    );

    const squadLeadersRes = await pool.query("SELECT * FROM squad_leaders");

    res.json({
      locked: isLocked,
      students: studentsRes.rows,
      faculties: facultyRes.rows,
      squadLeaders: squadLeadersRes.rows
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Lock Squad Allocation
app.post('/api/admin/lock-squads', authMiddleware(['admin']), async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO system_settings (key, value) VALUES ('squads_locked', 'true') ON CONFLICT (key) DO UPDATE SET value = 'true'"
    );
    res.json({ message: 'Squad allocation has been locked successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Unlock Squad Allocation
app.post('/api/admin/unlock-squads', authMiddleware(['admin']), async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO system_settings (key, value) VALUES ('squads_locked', 'false') ON CONFLICT (key) DO UPDATE SET value = 'false'"
    );
    res.json({ message: 'Squad allocation has been unlocked successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Route: Shuffle Squads
app.post('/api/admin/shuffle-squads', authMiddleware(['admin']), async (req, res) => {
  try {
    const lockCheck = await pool.query("SELECT value FROM system_settings WHERE key = 'squads_locked'");
    const isLocked = lockCheck.rowCount > 0 && lockCheck.rows[0].value === 'true';
    if (isLocked) {
      return res.status(400).json({ message: 'Squad allocation is locked and cannot be reshuffled.' });
    }

    const studentsRes = await pool.query(
      "SELECT id, name, email, gender, role FROM users WHERE role = 'student' AND in_current_batch = true"
    );
    const students = studentsRes.rows;

    const facultyRes = await pool.query(
      "SELECT id, name, email, role FROM users WHERE role = 'faculty' AND in_current_batch = true"
    );
    const faculties = facultyRes.rows;

    const squadNames = ['Surya', 'Aditya', 'Ravi', 'Divakar', 'Mitra', 'Martand', 'Dinkar', 'Prabhakar', 'Bhaskar', 'Tejonidhi'];

    // Fisher-Yates Shuffle
    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    // Separate girls and others
    const girls = students.filter(s => s.gender && s.gender.toLowerCase() === 'female');
    const others = students.filter(s => !s.gender || s.gender.toLowerCase() !== 'female');

    shuffle(girls);
    shuffle(others);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear squads for students and faculty not in the current active batch
      await client.query("UPDATE users SET squad = NULL WHERE in_current_batch = false OR in_current_batch IS NULL");

      // Distribute girls
      for (let idx = 0; idx < girls.length; idx++) {
        const squad = squadNames[idx % 10];
        await client.query("UPDATE users SET squad = $1 WHERE id = $2", [squad, girls[idx].id]);
      }

      // Distribute others starting from idx = girls.length
      const startIdx = girls.length;
      for (let idx = 0; idx < others.length; idx++) {
        const squad = squadNames[(startIdx + idx) % 10];
        await client.query("UPDATE users SET squad = $1 WHERE id = $2", [squad, others[idx].id]);
      }

      // Handle faculty distribution
      // Clear squads for all faculty members first
      await client.query("UPDATE users SET squad = NULL WHERE role = 'faculty'");

      shuffle(faculties);
      for (let idx = 0; idx < faculties.length; idx++) {
        if (idx < 20) {
          const squadIdx = Math.floor(idx / 2);
          const squad = squadNames[squadIdx];
          await client.query("UPDATE users SET squad = $1 WHERE id = $2", [squad, faculties[idx].id]);
        } else {
          // Any extra faculties above 20 remain unassigned (squad = NULL)
          await client.query("UPDATE users SET squad = NULL WHERE id = $1", [faculties[idx].id]);
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Squad allocation completed successfully.' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error during shuffling', error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
