import express from "express";
import pg from "pg";
import cors from "cors";
import cron from "node-cron";
import { messaging } from "./firebase-admin-setup.js";

const { Pool } = pg;
const app = express();

// ---------------------------------------------------------
// 1. CONFIGURACIÓN DE CORS MEJORADA (CRUCIAL PARA EL 404)
// ---------------------------------------------------------
// Esto permite que tu Frontend en el puerto 8080 hable con este servidor
app.use(cors({
  origin: ["http://localhost:8080", "http://127.0.0.1:8080"], // Orígenes permitidos
  methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
  allowedHeaders: ["Content-Type", "Authorization"] // Cabeceras permitidas
}));

app.use(express.json());

// MiddleWare de Logging (Para ver en la terminal qué llega)
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// NOTA DE SEGURIDAD: Eventualmente moveremos esto a variables de entorno.
const connectionString =
  "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ---------------------------------------------------------
// 2. INICIALIZACIÓN DE FIREBASE SEGURA
// ---------------------------------------------------------
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    // Verificamos si ya existe una app iniciada para evitar errores
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin inicializado correctamente.");
    } else {
        console.log("🔥 Firebase Admin ya estaba activo.");
    }
  } catch (err) {
    console.error("❌ Error inicializando Firebase Admin:", err.message);
  }
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON no está configurada. Envío de notificaciones deshabilitado.");
}

// --- FUNCIONES AUXILIARES DE NOTIFICACIÓN ---

async function sendFcmToTokens(tokens = [], title = "Recordatorio", body = "Tienes un nuevo recordatorio", data = {}) {
  if (!admin.apps.length) return;
  if (!Array.isArray(tokens) || tokens.length === 0) return;

  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`📨 FCM Personal: enviados=${response.successCount}, fallidos=${response.failureCount}`);
  } catch (err) {
    console.error("❌ Error enviando FCM:", err.message);
  }
}

async function sendNotificationToTopic(topic = "all", title, body, data = {}) {
  if (!admin.apps.length) return;
  
  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    topic: topic,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`📢 Notificación enviada al tema '${topic}' con éxito:`, response);
  } catch (err) {
    console.error("❌ Error enviando notificación de tema:", err.message);
  }
}

// ==========================================
// RUTAS DE LA API
// ==========================================

app.get("/", (req, res) => {
  res.send("¡Hola! El servidor de Biyuyo está funcionando y listo ☁️");
});

// --- TOKENS DE USUARIO (FCM) ---
app.post("/save-token", async (req, res) => {
  const { token, user_id } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Upsert: Si ya existe el token, actualizamos su 'updated_at'
    // Si no existe, lo insertamos.
    // Usamos ON CONFLICT(token) suponiendo que 'token' es UNIQUE en la tabla.
    const query = `
      INSERT INTO user_tokens (token, user_id, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (token) 
      DO UPDATE SET updated_at = NOW(), user_id = EXCLUDED.user_id;
    `;

    await pool.query(query, [token, user_id || null]);
    console.log("🔔 Token FCM guardado/actualizado.");
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving token:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- CRON JOB: RECORDATORIOS DIARIOS ---
// Se ejecuta 3 veces al día: 8 AM, 2 PM, 8 PM
cron.schedule("0 11,16,22 * * *", async () => {
  console.log("⏰ Ejecutando cron de recordatorios (9:00 AM)...");

  try {
    // 1. Obtener recordatorios que vencen HOY
    // (Asumimos que fecha_proximo_pago es DATE o TIMESTAMP)
    // Comparación simple de fechas (YYYY-MM-DD)
    const remindersQuery = `
            SELECT r.*, ut.token 
            FROM reminders r
            LEFT JOIN user_tokens ut ON r.user_id = ut.user_id 
            WHERE r.next_payment_date::date = CURRENT_DATE
              AND (r.notified_at IS NULL OR r.notified_at::date < CURRENT_DATE)
        `;

    const { rows } = await pool.query(remindersQuery);

    if (rows.length === 0) {
      console.log("📅 No hay recordatorios para hoy.");
      return;
    }

    console.log(`📅 Encontrados ${rows.length} recordatorios para hoy.`);

    // 2. Enviar notificaciones
    for (const row of rows) {
      let tokenToUse = row.token;

      // Si el recordatorio no tiene un user_id asociado o no hay token,
      // usamos el primer token disponible en la tabla (broadcast)
      if (!tokenToUse) {
        const fallbackResult = await pool.query("SELECT token FROM user_tokens LIMIT 1");
        if (fallbackResult.rows.length > 0) {
          tokenToUse = fallbackResult.rows[0].token;
          console.log("⚠️ Usando token de broadcast para recordatorio sin usuario.");
        } else {
          console.log("❌ No hay tokens disponibles. Saltando recordatorio.");
          continue;
        }
      }

      const message = {
        notification: {
          title: "🔔 Recordatorio de Pago",
          body: `Hoy vence tu pago de: ${row.reminder_name} ($${row.total_amount})`,
        },
        token: tokenToUse
      };

      try {
        await messaging.send(message);
        console.log(`✅ Notificación enviada a ${row.user_id || 'broadcast'} por ${row.reminder_name}`);

        // Actualizar notified_at para evitar duplicados
        await pool.query(
          "UPDATE reminders SET notified_at = NOW() WHERE reminder_id = $1",
          [row.reminder_id]
        );
      } catch (sendError) {
        console.error(`❌ Error enviando FCM a ${row.user_id}:`, sendError);
      }
    }

  } catch (err) {
    console.error("❌ Error en cron job:", err);
  }
});

// --- ROUTE DE PRUEBA DE NOTIFICACIÓN ---
app.post("/test-notification", async (req, res) => {
  const { token } = req.body;
  try {
    await messaging.send({
      notification: {
        title: "Test del Servidor",
        body: "Si ves esto, el backend está conectado a FCM correctamente 🚀"
      },
      token: token
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USUARIOS ---
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users/token", async (req, res) => {
  const { user_id, token } = req.body;
  if (!user_id || !token) return res.status(400).json({ error: "Faltan datos" });

  try {
    await pool.query(
      `INSERT INTO user_push_tokens (user_id, token, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, token) DO UPDATE SET token = EXCLUDED.token, created_at = NOW();`,
      [user_id, token]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GASTOS ---
app.post("/expenses", async (req, res) => {
  const { macrocategoria, categoria, negocio, total_amount, user_id, receipt_image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO expenses (macrocategoria, categoria, negocio, total_amount, user_id, receipt_image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [macrocategoria, categoria, negocio, total_amount, user_id, receipt_image_url || null]
    );
    console.log("✅ Gasto guardado exitosamente");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando gasto:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/expenses", async (req, res) => {
  const { userId } = req.query;
  try {
    let query = "SELECT * FROM expenses";
    let values = [];
    if (userId) {
      query += " WHERE user_id = $1";
      values.push(userId);
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INGRESOS ---
app.post("/incomes", async (req, res) => {
  const { macrocategoria, categoria, negocio, total_amount, user_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO incomes (macrocategoria, categoria, negocio, total_amount, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      [macrocategoria, categoria, negocio, total_amount, user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/incomes", async (req, res) => {
  const { userId } = req.query;
  try {
    let query = "SELECT * FROM incomes";
    let values = [];
    if (userId) {
      query += " WHERE user_id = $1";
      values.push(userId);
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RECORDATORIOS ---
app.post("/reminders", async (req, res) => {
  const { user_id, nombre, macrocategoria, categoria, negocio, monto, fecha_proximo_pago, frecuencia, es_cuota, cuota_actual } = req.body;

  try {
    const query = `
      INSERT INTO reminders (user_id, reminder_name, macrocategoria, categoria, negocio, total_amount, next_payment_date, payment_frequency, is_installment, installment_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
    `;
    const values = [user_id, nombre, macrocategoria, categoria, negocio, monto, fecha_proximo_pago, frecuencia, es_cuota, cuota_actual];

    const result = await pool.query(query, values);
    const newReminder = result.rows[0];

    // ✨ IMMEDIATE NOTIFICATION: Si el recordatorio es para HOY, enviar notificación ahora
    const reminderDate = new Date(fecha_proximo_pago);
    const today = new Date();

    // Comparar solo las fechas (ignorar horas)
    if (reminderDate.toDateString() === today.toDateString()) {
      console.log("📲 Recordatorio creado para hoy. Enviando notificación inmediata...");

      try {
        // Obtener tokens disponibles
        const { rows: tokens } = await pool.query("SELECT token FROM user_tokens");

        if (tokens.length > 0) {
          const message = {
            notification: {
              title: "🔔 Nuevo Recordatorio",
              body: `Recordatorio creado para hoy: ${nombre} ($${monto})`,
            },
          };

          // Enviar a todos los dispositivos (o al usuario específico si tienes auth)
          for (const tokenRow of tokens) {
            try {
              await messaging.send({ ...message, token: tokenRow.token });
              console.log("✅ Notificación inmediata enviada.");
            } catch (sendErr) {
              console.error("❌ Error en notificación inmediata:", sendErr.message);
            }
          }

          // Marcar como notificado para evitar duplicado en el cron
          await pool.query(
            "UPDATE reminders SET notified_at = NOW() WHERE reminder_id = $1",
            [newReminder.reminder_id]
          );
        }
      } catch (notifErr) {
        console.error("❌ Error enviando notificación inmediata:", notifErr);
        // No fallar la creación del recordatorio si la notificación falla
      }
    }

    res.json(newReminder);
  } catch (err) {
    console.error("Error guardando recordatorio:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/reminders", async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query("SELECT * FROM reminders ORDER BY next_payment_date ASC");
    const recordatoriosFormateados = result.rows.map((row) => ({
      id: row.reminder_id,
      user_id: row.user_id,
      nombre: row.reminder_name,
      macrocategoria: row.macrocategoria,
      categoria: row.categoria,
      negocio: row.negocio,
      monto: row.total_amount,
      fecha_proximo_pago: row.next_payment_date,
      frecuencia: row.payment_frequency,
      es_cuota: row.is_installment,
      cuota_actual: row.installment_number,
    }));
    res.json(recordatoriosFormateados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- OTROS GETS (Exchange Rates, Accounts) ---
app.get("/exchange-rates", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 30");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/accounts", async (req, res) => {
  const { userId } = req.query;
  try {
    let query = "SELECT * FROM accounts";
    let values = [];
    if (userId) {
      query += " WHERE user_id = $1";
      values.push(userId);
    }
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/exchange-rates/latest", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 1");
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INICIO ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en el puerto ${PORT}`);
});