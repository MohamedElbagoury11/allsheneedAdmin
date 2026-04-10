const { createConnection } = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
  try {
    const connection = await createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    });

    const [products] = await connection.execute('SELECT COUNT(*) as count FROM product');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM category');
    
    console.log('--- DB DATA SUMMARY ---');
    console.log('Products:', products[0].count);
    console.log('Categories:', categories[0].count);
    
    await connection.end();
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
  }
}

checkData();
