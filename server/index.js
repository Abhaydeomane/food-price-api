const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;
dotenv.config();
// Parse JSON request bodies
app.use(bodyParser.json());
// Configure morgan to log requests
app.use(morgan('dev'));
app.use(cors({
      origin: '*'
}));

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DB_CONN,
  });
  
  // Test the database connection
  pool.connect((err, client, done) => {
    if (err) {
      console.error('Error connecting to the database', err);
    } else {
      console.log('Connected to the database');
    }
  });

  // Create the users table if it doesn't exist
    pool.query(`
    CREATE TABLE IF NOT EXISTS Organization (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Item (
        id SERIAL PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        description TEXT
    );
    CREATE TABLE IF NOT EXISTS Pricing (
        organization_id INT NOT NULL,
        item_id INT NOT NULL,
        zone VARCHAR(255) NOT NULL,
        base_distance_in_km INT DEFAULT 5,
        km_price NUMERIC(10, 2) DEFAULT 1.5,
        fix_price NUMERIC(10, 2) DEFAULT 10,
        FOREIGN KEY (organization_id) REFERENCES Organization(id),
        FOREIGN KEY (item_id) REFERENCES Item(id),
        PRIMARY KEY (organization_id, item_id, zone)
    );`, (err, result) => {
    if (err) {
    console.error('Error creating the users table', err);
    } else {
    console.log('Users table created successfully');
    }
    });


app.get('/',async(req,res)=>{
  res.status(200).json("server is running");
})

// API endpoint to calculate delivery costs
app.post('/cost', async (req, res) => {
    const { zone, organization_id, total_distance, item_type } = req.body;
  
    if (!zone || !organization_id || !total_distance || !item_type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    try {
      const client = await pool.connect();
  
      // Fetch pricing information from the database
      const pricingResult = await client.query(
        'SELECT km_price, fix_price, base_distance_in_km FROM pricing WHERE organization_id = $1 AND zone = $2',
        [organization_id, zone]
      );
  
      const pricingInfo = pricingResult.rows[0];
  
      if (!pricingInfo) {
        return res.status(404).json({ error: 'Pricing information not found for the specified organization and zone' });
      }
  
      const { km_price, fix_price, base_distance_in_km } = pricingInfo;
  
      let total_price=0;
      // console.log(pricingInfo);
      const fix_p=Number(fix_price)
  
      // Calculate the total price                       
      if (total_distance <= base_distance_in_km) {
        total_price = fix_p;
      } else {
        const extra_distance = total_distance - base_distance_in_km;
        // console.log(typeof(fix_p))
        // console.log(typeof(extra_distance))
        total_price = fix_p + extra_distance*km_price;
      }
  
      client.release();
  
      return res.status(200).json({ total_price });
    } catch (error) {
      console.error('Error executing query', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

app.listen(PORT, () => 
console.log(`Listening at Port ${PORT}`))