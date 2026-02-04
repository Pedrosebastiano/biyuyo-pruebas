import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { useMemo } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Distinct colors for macro categories
const COLORS = [
  "hsl(152, 69%, 31%)", // Green
  "hsl(199, 89%, 48%)", // Blue
  "hsl(262, 83%, 58%)", // Purple
  "hsl(38, 92%, 50%)",  // Orange
  "hsl(0, 84%, 60%)",   // Red
  "hsl(340, 75%, 54%)", // Pink
  "hsl(170, 75%, 41%)", // Teal
  "hsl(45, 90%, 55%)",  // Yellow
  "hsl(220, 70%, 50%)", // Indigo
  "hsl(10, 80%, 55%)",  // Burnt Orange
  "hsl(290, 70%, 50%)", // Violet
];


// Dummy data for visualization
const MOCK_DATA = [
  { macroCategory: "🧾 Alimentos y bebidas", category: "Supermercados", amount: 450.00, type: "expense" },
  { macroCategory: "🧾 Alimentos y bebidas", category: "Restaurantes", amount: 180.00, type: "expense" },
  { macroCategory: "🏠 Vivienda y hogar", category: "Alquiler", amount: 1200.00, type: "expense" },
  { macroCategory: "🏠 Vivienda y hogar", category: "Servicios", amount: 150.00, type: "expense" },
  { macroCategory: "🚗 Transporte y movilidad", category: "Gasolina", amount: 120.00, type: "expense" },
  { macroCategory: "🚗 Transporte y movilidad", category: "Mantenimiento", amount: 250.00, type: "expense" },
  { macroCategory: "🏥 Salud y bienestar", category: "Farmacia", amount: 85.00, type: "expense" },
  { macroCategory: "🎮 Entretenimiento y ocio", category: "Cine", amount: 45.00, type: "expense" },
  { macroCategory: "🎮 Entretenimiento y ocio", category: "Suscripciones", amount: 25.00, type: "expense" },
];

export function ExpenseChart() {
  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6 px-6">
        <div className="flex-1 text-center">
          <CardTitle className="text-2xl font-bold text-[#2d509e] mr-[-40px]">
            Gastos por Categoría
          </CardTitle>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center w-10 h-10 bg-white rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-50 hover:bg-gray-50 transition-colors">
              <Info className="w-6 h-6 text-[#2d509e]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <p className="text-sm font-medium text-[#2d509e]">Desglose de tus gastos segun sus categorías</p>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value}`, "Amount"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
