import pg from "pg";

const { Pool } = pg;

// NOTA DE SEGURIDAD: Usar la misma connection string que server.js
const connectionString =
    "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function createTable() {
    try {
        const query = `
      CREATE TABLE IF NOT EXISTS user_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID, -- Asumimos que usas UUID de Supabase Auth, o TEXT si es custom
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await pool.query(query);
        console.log("✅ Tabla 'user_tokens' creada o verificada correctamente.");
    } catch (err) {
        console.error("❌ Error creando tabla:", err);
    } finally {
        await pool.end();
    }
}

createTable();
