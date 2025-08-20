const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function runMigrations() {
    try {
        console.log('Starting database migrations...');

        const migrationDir = path.join(__dirname, '../migrations');
        const migrationFiles = fs.readdirSync(migrationDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const migrationPath = path.join(migrationDir, file);
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

            await pool.query(migrationSQL);
            console.log(`Completed migration: ${file}`);
        }

        console.log('All migrations completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
