/**
 * Database adapter — SQLite (local) or PostgreSQL (production).
 * Uses sql.js (pure JS, no native build) for local SQLite.
 */
const fs   = require('fs');
const path = require('path');

let _db = null;
let _sqlJs = null;

async function initSqlite(dbPath) {
  if (!_sqlJs) {
    const initSqlJs = require('sql.js');
    _sqlJs = await initSqlJs();
  }
  let data;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
    return new _sqlJs.Database(data);
  }
  return new _sqlJs.Database();
}

function persist(sqliteDb, dbPath) {
  const data = sqliteDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

let sqliteDb = null;
let dbPath   = null;

async function getDb() {
  const url = process.env.DATABASE_URL || '';

  if (url.startsWith('sqlite:')) {
    if (!sqliteDb) {
      dbPath   = path.resolve(__dirname, '..', url.replace('sqlite:./', '').replace('sqlite:', ''));
      sqliteDb = await initSqlite(dbPath);
    }
    // Return a pg-compatible interface
    return {
      query: (sql, params = []) => {
        try {
          const converted = sql.replace(/\$\d+/g, '?');
          const isSelect  = converted.trim().toUpperCase().startsWith('SELECT');
          if (isSelect) {
            const stmt = sqliteDb.prepare(converted);
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            stmt.free();
            return Promise.resolve({ rows });
          } else {
            sqliteDb.run(converted, params);
            persist(sqliteDb, dbPath);
            return Promise.resolve({ rows: [] });
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }
    };
  }

  // PostgreSQL (production)
  const { Pool } = require('pg');
  if (!_db) _db = new Pool({ connectionString: url });
  return _db;
}

module.exports = { getDb };
