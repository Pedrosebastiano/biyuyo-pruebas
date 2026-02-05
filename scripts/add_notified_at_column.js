import pg from "pg";

const { Pool } = pg;

const connectionString =
    "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function addNotifiedAtColumn() {
    try {
        const query = `
      ALTER TABLE reminders 
      ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP WITH TIME ZONE;
    `;

        await pool.query(query);
        console.log("✅ Columna 'notified_at' añadida a la tabla 'reminders'.");
    } catch (err) {
        console.error("❌ Error añadiendo columna:", err);
    } finally {
        await pool.end();
    }
}

addNotifiedAtColumn();
