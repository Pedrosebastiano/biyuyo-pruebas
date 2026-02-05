import admin from "firebase-admin";
import fs from "fs";

// BUSCAR EL ARCHIVO DE CREDENCIALES
// Debes descargar tu 'serviceAccountKey.json' de Firebase Console:
// Project Settings -> Service Accounts -> Generate New Private Key
// Y guardarlo en la raíz del proyecto.
const serviceAccountPath = "./serviceAccountKey.json";

if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin inicializado correctamente.");
} else {
    console.warn("⚠️ ADVERTENCIA: No se encontró 'serviceAccountKey.json'.");
    console.warn("   Las notificaciones push desde el servidor NO funcionarán.");
    console.warn("   Descárgalo de Firebase Console y colócalo en la raíz.");
}

export const messaging = admin.messaging();
export default admin;
