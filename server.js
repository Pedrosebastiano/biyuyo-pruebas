// server.js (Modo Supabase + Render Ready)
import express from "express";
import pg from "pg";
import cors from "cors";

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());

// NOTA DE SEGURIDAD: En el futuro, moveremos esto a Variables de Entorno en Render
// para no dejar la contraseña visible en GitHub. Por ahora lo dejamos así para que funcione.
const connectionString =
  "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("¡Hola! El servidor de Biyuyo está funcionando en la nube ☁️");
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Crear Gasto
app.post("/expenses", async (req, res) => {
  const { macrocategoria, categoria, negocio, total_amount, user_id } =
    req.body;

  try {
    const query = `
      INSERT INTO expenses (macrocategoria, categoria, negocio, total_amount, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [macrocategoria, categoria, negocio, total_amount, user_id];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Leer Gastos
app.get("/expenses", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM expenses ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. CREAR UN INGRESO
app.post("/incomes", async (req, res) => {
  const { macrocategoria, categoria, negocio, total_amount, user_id } =
    req.body;

  try {
    const query = `
      INSERT INTO incomes (macrocategoria, categoria, negocio, total_amount, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [macrocategoria, categoria, negocio, total_amount, user_id];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando ingreso:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. LEER INGRESOS
app.get("/incomes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM incomes ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ... (Tus rutas anteriores de expenses e incomes siguen arriba) ...

// 6. CREAR RECORDATORIO
app.post("/reminders", async (req, res) => {
  const {
    user_id,
    nombre,
    macrocategoria,
    categoria,
    negocio,
    monto,
    moneda,
    fecha_proximo_pago,
    frecuencia,
    es_cuota,
    cuotas_totales,
    cuota_actual,
  } = req.body;

  try {
    const query = `
      INSERT INTO reminders (
        user_id, nombre, macrocategoria, categoria, negocio, 
        monto, moneda, fecha_proximo_pago, frecuencia, 
        es_cuota, cuotas_totales, cuota_actual
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    const values = [
      user_id,
      nombre,
      macrocategoria,
      categoria,
      negocio,
      monto,
      moneda,
      fecha_proximo_pago,
      frecuencia,
      es_cuota,
      cuotas_totales,
      cuota_actual,
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando recordatorio:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7. LEER RECORDATORIOS
app.get("/reminders", async (req, res) => {
  try {
    // Los ordenamos por fecha de próximo pago (lo más urgente primero)
    const result = await pool.query(
      "SELECT * FROM reminders ORDER BY fecha_proximo_pago ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ... (Aquí sigue const PORT = ... )

// --- EL CAMBIO IMPORTANTE ESTÁ AQUÍ ---
// Usamos process.env.PORT si existe (Render), si no, usamos 3001 (Laptop)
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en el puerto ${PORT}`);
});
