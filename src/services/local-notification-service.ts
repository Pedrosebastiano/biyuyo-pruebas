// src/services/localNotificationService.ts

interface LocalNotificationOptions {
    body?: string;
    icon?: string;
    tag?: string;
    data?: Record<string, unknown>; // Cambiado de 'any' para evitar el error
    requireInteraction?: boolean;
}

class LocalNotificationService {
    private static instance: LocalNotificationService;
    // Cambiamos el tipo de Map para que sea más compatible con entornos web
    private scheduledNotifications: Map<string, any> = new Map();

    private constructor() { }

    public static getInstance(): LocalNotificationService {
        if (!LocalNotificationService.instance) {
            LocalNotificationService.instance = new LocalNotificationService();
        }
        return LocalNotificationService.instance;
    }

    public async requestPermission(): Promise<NotificationPermission> {
        if (!("Notification" in window)) {
            console.warn("Este navegador no soporta notificaciones.");
            return "denied";
        }
        return await Notification.requestPermission();
    }

    public async displayNotification(title: string, options?: LocalNotificationOptions) {
        if (Notification.permission !== "granted") return;

        // Definimos las opciones con un casting para evitar el error de 'vibrate'
        const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
            icon: "/logo192.png",
            badge: "/favicon.ico",
            vibrate: [200, 100, 200],
            ...options,
        };

        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            // Usamos 'any' aquí solo para saltar la validación estricta del registro
            (registration as any).showNotification(title, notificationOptions);
        } else {
            new Notification(title, notificationOptions);
        }
    }

    public scheduleNotification(id: string, title: string, date: Date, options?: LocalNotificationOptions): void {
        const delay = date.getTime() - Date.now();

        if (this.scheduledNotifications.has(id)) {
            clearTimeout(this.scheduledNotifications.get(id));
        }

        if (delay <= 0) {
            if (delay > -60000) this.displayNotification(title, options);
            return;
        }

        if (delay > 2147483647) return; 

        const timeoutId = setTimeout(() => {
            this.displayNotification(title, options);
            this.scheduledNotifications.delete(id);
        }, delay);

        this.scheduledNotifications.set(id, timeoutId);
    }

    public cancelNotification(id: string): void {
        const timeout = this.scheduledNotifications.get(id);
        if (timeout) {
            clearTimeout(timeout);
            this.scheduledNotifications.delete(id);
        }
    }
}

export const localNotificationService = LocalNotificationService.getInstance();