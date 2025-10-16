const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      username TEXT UNIQUE,
      role TEXT
    )`
  );

  const seedUsers = [
    {
      name: 'Aman Rajak',
      email: 'aman.rajak@example.com',
      username: 'aman',
      role: 'admin'
    },
    {
      name: 'Sia',
      email: 'sia@example.com',
      username: 'sia',
      role: 'user'
    }
  ];

  seedUsers.forEach((user) => {
    db.get('SELECT id FROM users WHERE username = ?', [user.username], (err, row) => {
      if (err) {
        console.error('Error checking existing user', err.message);
        return;
      }
      if (!row) {
        db.run(
          'INSERT INTO users (name, email, username, role) VALUES (?, ?, ?, ?)',
          [user.name, user.email, user.username, user.role],
          (insertErr) => {
            if (insertErr) {
              console.error('Error seeding user data', insertErr.message);
            }
          }
        );
      }
    });
  });
});

module.exports = db;
