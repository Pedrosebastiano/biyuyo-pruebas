import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import https from "https";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';

// 1. Configuración de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "../../public/rates.json");

// Configuración de Supabase
const supabaseUrl = "https://pmjjguyibxydzxnofcjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI";
const supabase = createClient(supabaseUrl, supabaseKey);

interface RateData {
  date: string;
  value: number;
  lastUpdated: string;
}

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

async function sendAlert(error: string) {
  console.error(`🔴 [ALERTA] Falló el scraper BCV: ${error}`);
  // Aquí podrías agregar notificaciones por email, Slack, etc.
}

async function scrapeBCV() {
  console.log("🔄 Ejecutando scraper del BCV...");

  try {
    const { data } = await axiosInstance.get("https://www.bcv.org.ve", {
      timeout: 30000, // 30 segundos de timeout
    });
    const $ = cheerio.load(data);

    // Selector correcto basado en tu HTML
    const usdText = $("#dolar .col-sm-6.centrado strong").text().trim();

    // Debug: Ver qué texto capturó
    console.log(`🔎 Texto encontrado: "${usdText}"`);

    if (!usdText)
      throw new Error("Selector del dólar no encontrado en el HTML");

    // Limpieza: El BCV usa coma decimal, JS usa punto
    const rateValue = parseFloat(usdText.replace(",", "."));

    if (isNaN(rateValue))
      throw new Error(`El valor extraído no es un número válido: ${usdText}`);

    // Fecha del sistema en zona horaria de Venezuela (UTC-4)
    const now = new Date();
    const venezuelaTime = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    const formattedDate = `${venezuelaTime.getDate().toString().padStart(2, "0")}/${(venezuelaTime.getMonth() + 1).toString().padStart(2, "0")}/${venezuelaTime.getFullYear()}`;
    
    // Formato ISO para Supabase (YYYY-MM-DD)
    const isoDate = `${venezuelaTime.getFullYear()}-${(venezuelaTime.getMonth() + 1).toString().padStart(2, "0")}-${venezuelaTime.getDate().toString().padStart(2, "0")}`;

    const newEntry: RateData = {
      date: formattedDate,
      value: rateValue,
      lastUpdated: now.toISOString(),
    };

    // GUARDAR EN SUPABASE
    console.log(`💾 Guardando en Supabase: ${rateValue} Bs. para ${isoDate}`);
    
    // Verificar si ya existe una tasa para esta fecha
    const { data: existingRate } = await supabase
      .from('exchange_rates')
      .select('rate_id, rate')
      .eq('rate_date', isoDate)
      .single();

    if (existingRate) {
      // Actualizar si el valor es diferente
      if (existingRate.rate !== rateValue) {
        const { error: updateError } = await supabase
          .from('exchange_rates')
          .update({ 
            rate: rateValue, 
            recorded_at: now.toISOString() 
          })
          .eq('rate_id', existingRate.rate_id);

        if (updateError) {
          console.error("❌ Error actualizando en Supabase:", updateError);
        } else {
          console.log(`✅ Tasa actualizada en Supabase: ${rateValue} Bs.`);
        }
      } else {
        console.log(`ℹ️ La tasa de hoy ya está registrada en Supabase (${rateValue} Bs.)`);
      }
    } else {
      // Insertar nueva tasa
      const { error: insertError } = await supabase
        .from('exchange_rates')
        .insert({
          rate: rateValue,
          rate_date: isoDate,
          recorded_at: now.toISOString()
        });

      if (insertError) {
        console.error("❌ Error insertando en Supabase:", insertError);
      } else {
        console.log(`✅ Nueva tasa guardada en Supabase: ${rateValue} Bs. para ${isoDate}`);
      }
    }

    // GUARDAR EN ARCHIVO LOCAL (como respaldo)
    let history: RateData[] = [];
    if (fs.existsSync(DATA_PATH)) {
      try {
        const fileContent = fs.readFileSync(DATA_PATH, "utf-8");
        history = JSON.parse(fileContent);
      } catch (e) {
        console.warn("⚠️ Error leyendo rates.json, creando nuevo archivo");
        history = [];
      }
    }

    // Guardar/Actualizar en archivo local
    const existsIndex = history.findIndex((r) => r.date === formattedDate);

    if (existsIndex >= 0) {
      if (history[existsIndex].value !== rateValue) {
        history[existsIndex] = newEntry;
      }
    } else {
      history.push(newEntry);
    }

    // Crear carpeta si no existe
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(DATA_PATH, JSON.stringify(history, null, 2));
    console.log("✅ Archivo rates.json actualizado exitosamente");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await sendAlert(error.message);
    process.exit(1); // Importante: Salir con error para que GitHub Actions lo detecte
  }
}

// Ejecutar el scraper
scrapeBCV();


