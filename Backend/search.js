const mysql = require('mysql2/promise');

const databases = [
  { name: 'mumbai181920', tables: ['data'] },
  { name: 'mumbai22e', tables: ['data'] },
  { name: 'promdata18', tables: ['mdata'] },
  { name: 'promumbai', tables: ['advmumbai'] },
  // Add more database configurations as needed
];


// Function to execute a query on a database
async function executeQuery(database, table, searchTerm) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: database
  });

  const query = `SELECT * FROM ${table} WHERE MATCH(mobile) AGAINST(? IN BOOLEAN MODE)`;

  try {
    const [rows] = await connection.query(query, [searchTerm]);
    return rows;
  } catch (error) {
    console.error(`Error in database: ${database}, Error: ${error.message}`);
  } finally {
    connection.end();
  }
}

const result = async (searchTerm) => {
  const tasks = [];

  databases.forEach(Element => {
    const { name, tables } = Element;
    tables.map(tableName => tasks.push({ name, tableName }));
  });

  return await Promise.all(tasks.map(task => executeQuery(task.name, task.tableName, searchTerm)));
  
};

module.exports = { result };