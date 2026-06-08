require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

async function reset() {
  try {
    console.log('Connecting to database and dropping tables...');
    await pool.query(`
      DROP TABLE IF EXISTS attendance CASCADE;
      DROP TABLE IF EXISTS evaluations CASCADE;
      DROP TABLE IF EXISTS schedules CASCADE;
      DROP TABLE IF EXISTS feedback CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS insurance CASCADE;
      DROP TABLE IF EXISTS squad_leaders CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('All existing tables dropped.');

    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE users (
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
        in_current_batch BOOLEAN DEFAULT false,
        undertaking_submitted BOOLEAN DEFAULT false,
        undertaking_signed_name VARCHAR(255),
        undertaking_signed_date VARCHAR(50),
        is_squad_leader BOOLEAN DEFAULT false
      )
    `);

    console.log('Creating documents table...');
    await pool.query(`
      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        url TEXT,
        uploaded_by INT,
        target_role VARCHAR(50)
      )
    `);

    console.log('Creating insurance table...');
    await pool.query(`
      CREATE TABLE insurance (
        id SERIAL PRIMARY KEY,
        prn VARCHAR(100) UNIQUE,
        policy_number VARCHAR(255),
        provider VARCHAR(255)
      )
    `);

    console.log('Creating feedback table...');
    await pool.query(`
      CREATE TABLE feedback (
        id SERIAL PRIMARY KEY,
        user_id INT,
        role VARCHAR(50),
        feedback_text TEXT,
        category VARCHAR(100),
        additional_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating squad_leaders table...');
    await pool.query(`
      CREATE TABLE squad_leaders (
        squad_name VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        prn VARCHAR(255),
        phone VARCHAR(255)
      )
    `);

    console.log('Seeding Super Admin user...');
    const hashedPassword = await bcrypt.hash('123', 10);
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
      ['Super Admin', 'admin@ltc.edu', hashedPassword, 'admin']
    );

    console.log('Database reset completed successfully. Admin login: admin@ltc.edu (password: 123)');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
}

reset();
