// src/hooks/usePushNotification.ts
import { useState, useEffect } from "react";
import { messaging } from "@/lib/firebase"; 
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { localNotificationService } from "@/services/local-notification-service";
//import { supabase } from "@/lib/supabase"; 

export const usePushNotification = () => {
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    useEffect(() => {
        const requestPermissionAndGetToken = async () => {
            try {
                // Pedimos permiso usando el servicio centralizado
                const permission = await localNotificationService.requestPermission();
                
                if (permission === "granted" && messaging) {
                    // Es MUY recomendable usar la VAPID Key de tu consola de Firebase
                    const currentToken = await getToken(messaging, {
                        vapidKey: "BHFMjfQKQwiMQPn0Ca_J1eavdtjLveKAg1KWgI1JV6w9Qv7YuiIFU0csnATu5L5mQNFDHH2j3Ny-8aN1OKpeTQw" 
                    });

                    if (currentToken) {
                        setFcmToken(currentToken);
                        console.log("FCM Token obtenido:", currentToken);
                        // Aquí llamarías a tu función de Supabase:
                        // await updateProfileToken(currentToken);
                    }
                }
            } catch (err) {
                console.error("Error al obtener el token de push:", err);
            }
        };

        requestPermissionAndGetToken();
    }, []);

    // Escuchar mensajes cuando la app está abierta (Foreground)
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log("Mensaje recibido en primer plano:", payload);

            // 1. Mostrar Toast visual (Sonner)
            toast.info(payload.notification?.title || "Biyuyo Alerta", {
                description: payload.notification?.body,
                action: {
                    label: "Ver",
                    onClick: () => console.log("Clic en notificación"),
                },
            });

            // 2. Disparar notificación del sistema (ruido/vibración)
            localNotificationService.displayNotification(
                payload.notification?.title || "Recordatorio",
                { 
                    body: payload.notification?.body,
                    requireInteraction: true // La notificación no se quita hasta que el usuario la vea
                }
            );
        });

        return () => unsubscribe();
    }, []);

    return { fcmToken };
};