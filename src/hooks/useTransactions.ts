import { useState, useEffect, useCallback } from "react";

// URL DE TU BACKEND EN RENDER
const API_URL = "https://biyuyo-pruebas.onrender.com";

export interface Transaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  currency: "USD" | "VES";
  macroCategory: string;
  category: string;
  business: string;
  date: string;
  receiptImage?: string;
}

export interface Reminder {
  id: string;
  name: string;
  amount: number;
  currency: "USD" | "VES";
  macroCategory: string;
  category: string;
  business: string;
  nextDueDate: Date;
  frequency: string;
  isInstallment: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener los datos de la NUBE (Render + Supabase)
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Pedimos Gastos e Ingresos al mismo tiempo
      const [resExpenses, resIncomes] = await Promise.all([
        fetch(`${API_URL}/expenses`),
        fetch(`${API_URL}/incomes`)
      ]);

      const expensesData = await resExpenses.json();
      const incomesData = await resIncomes.json();

      // 2. Convertimos el formato de la Base de Datos al formato de tu App
      // La BD devuelve: { macrocategoria, total_amount, created_at ... }
      // Tu App espera: { macroCategory, amount, date ... }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedExpenses: Transaction[] = expensesData.map((item: any) => ({
        id: `exp-${item.id}`,
        type: "expense",
        amount: parseFloat(item.total_amount), // Asegurar que sea número
        currency: "USD", // Por defecto USD, ya que la BD simple no tenía moneda aun
        macroCategory: item.macrocategoria,
        category: item.categoria,
        business: item.negocio,
        date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString(),
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedIncomes: Transaction[] = incomesData.map((item: any) => ({
        id: `inc-${item.id}`,
        type: "income",
        amount: parseFloat(item.total_amount),
        currency: "USD",
        macroCategory: item.macrocategoria,
        category: item.categoria,
        business: item.negocio,
        date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString(),
      }));

      // 3. Unimos todo y ordenamos por fecha (más reciente primero)
      const allTransactions = [...formattedExpenses, ...formattedIncomes].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setTransactions(allTransactions);

      // NOTA: Por ahora los recordatorios los dejamos vacíos o locales
      // porque tu backend todavía no tiene tabla de 'reminders'.
      setReminders([]); 

    } catch (error) {
      console.error("Error cargando transacciones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al abrir la app
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Estas funciones ya no guardan en local, ahora solo recargan la lista
  // (La lógica de guardar la moviste a los formularios IncomeForm/ExpenseForm)
  const refreshTransactions = () => {
    fetchTransactions();
  };

  return {
    transactions,
    reminders,
    loading,
    refreshTransactions, // Usar esto después de crear un gasto/ingreso
    // Mantenemos las firmas para que no rompa tu UI, pero ahora solo refrescan
    addTransaction: refreshTransactions, 
    addReminder: () => console.log("Falta implementar backend de recordatorios"),
  };
}