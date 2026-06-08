require('dotenv').config();
const { Client } = require('pg');

async function resetAdmin() {
  const clientConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'ltc_db',
    password: process.env.DB_PASSWORD || 'root',
    port: parseInt(process.env.DB_PORT || '5432'),
  };

  if (process.env.DB_SSL === 'true') {
    clientConfig.ssl = { rejectUnauthorized: false };
  }

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected to ltc_db');
    const res = await client.query("DELETE FROM users WHERE role = 'admin'");
    console.log('Admin user deleted. Rows affected:', res.rowCount);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

resetAdmin();
