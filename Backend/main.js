const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const cors = require('cors');
const search = require('./search');

const app = express();
const port = 4000;
const secretKey = 'your-secret-key'; // Replace with a strong secret key

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cusers'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err);
  } else {
    console.log('Connected to the database');
  }
});


app.post('/data', async (req,res)=>{
  const {searchTerm} = req.body;
  let result = [...new Set([].concat(...(await search.result(searchTerm)).filter((db) => db.length>0)))];
  res.json({result});
  // console.log(result)
  const keyValueCounts = {};
  result.forEach((obj) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (!keyValueCounts[key]) {
        keyValueCounts[key] = {};
      }
      if (value !== null) {
        if (!keyValueCounts[key][value]) {
          keyValueCounts[key][value] = 0;
        }
        keyValueCounts[key][value]++;
      }
    });
  });

  // Determine majority values (ignoring null)
  const majorityValues = {};
  Object.entries(keyValueCounts).forEach(([key, valueCounts]) => {
    let maxCount = 0;
    let majorityValue;
    Object.entries(valueCounts).forEach(([value, count]) => {
      if (count > maxCount) {
        maxCount = count;
        majorityValue = value;
      }
    });
    majorityValues[key] = majorityValue;
  });

  result = [majorityValues].filter((row)=>Object.keys(row).length > 0);
  // console.log(result)

});


app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find the user based on email
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      return res.status(500).json({ error: 'An error occurred' });
    }

    const user = results[0];

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create and sign a JWT token
    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: req.body.remember ? '7h' : '1h', });

    res.json({ token });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

