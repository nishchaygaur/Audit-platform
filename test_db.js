const db = require('better-sqlite3')('data/audit.db');
console.log(db.prepare('SELECT * FROM users').all());
